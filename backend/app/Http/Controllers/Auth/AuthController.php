<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\EmailVerificationCode;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $payload = $validator->validated();

        try {
            $result = DB::transaction(function () use ($request, $payload) {
                $user = User::create([
                    'email' => $payload['email'],
                    'password' => Hash::make($payload['password']),
                    'role' => $payload['role'],
                    'is_approved' => false,
                    'email_verified_at' => null,
                ]);

                if ($payload['role'] === 'student') {
                    Student::create([
                        'user_id' => $user->id,
                        'first_name' => $payload['first_name'],
                        'middle_name' => $payload['middle_name'] ?? null,
                        'last_name' => $payload['last_name'],
                        'nid_hash' => hash('sha256', (string) $payload['nid']),
                        'date_of_birth' => $payload['date_of_birth'],
                        'phone' => $payload['phone'],
                        'address' => $payload['address'] ?? null,
                        'student_id' => $payload['student_id'],
                    ]);
                } elseif ($payload['role'] === 'university') {
                    Institution::create([
                        'user_id' => $user->id,
                        'name' => $payload['name'],
                        'registration_number' => $payload['registration_number'],
                        'address' => $payload['address'],
                        'city' => $payload['city'],
                        'phone' => $payload['phone'],
                    ]);
                } else {
                    Verifier::create([
                        'user_id' => $user->id,
                        'company_name' => $payload['company_name'],
                        'contact_person' => $payload['contact_person'],
                        'designation' => $request->input('designation'),
                        'email' => $payload['email'],
                        'phone' => $payload['phone'],
                        'purpose' => $payload['purpose'],
                        'address' => $payload['address'] ?? null,
                    ]);
                }

                $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                EmailVerificationCode::updateOrCreate(
                    ['email' => $payload['email']],
                    [
                        'user_id' => $user->id,
                        'code_hash' => Hash::make($verificationCode),
                        'expires_at' => now()->addMinutes(10),
                        'verified_at' => null,
                        'attempts' => 0,
                    ]
                );

                ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => 'registered',
                    'entity_type' => User::class,
                    'entity_id' => $user->id,
                    'description' => 'User registered and verification code issued.',
                    'metadata' => [
                        'role' => $user->role,
                        'email' => $user->email,
                    ],
                    'ip_address' => $request->ip(),
                ]);

                return [
                    'user' => $user,
                    'verification_code' => $verificationCode,
                ];
            });

            return response()->json([
                'message' => 'Registration successful. Please check your email for the verification code.',
                'data' => [
                    'user_id' => $result['user']->id,
                    'email' => $result['user']->email,
                    'role' => $result['user']->role,
                    'verification_code' => app()->environment('local') ? $result['verification_code'] : null,
                ],
            ], 201);
        } catch (\Throwable $throwable) {
            report($throwable);

            return response()->json([
                'error' => 'Registration failed. Please try again.',
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

        $verification = EmailVerificationCode::where('email', $request->email)->valid()->first();

        if (!$verification || !Hash::check($request->code, $verification->code_hash)) {
            if ($verification) {
                $verification->increment('attempts');
            }

            return response()->json(['error' => 'Invalid or expired verification code.'], 422);
        }

        DB::transaction(function () use ($verification) {
            $verification->forceFill([
                'verified_at' => now(),
            ])->save();

            User::where('email', $verification->email)->update([
                'email_verified_at' => now(),
            ]);
        });

        $user = User::where('email', $verification->email)->first();

        if ($user) {
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
        }

        return response()->json([
            'message' => 'Email verified successfully.',
            'redirect_url' => '/email-verified',
        ]);
    }

    public function resendVerificationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if ($user->email_verified_at) {
            return response()->json(['error' => 'Email already verified.'], 422);
        }

        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerificationCode::updateOrCreate(
            ['email' => $user->email],
            [
                'user_id' => $user->id,
                'code_hash' => Hash::make($verificationCode),
                'expires_at' => now()->addMinutes(10),
                'verified_at' => null,
                'attempts' => 0,
            ]
        );

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'verification_code_resent',
            'entity_type' => User::class,
            'entity_id' => $user->id,
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
