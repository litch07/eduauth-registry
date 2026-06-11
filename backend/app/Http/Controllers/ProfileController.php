<?php

namespace App\Http\Controllers;

use App\Mail\PendingEmailChangeMail;
use App\Models\ActivityLog;
use App\Models\Enrollment;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load(['student', 'institution', 'verifier']);

        return response()->json([
            'user' => $this->formatUser($user),
            'profile' => $this->formatProfile($user),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user()->load(['student', 'institution', 'verifier']);

        if (!in_array($user->role, ['student', 'university', 'verifier', 'admin'], true)) {
            return response()->json([
                'message' => 'Profile updates are not available for this role.',
            ], 403);
        }

        $validator = Validator::make($request->all(), $this->rulesForRole($user->role, $user->id));

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        // Detect if user is requesting an email change
        $pendingEmailMessage = null;
        $newEmail = $validated['email'] ?? null;
        $isEmailChange = $newEmail && strtolower($newEmail) !== strtolower($user->email);

        // Handle non-email profile fields inside the transaction
        DB::transaction(function () use ($user, $validated, $request) {
            if ($user->role === 'student' && $user->student) {
                $user->student->forceFill([
                    'phone'   => $validated['phone'],
                    'address' => $validated['address'] ?? null,
                ])->save();
            }

            if ($user->role === 'university' && $user->institution) {
                $user->institution->forceFill([
                    'phone'                   => $validated['phone'],
                    'address'                 => $validated['address'],
                    'website'                 => $validated['website'] ?? null,
                    'default_authority_name'  => $validated['default_authority_name'] ?? null,
                    'default_authority_title' => $validated['default_authority_title'] ?? null,
                ])->save();
            }

            if ($user->role === 'verifier' && $user->verifier) {
                $user->verifier->forceFill([
                    'phone' => $validated['phone'],
                ])->save();
            }

            ActivityLog::create([
                'user_id'     => $user->id,
                'action'      => 'profile_updated',
                'entity_type' => User::class,
                'entity_id'   => $user->id,
                'description' => 'User profile updated.',
                'metadata'    => ['role' => $user->role],
                'ip_address'  => $request->ip(),
            ]);
        });

        // Handle email change separately (outside transaction — SMTP should not hold a DB lock)
        if ($isEmailChange) {
            $token = Str::random(64);

            $user->forceFill([
                'pending_email'            => $newEmail,
                'pending_email_token'      => $token,
                'pending_email_expires_at' => now()->addHours(24),
            ])->save();

            try {
                Mail::to($newEmail)->send(new PendingEmailChangeMail(
                    $user->name ?? $user->email,
                    $token
                ));
            } catch (\Exception $mailException) {
                \Log::error('Failed to send email change verification', [
                    'user_id' => $user->id,
                    'new_email' => $newEmail,
                    'error' => $mailException->getMessage(),
                ]);
            }

            $pendingEmailMessage = "A verification link has been sent to {$newEmail}. Your email will not change until you verify the new address.";
        }

        $freshUser = $request->user()->fresh()->load(['student', 'institution', 'verifier']);

        $message = $pendingEmailMessage ?? 'Profile updated successfully.';

        return response()->json([
            'message'           => $message,
            'email_change_pending' => $isEmailChange,
            'user'              => $this->formatUser($freshUser),
            'profile'           => $this->formatProfile($freshUser),
        ]);
    }

    public function cancelEmailChange(Request $request)
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $request) {
            $user->forceFill([
                'pending_email'            => null,
                'pending_email_token'      => null,
                'pending_email_expires_at' => null,
            ])->save();

            ActivityLog::create([
                'user_id'     => $user->id,
                'action'      => 'email_change_cancelled',
                'entity_type' => User::class,
                'entity_id'   => $user->id,
                'description' => 'Pending email change cancelled by user.',
                'metadata'    => ['role' => $user->role],
                'ip_address'  => $request->ip(),
            ]);
        });

        $freshUser = $request->user()->fresh()->load(['student', 'institution', 'verifier']);

        return response()->json([
            'message' => 'Email change cancelled.',
            'user'    => $this->formatUser($freshUser),
            'profile' => $this->formatProfile($freshUser),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($request->new_password),
        ])->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'password_changed',
            'entity_type' => User::class,
            'entity_id' => $user->id,
            'description' => 'Account password changed successfully.',
            'metadata' => [
                'role' => $user->role,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function activity(Request $request)
    {
        $logs = ActivityLog::where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(function (ActivityLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'date' => optional($log->created_at)->toDateTimeString(),
                    'ip_address' => $log->ip_address,
                    'metadata' => $log->metadata,
                ];
            });

        return response()->json([
            'activities' => $logs,
        ]);
    }

    private function rulesForRole(string $role, ?int $userId = null): array
    {
        // Email validation: must be valid and unique among OTHER users.
        // If it matches the current user's email, the change is ignored.
        // If it differs, it triggers the pending-email-change flow.
        $emailRule = 'nullable|email|max:255|unique:users,email,' . $userId;

        return match ($role) {
            'admin' => [
                'email' => $emailRule,
            ],
            'student' => [
                'email'   => $emailRule,
                'phone'   => 'required|string|max:30',
                'address' => 'nullable|string|max:1000',
            ],
            'university' => [
                'email'                   => $emailRule,
                'phone'                   => 'required|string|max:30',
                'address'                 => 'required|string|max:1000',
                'website'                 => 'nullable|url|max:255',
                'default_authority_name'  => 'nullable|string|max:255',
                'default_authority_title' => 'nullable|string|max:255',
            ],
            'verifier' => [
                'email' => $emailRule,
                'phone' => 'required|string|max:30',
            ],
            default => [],
        };
    }

    private function formatUser(User $user): array
    {
        return [
            'id'                => $user->id,
            'email'             => $user->email,
            'role'              => $user->role,
            'name'              => $this->displayName($user),
            'is_approved'       => $user->is_approved,
            'email_verified_at' => $user->email_verified_at,
            'pending_email'     => $user->pending_email,
            'student'           => $user->student,
            'institution'       => $user->institution,
            'verifier'          => $user->verifier,
        ];
    }

    private function formatProfile(User $user): array
    {
        return match ($user->role) {
            'student' => [
                'type'               => 'student',
                'name'               => $this->displayName($user),
                'first_name'         => $user->student?->first_name,
                'middle_name'        => $user->student?->middle_name,
                'last_name'          => $user->student?->last_name,
                'date_of_birth'      => $user->student?->date_of_birth?->toDateString(),
                'nid_display'        => $this->buildStudentNidDisplay($user->student),
                'phone'              => $user->student?->phone,
                'address'            => $user->student?->address,
                'email'              => $user->email,
                'pending_email'      => $user->pending_email,
                'current_enrollment' => $this->getCurrentEnrollment($user),
                'enrollment_history' => $this->getEnrollmentHistory($user),
            ],
            'university' => [
                'type' => 'university',
                'name' => $user->institution?->name,
                'phone' => $user->institution?->phone,
                'address' => $user->institution?->address,
                'website' => $user->institution?->website,
                'registration_number' => $user->institution?->registration_number,
                'city' => $user->institution?->city,
                'email' => $user->email,
                'default_authority_name' => $user->institution?->default_authority_name,
                'default_authority_title' => $user->institution?->default_authority_title,
            ],
            'verifier' => [
                'type' => 'verifier',
                'company_name' => $user->verifier?->company_name,
                'contact_person' => $user->verifier?->contact_person,
                'designation' => $user->verifier?->designation,
                'phone' => $user->verifier?->phone,
                'address' => $user->verifier?->address,
                'website' => $user->verifier?->website,
                'purpose' => $user->verifier?->purpose,
                'email' => $user->email,
            ],
            'admin' => [
                'type' => 'admin',
                'email' => $user->email,
                'name' => 'System Administrator',
            ],
            default => [
                'type' => $user->role,
                'email' => $user->email,
            ],
        };
    }

    private function displayName(User $user): string
    {
        if ($user->role === 'admin') {
            return 'System Administrator';
        }

        if ($user->role === 'student' && $user->student) {
            return trim(collect([
                $user->student->first_name,
                $user->student->middle_name,
                $user->student->last_name,
            ])->filter()->implode(' '));
        }

        if ($user->role === 'university' && $user->institution) {
            return $user->institution->name;
        }

        if ($user->role === 'verifier' && $user->verifier) {
            return $user->verifier->company_name;
        }

        return $user->email;
    }

    /**
     * Build the masked NID display string for a student's own profile view.
     *
     * Students see only the last 4 characters of their NID.
     * Legacy records (nid_encrypted is null) show a fallback message.
     *
     * @param \App\Models\Student|null $student
     * @return string|null
     */
    private function buildStudentNidDisplay(?object $student): ?string
    {
        if (!$student) {
            return null;
        }

        // New record: nid_encrypted exists — decrypt and mask
        if (!empty($student->nid_encrypted)) {
            $decrypted = \App\Services\EncryptionService::decryptNid($student->nid_encrypted);

            // If decryption succeeded, mask all but last 4 chars
            if ($decrypted !== '[Encrypted]') {
                $last4 = substr($decrypted, -4);
                return '****-****-' . $last4;
            }

            // Decryption failed (shouldn't happen with correct APP_KEY)
            return '[Encrypted]';
        }

        // Legacy record: has nid_hash only, NID is not recoverable
        if (!empty($student->nid_hash)) {
            return 'NID on file (legacy — not displayable)';
        }

        return null;
    }

    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];

        if (count($parts) === 1) {
            return [$parts[0], null, $parts[0]];
        }

        if (count($parts) === 2) {
            return [$parts[0], null, $parts[1]];
        }

        $firstName = array_shift($parts);
        $lastName = array_pop($parts);
        $middleName = empty($parts) ? null : implode(' ', $parts);

        return [$firstName, $middleName, $lastName];
    }

    private function getCurrentEnrollment(User $user): ?array
    {
        if ($user->role !== 'student' || !$user->student) {
            return null;
        }

        $enrollment = Enrollment::where('student_id', $user->student->id)
            ->whereIn('status', ['active', 'withdrawal_requested'])
            ->with(['institution', 'department', 'major'])
            ->first();

        if (!$enrollment) {
            return null;
        }

        return [
            'id' => $enrollment->id,
            'institution_name' => $enrollment->institution->name,
            'enrollment_number' => $enrollment->enrollment_number,
            'roll_number' => $enrollment->roll_number,
            'department' => $enrollment->department?->name,
            'major' => $enrollment->major?->name,
            'program' => $enrollment->program,
            'batch' => $enrollment->batch,
            'enrollment_date' => $enrollment->enrollment_date?->toDateString(),
            'expected_graduation_date' => $enrollment->expected_graduation_date?->toDateString(),
            'status' => $enrollment->status,
        ];
    }

    private function getEnrollmentHistory(User $user): array
    {
        if ($user->role !== 'student' || !$user->student) {
            return [];
        }

        $enrollments = Enrollment::where('student_id', $user->student->id)
            ->whereIn('status', ['graduated', 'withdrawn'])
            ->with(['institution', 'department', 'major', 'certificates'])
            ->orderByRaw('COALESCE(actual_graduation_date, updated_at) DESC')
            ->get();

        return $enrollments->map(function ($enrollment) {
            return [
                'id' => $enrollment->id,
                'institution_name' => $enrollment->institution->name,
                'department' => $enrollment->department?->name,
                'major' => $enrollment->major?->name,
                'program' => $enrollment->program,
                'batch' => $enrollment->batch,
                'enrollment_date' => $enrollment->enrollment_date?->toDateString(),
                'end_date' => $enrollment->actual_graduation_date?->toDateString() ?? $enrollment->updated_at->toDateString(),
                'status' => $enrollment->status,
                'certificates' => $enrollment->certificates->map(function ($cert) {
                    return [
                        'id' => $cert->id,
                        'serial' => $cert->serial,
                        'is_public' => $cert->is_publicly_shareable,
                    ];
                }),
            ];
        })->toArray();
    }
}