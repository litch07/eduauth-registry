<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ProfileChangeRequest;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileChangeRequestController extends Controller
{
    /**
     * Fields that require admin approval, grouped by role.
     */
    private const APPROVABLE_FIELDS = [
        'student' => ['email', 'first_name', 'middle_name', 'last_name', 'date_of_birth', 'nid'],
        'university' => ['email', 'name', 'registration_number'],
        'verifier' => ['email', 'company_name'],
    ];

    /**
     * Human-readable labels for field names.
     */
    private const FIELD_LABELS = [
        'email' => 'Email Address',
        'first_name' => 'First Name',
        'middle_name' => 'Middle Name',
        'last_name' => 'Last Name',
        'date_of_birth' => 'Date of Birth',
        'nid' => 'NID / Birth Certificate',
        'name' => 'Institution Name',
        'registration_number' => 'Registration Number',
        'company_name' => 'Company Name',
    ];

    /**
     * Fields that require supporting documents.
     */
    private const REQUIRES_DOCUMENTS = [
        'first_name', 'middle_name', 'last_name',
        'date_of_birth', 'nid',
        'name', 'registration_number',
        'company_name',
    ];

    /**
     * Submit a new profile change request.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $role = $user->role;

        $allowedFields = self::APPROVABLE_FIELDS[$role] ?? [];

        if (empty($allowedFields)) {
            return response()->json([
                'success' => false,
                'message' => 'Profile change requests are not available for your role.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'field_name' => 'required|string|in:' . implode(',', $allowedFields),
            'requested_value' => 'required|string|max:500',
            'reason' => 'required|string|min:10|max:1000',
            'supporting_documents' => 'nullable|array|max:3',
            'supporting_documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ], [
            'field_name.in' => 'This field cannot be changed via a change request.',
            'reason.min' => 'Please provide at least 10 characters explaining the reason.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $fieldName = $request->field_name;

        if (in_array($fieldName, self::REQUIRES_DOCUMENTS) && empty($request->file('supporting_documents'))) {
            return response()->json([
                'success' => false,
                'message' => 'Supporting documents are required for this type of change.',
            ], 422);
        }

        $existingPending = ProfileChangeRequest::where('user_id', $user->id)
            ->where('field_name', $fieldName)
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending request for this field. Please wait for it to be reviewed or cancel it first.',
            ], 409);
        }

        $fieldError = $this->validateFieldValue($fieldName, $request->requested_value, $user);
        if ($fieldError) {
            return response()->json([
                'success' => false,
                'message' => $fieldError,
            ], 422);
        }

        $currentValue = $this->getCurrentValue($user, $fieldName);

        $documentPaths = [];
        if ($request->hasFile('supporting_documents')) {
            foreach ($request->file('supporting_documents') as $file) {
                $path = $file->store("profile-change-documents/{$user->id}", 'local');
                $documentPaths[] = $path;
            }
        }

        $changeRequest = ProfileChangeRequest::create([
            'user_id' => $user->id,
            'field_name' => $fieldName,
            'current_value' => $currentValue,
            'requested_value' => $request->requested_value,
            'reason' => $request->reason,
            'supporting_documents' => !empty($documentPaths) ? $documentPaths : null,
            'status' => 'pending',
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'PROFILE_CHANGE_REQUESTED',
            'description' => "Requested change for " . (self::FIELD_LABELS[$fieldName] ?? $fieldName),
            'ip_address' => $request->ip(),
        ]);

        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new AppNotification(
                'PROFILE_CHANGE',
                'New Profile Change Request',
                "User {$user->email} requested a change for " . (self::FIELD_LABELS[$fieldName] ?? $fieldName),
                '/admin/profile-change-requests'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Your change request has been submitted for admin review.',
            'request' => $this->formatRequest($changeRequest),
        ], 201);
    }

    /**
     * List current user's change requests.
     */
    public function myRequests(Request $request)
    {
        $requests = ProfileChangeRequest::where('user_id', $request->user()->id)
            ->with('reviewer:id,email')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'requests' => $requests->map(fn($r) => $this->formatRequest($r)),
            'pagination' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    /**
     * Cancel a pending request.
     */
    public function cancel(Request $request, $id)
    {
        $changeRequest = ProfileChangeRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$changeRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found.'], 404);
        }

        if (!$changeRequest->isPending()) {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be cancelled.'], 422);
        }

        if (!empty($changeRequest->supporting_documents)) {
            foreach ($changeRequest->supporting_documents as $path) {
                Storage::disk('local')->delete($path);
            }
        }

        $changeRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Change request cancelled successfully.',
        ]);
    }

    /**
     * Get current value of a field for the user.
     */
    private function getCurrentValue($user, string $fieldName): ?string
    {
        return match ($fieldName) {
            'email' => $user->email,
            'first_name' => $user->student?->first_name,
            'middle_name' => $user->student?->middle_name,
            'last_name' => $user->student?->last_name,
            'date_of_birth' => $user->student?->date_of_birth?->toDateString(),
            'nid' => '(hashed)',
            'name' => $user->institution?->name,
            'registration_number' => $user->institution?->registration_number,
            'company_name' => $user->verifier?->company_name,
            default => null,
        };
    }

    /**
     * Validate field-specific value constraints.
     */
    private function validateFieldValue(string $fieldName, string $value, $user): ?string
    {
        return match ($fieldName) {
            'email' => filter_var($value, FILTER_VALIDATE_EMAIL)
                ? (\App\Models\User::where('email', $value)->where('id', '!=', $user->id)->exists()
                    ? 'This email is already in use by another account.'
                    : null)
                : 'Please enter a valid email address.',
            'first_name', 'last_name' => (strlen($value) < 2 || strlen($value) > 50)
                ? 'Name must be between 2 and 50 characters.'
                : (preg_match("/^[a-zA-Z\\s\\-']+$/", $value) ? null : 'Name can only contain letters, spaces, hyphens, and apostrophes.'),
            'middle_name' => strlen($value) > 50
                ? 'Middle name must be at most 50 characters.'
                : null,
            'date_of_birth' => $this->validateDob($value),
            default => null,
        };
    }

    private function validateDob(string $value): ?string
    {
        try {
            $date = new \DateTime($value);
            $now = new \DateTime();
            if ($date > $now) return 'Date of birth cannot be in the future.';
            $age = $now->diff($date)->y;
            if ($age < 15) return 'You must be at least 15 years old.';
            return null;
        } catch (\Exception $e) {
            return 'Please enter a valid date (YYYY-MM-DD).';
        }
    }

    private function formatRequest(ProfileChangeRequest $request): array
    {
        return [
            'id' => $request->id,
            'field_name' => $request->field_name,
            'field_label' => self::FIELD_LABELS[$request->field_name] ?? $request->field_name,
            'current_value' => $request->current_value,
            'requested_value' => $request->requested_value,
            'reason' => $request->reason,
            'has_documents' => !empty($request->supporting_documents),
            'document_count' => $request->supporting_documents ? count($request->supporting_documents) : 0,
            'status' => $request->status,
            'review_notes' => $request->review_notes,
            'reviewer_email' => $request->reviewer?->email,
            'created_at' => $request->created_at?->toDateTimeString(),
            'updated_at' => $request->updated_at?->toDateTimeString(),
        ];
    }
}
