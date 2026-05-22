<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Enrollment;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

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

        DB::transaction(function () use ($user, $validated, $request) {
            if ($user->role === 'student' && $user->student) {
                $user->student->forceFill([
                    'phone' => $validated['phone'],
                    'address' => $validated['address'] ?? null,
                ])->save();
            }

            if ($user->role === 'university' && $user->institution) {
                $user->institution->forceFill([
                    'phone' => $validated['phone'],
                    'address' => $validated['address'],
                    'website' => $validated['website'] ?? null,
                ])->save();
            }

            if ($user->role === 'verifier' && $user->verifier) {
                $user->verifier->forceFill([
                    'phone' => $validated['phone'],
                    'website' => $validated['website'] ?? null,
                ])->save();
            }

            if (isset($validated['email'])) {
                $user->forceFill([
                    'email' => $validated['email'],
                ])->save();
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'profile_updated',
                'entity_type' => User::class,
                'entity_id' => $user->id,
                'description' => 'User profile updated.',
                'metadata' => [
                    'role' => $user->role,
                ],
                'ip_address' => $request->ip(),
            ]);
        });

        $freshUser = $request->user()->fresh()->load(['student', 'institution', 'verifier']);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->formatUser($freshUser),
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
        return match ($role) {
            'admin' => [
                'email' => 'required|email|max:255|unique:users,email,' . $userId,
            ],
            'student' => [
                'email' => 'required|email|max:255|unique:users,email,' . $userId,
                'phone' => 'required|string|max:30',
                'address' => 'nullable|string|max:1000',
            ],
            'university' => [
                'email' => 'required|email|max:255|unique:users,email,' . $userId,
                'phone' => 'required|string|max:30',
                'address' => 'required|string|max:1000',
                'website' => 'nullable|url|max:255',
            ],
            'verifier' => [
                'email' => 'required|email|max:255|unique:users,email,' . $userId,
                'phone' => 'required|string|max:30',
                'website' => 'nullable|url|max:255',
            ],
            default => [],
        };
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'name' => $this->displayName($user),
            'is_approved' => $user->is_approved,
            'email_verified_at' => $user->email_verified_at,
            'student' => $user->student,
            'institution' => $user->institution,
            'verifier' => $user->verifier,
        ];
    }

    private function formatProfile(User $user): array
    {
        return match ($user->role) {
            'student' => [
                'type' => 'student',
                'name' => $this->displayName($user),
                'first_name' => $user->student?->first_name,
                'middle_name' => $user->student?->middle_name,
                'last_name' => $user->student?->last_name,
                'date_of_birth' => $user->student?->date_of_birth?->toDateString(),
                'nid_hash' => $user->student?->nid_hash ? ('****' . substr($user->student->nid_hash, -6)) : null,
                'phone' => $user->student?->phone,
                'address' => $user->student?->address,
                'student_id' => $user->student?->student_id,
                'email' => $user->email,
                'current_enrollment' => $this->getCurrentEnrollment($user),
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
            ->with('institution')
            ->first();

        if (!$enrollment) {
            return null;
        }

        return [
            'id' => $enrollment->id,
            'institution_name' => $enrollment->institution->name,
            'enrollment_number' => $enrollment->enrollment_number,
            'program' => $enrollment->program,
            'batch' => $enrollment->batch,
            'enrollment_date' => $enrollment->enrollment_date?->toDateString(),
            'expected_graduation_date' => $enrollment->expected_graduation_date?->toDateString(),
            'status' => $enrollment->status,
        ];
    }
}