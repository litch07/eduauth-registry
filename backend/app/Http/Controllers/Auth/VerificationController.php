<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\SendApprovalRequest;
use App\Models\ActivityLog;
use App\Models\Institution;
use App\Models\PendingRegistration;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class VerificationController extends Controller
{
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $verification = PendingRegistration::where('email', $request->email)->valid()->first();

        if (!$verification || !Hash::check($request->code, $verification->code_hash)) {
            if ($verification) {
                $verification->increment('attempts');
            }

            return response()->json(['error' => 'Invalid or expired verification code.'], 422);
        }

        $registrationData = $verification->registration_data ?? [];

        if (empty($registrationData['role']) || empty($registrationData['email'])) {
            return response()->json(['error' => 'Registration data is missing. Please register again.'], 422);
        }

        if (empty($registrationData['password'])) {
            return response()->json(['error' => 'Registration password is missing. Please register again.'], 422);
        }

        $user = DB::transaction(function () use ($verification, $registrationData, $request) {
            // Password is already hashed in registration_data (hashed during registration step)
            // Use forceFill to bypass the User model's 'hashed' cast and avoid double-hashing
            $user = new User();
            $user->forceFill([
                'email' => $registrationData['email'],
                'password' => $registrationData['password'],
                'role' => $registrationData['role'],
                'is_approved' => false,
                'email_verified_at' => now(),
            ]);
            $user->save();

            if ($registrationData['role'] === 'student') {
                Student::create([
                    'user_id'       => $user->id,
                    'first_name'    => $registrationData['first_name'],
                    'middle_name'   => $registrationData['middle_name'] ?? null,
                    'last_name'     => $registrationData['last_name'],
                    'nid_hash'      => $registrationData['nid_hash'],
                    'nid_encrypted' => $registrationData['nid_encrypted'] ?? null,
                    'date_of_birth' => $registrationData['date_of_birth'],
                    'gender'        => $registrationData['gender'],
                    'phone'         => $registrationData['phone'],
                    'address'       => $registrationData['address'] ?? null,
                ]);
            } elseif ($registrationData['role'] === 'university') {
                Institution::create([
                    'user_id' => $user->id,
                    'name' => $registrationData['name'],
                    'registration_number' => $registrationData['registration_number'],
                    'address' => $registrationData['address'],
                    'city' => $registrationData['city'],
                    'phone' => $registrationData['phone'],
                ]);
            } else {
                Verifier::create([
                    'user_id' => $user->id,
                    'company_name' => $registrationData['company_name'],
                    'contact_person' => $registrationData['contact_person'],
                    'designation' => $registrationData['designation'] ?? null,
                    'email' => $registrationData['email'],
                    'phone' => $registrationData['phone'],
                    'purpose' => $registrationData['purpose'],
                    'address' => $registrationData['address'] ?? null,
                ]);
            }

            $verification->forceFill([
                'verified_at' => now(),
                'attempts' => 0,
            ])->save();

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'email_verified',
                'entity_type' => User::class,
                'entity_id' => $user->id,
                'description' => 'Email address verified successfully.',
                'metadata' => [
                    'email' => $user->email,
                ],
                'ip_address' => $request->ip(),
            ]);

            return $user;
        });

        $this->notifyAdminsAboutVerifiedRegistration($user);

        return response()->json([
            'message' => 'Email verified successfully.',
            'redirect_url' => '/email-verified',
        ]);
    }

    public function resendVerificationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = PendingRegistration::where('email', $request->email)
            ->whereNull('verified_at')
            ->first();

        if (!$user) {
            return response()->json(['error' => 'No pending registration found for this email.'], 404);
        }

        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PendingRegistration::updateOrCreate(
            ['email' => $user->email],
            [
                'user_name' => $user->user_name,
                'registration_role' => $user->registration_role,
                'code_hash' => Hash::make($verificationCode),
                'expires_at' => now()->addMinutes(10),
                'verified_at' => null,
                'attempts' => 0,
                'registration_data' => $user->registration_data,
            ]
        );

        ActivityLog::create([
            'user_id' => null,
            'action' => 'verification_code_resent',
            'entity_type' => PendingRegistration::class,
            'entity_id' => null,
            'description' => 'Verification code was reissued.',
            'metadata' => [
                'email' => $user->email,
            ],
            'ip_address' => $request->ip(),
        ]);

        try {
            Mail::to($user->email)->send(
                new \App\Mail\SendVerificationCode(
                    $user->email,
                    $verificationCode,
                    $user->user_name
                )
            );
        } catch (\Exception $mailException) {
            \Log::error('Failed to send verification email during resend', [
                'email' => $user->email,
                'error' => $mailException->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Verification code resent, but there was an error sending the email.',
                'verification_code' => app()->environment('local') ? $verificationCode : null,
            ], 200);
        }

        return response()->json([
            'message' => 'Verification code resent successfully.',
            'verification_code' => app()->environment('local') ? $verificationCode : null,
        ]);
    }

    private function notifyAdminsAboutVerifiedRegistration(User $user): void
    {
        $admins = User::where('role', 'admin')->get();

        if ($admins->isEmpty()) {
            \Log::warning('No admin email addresses were found for approval notification.', [
                'user_id' => $user->id,
                'email'   => $user->email,
            ]);

            return;
        }

        try {
            Mail::to($admins->pluck('email')->filter()->values()->all())->send(new SendApprovalRequest($user->fresh(['student', 'institution', 'verifier'])));
            
            foreach ($admins as $admin) {
                $admin->notify(new AppNotification(
                    'APPROVAL',
                    'New User Pending Approval',
                    "User {$user->email} has registered and requires approval.",
                    '/admin/user-approvals'
                ));
            }
        } catch (\Throwable $throwable) {
            \Log::error('Failed to send admin approval notification', [
                'user_id' => $user->id,
                'email'   => $user->email,
                'error'   => $throwable->getMessage(),
            ]);
        }
    }

    public function verifyEmailChange(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('pending_email_token', $request->token)
            ->whereNotNull('pending_email')
            ->where('pending_email_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid or expired verification link.'], 422);
        }

        DB::transaction(function () use ($user, $request) {
            $newEmail = $user->pending_email;

            $user->forceFill([
                'email'                    => $newEmail,
                'pending_email'            => null,
                'pending_email_token'      => null,
                'pending_email_expires_at' => null,
            ])->save();

            ActivityLog::create([
                'user_id'     => $user->id,
                'action'      => 'email_changed',
                'entity_type' => User::class,
                'entity_id'   => $user->id,
                'description' => 'Email address changed and verified successfully.',
                'metadata'    => ['new_email' => $newEmail],
                'ip_address'  => $request->ip(),
            ]);
        });

        return response()->json([
            'message' => 'Email address updated successfully. You can now log in with your new email.',
        ]);
    }
}
