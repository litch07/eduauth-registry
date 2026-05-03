<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\SendApprovalRequest;
use App\Mail\SendVerificationCode;
use App\Models\ActivityLog;
use App\Models\Institution;
use App\Models\PendingRegistration;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
                'email' => 'required|email',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|in:student,university,verifier',
                'first_name' => 'required_if:role,student|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required_if:role,student|string|max:100',
                'nid' => 'required_if:role,student|string|max:50',
                'date_of_birth' => 'required_if:role,student|date|before:today',
                'phone' => 'required_if:role,student|required_if:role,university|required_if:role,verifier|string|max:30',
                'address' => 'required_if:role,student|required_if:role,university|string|max:1000',
                'student_id' => 'required_if:role,student|string|max:50|unique:students,student_id',
                'name' => 'required_if:role,university|string|max:255',
                'registration_number' => 'required_if:role,university|string|max:100|unique:institutions,registration_number',
                'city' => 'required_if:role,university|string|max:120',
                'contact_person' => 'required_if:role,verifier|string|max:255',
                'company_name' => 'required_if:role,verifier|string|max:255',
                'purpose' => 'required_if:role,verifier|string|max:1000',
            ],
            [
                'email.email' => 'Enter a valid email address.',
                'password.min' => 'Password must be at least 8 characters.',
                'password.confirmed' => 'Password confirmation does not match.',
                'student_id.unique' => 'This student ID is already registered. Please use a different student ID.',
                'registration_number.unique' => 'This registration number is already registered. Please use a different registration number.',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payload = $validator->validated();
        $payload['email'] = strtolower(trim($payload['email']));

        $verifiedUser = User::where('email', $payload['email'])->whereNotNull('email_verified_at')->first();
        if ($verifiedUser) {
            return response()->json([
                'errors' => [
                    'email' => ['This email is already verified. Please log in instead.'],
                ],
            ], 422);
        }

        if ($payload['role'] === 'student') {
            $nidHash = hash('sha256', (string) $payload['nid']);

            if (Student::where('nid_hash', $nidHash)->whereNull('deleted_at')->exists()) {
                return response()->json([
                    'errors' => [
                        'nid' => ['This NID is already registered. Please use a different NID.'],
                    ],
                ], 422);
            }

            $payload['nid_hash'] = $nidHash;
            unset($payload['nid']);
        }

        $registrationData = $payload;
        unset($registrationData['password_confirmation']);

        try {
            $pendingRegistration = DB::transaction(function () use ($request, $payload, $registrationData) {
                $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                PendingRegistration::updateOrCreate(
                    ['email' => $payload['email']],
                    [
                        'user_name' => $this->resolveDisplayName($payload),
                        'registration_role' => $payload['role'],
                        'code_hash' => Hash::make($verificationCode),
                        'expires_at' => now()->addMinutes(10),
                        'verified_at' => null,
                        'attempts' => 0,
                        'registration_data' => $registrationData,
                    ]
                );

                ActivityLog::create([
                    'user_id' => null,
                    'action' => 'registered',
                    'entity_type' => PendingRegistration::class,
                    'entity_id' => null,
                    'description' => 'Registration pending email verification.',
                    'metadata' => [
                        'role' => $payload['role'],
                        'email' => $payload['email'],
                    ],
                    'ip_address' => $request->ip(),
                ]);

                return [
                    'verification_code' => $verificationCode,
                ];
            });

            try {
                Mail::to($payload['email'])->send(
                    new SendVerificationCode(
                        $payload['email'],
                        $pendingRegistration['verification_code'],
                        $this->resolveDisplayName($payload)
                    )
                );
            } catch (\Exception $mailException) {
                \Log::error('Failed to send verification email', [
                    'email' => $payload['email'],
                    'error' => $mailException->getMessage(),
                ]);

                return response()->json([
                    'message' => 'Registration saved. Please check your email (including spam folder) for the verification code.',
                    'data' => [
                        'email' => $payload['email'],
                        'role' => $payload['role'],
                        'verification_code' => app()->environment('local') ? $pendingRegistration['verification_code'] : null,
                    ],
                    'warning' => 'Email delivery may be delayed. Check spam folder.',
                ], 201);
            }

            return response()->json([
                'message' => 'Registration saved. Please check your email for the verification code.',
                'data' => [
                    'email' => $payload['email'],
                    'role' => $payload['role'],
                    'verification_code' => app()->environment('local') ? $pendingRegistration['verification_code'] : null,
                ],
            ], 201);
        } catch (\Throwable $throwable) {
            report($throwable);
            \Log::error('Registration error', [
                'message' => $throwable->getMessage(),
                'file' => $throwable->getFile(),
                'line' => $throwable->getLine(),
            ]);

            return response()->json([
                'error' => 'Registration failed. Please try again later.',
                'details' => app()->environment('local') ? $throwable->getMessage() : null,
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid email or password. Please try again.'], 401);
        }

        if (!$user->email_verified_at) {
            return response()->json(['error' => 'Email not verified. Please check your inbox.'], 403);
        }

        if (!$user->is_approved && $user->role !== 'admin') {
            return response()->json(['error' => 'Account pending admin approval. You\'ll be notified by email.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        $user->load(['student', 'institution', 'verifier']);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'logged_in',
            'entity_type' => User::class,
            'entity_id' => $user->id,
            'description' => 'User authenticated successfully.',
            'metadata' => [
                'role' => $user->role,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        if ($user) {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'logged_out',
                'entity_type' => User::class,
                'entity_id' => $user->id,
                'description' => 'User logged out from the API.',
                'metadata' => [
                    'role' => $user->role,
                ],
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $user->load(['student', 'institution', 'verifier']);

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

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
            $user = User::create([
                'email' => $registrationData['email'],
                'password' => $registrationData['password'],
                'role' => $registrationData['role'],
                'is_approved' => false,
                'email_verified_at' => now(),
            ]);

            if ($registrationData['role'] === 'student') {
                Student::create([
                    'user_id' => $user->id,
                    'first_name' => $registrationData['first_name'],
                    'middle_name' => $registrationData['middle_name'] ?? null,
                    'last_name' => $registrationData['last_name'],
                    'nid_hash' => $registrationData['nid_hash'],
                    'date_of_birth' => $registrationData['date_of_birth'],
                    'phone' => $registrationData['phone'],
                    'address' => $registrationData['address'] ?? null,
                    'student_id' => $registrationData['student_id'],
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

        $user = PendingRegistration::where('email', $request->email)->valid()->first();

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

        return response()->json([
            'message' => 'Verification code resent successfully.',
            'verification_code' => app()->environment('local') ? $verificationCode : null,
        ]);
    }

    private function resolveDisplayName(array $payload): string
    {
        return match ($payload['role']) {
            'student' => trim(($payload['first_name'] ?? '') . ' ' . ($payload['last_name'] ?? '')) ?: 'Student',
            'university' => $payload['name'] ?? 'University',
            'verifier' => $payload['contact_person'] ?? 'Verifier',
            default => 'User',
        };
    }

    private function notifyAdminsAboutVerifiedRegistration(User $user): void
    {
        $adminEmails = User::where('role', 'admin')->pluck('email')->filter()->values()->all();

        if (empty($adminEmails)) {
            \Log::warning('No admin email addresses were found for approval notification.', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return;
        }

        try {
            Mail::to($adminEmails)->send(new SendApprovalRequest($user->fresh(['student', 'institution', 'verifier'])));
        } catch (\Throwable $throwable) {
            \Log::error('Failed to send admin approval notification', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $throwable->getMessage(),
            ]);
        }
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'is_approved' => $user->is_approved,
            'email_verified_at' => $user->email_verified_at,
            'student' => $user->student,
            'institution' => $user->institution,
            'verifier' => $user->verifier,
            'certificates_count' => $user->relationLoaded('student') && $user->student ? $user->student->certificates()->count() : null,
        ];
    }
}
