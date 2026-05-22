<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\SendVerificationCode;
use App\Models\ActivityLog;
use App\Models\PendingRegistration;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
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
                'date_of_birth' => 'required_if:role,student|date|before:-15 years',
                'phone' => 'required_if:role,student|required_if:role,university|required_if:role,verifier|string|max:30',
                'address' => 'required_if:role,student|required_if:role,university|string|max:1000',
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
            // store a one-way hash of the NID so we can check uniqueness without keeping the raw number
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
        // Pre-hash password so it's never stored as plaintext in pending_registrations JSON
        $registrationData['password'] = Hash::make($registrationData['password']);

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

    private function resolveDisplayName(array $payload): string
    {
        return match ($payload['role']) {
            'student' => trim(($payload['first_name'] ?? '') . ' ' . ($payload['last_name'] ?? '')) ?: 'Student',
            'university' => $payload['name'] ?? 'University',
            'verifier' => $payload['contact_person'] ?? 'Verifier',
            default => 'User',
        };
    }
}
