<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ProfileChangeRequest;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileChangeRequestController extends Controller
{
    /**
     * List all profile change requests with filtering.
     */
    public function index(Request $request)
    {
        $query = ProfileChangeRequest::with(['user:id,email,role', 'reviewer:id,email']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Default to showing pending first
            $query->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END");
        }

        if ($request->filled('field_name')) {
            $query->where('field_name', $request->field_name);
        }

        if ($request->filled('role')) {
            $query->whereHas('user', fn($q) => $q->where('role', $request->role));
        }

        $requests = $query->orderByDesc('created_at')->paginate(15);

        return response()->json([
            'success' => true,
            'requests' => $requests->map(fn($r) => $this->formatRequestForAdmin($r)),
            'pagination' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
            'pending_count' => ProfileChangeRequest::where('status', 'pending')->count(),
        ]);
    }

    /**
     * View a single request with full details.
     */
    public function show($id)
    {
        $changeRequest = ProfileChangeRequest::with(['user:id,email,role', 'reviewer:id,email'])
            ->findOrFail($id);

        $formatted = $this->formatRequestForAdmin($changeRequest);
        $formatted['documents'] = [];

        if (!empty($changeRequest->supporting_documents)) {
            foreach ($changeRequest->supporting_documents as $index => $path) {
                $formatted['documents'][] = [
                    'index' => $index,
                    'filename' => basename($path),
                    'url' => "/api/admin/profile-change-requests/{$id}/documents/{$index}",
                ];
            }
        }

        return response()->json([
            'success' => true,
            'request' => $formatted,
        ]);
    }

    /**
     * Approve a request and apply the change.
     */
    public function approve(Request $request, $id)
    {
        $changeRequest = ProfileChangeRequest::with('user.student', 'user.institution', 'user.verifier')
            ->findOrFail($id);

        if (!$changeRequest->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been reviewed.',
            ], 422);
        }

        $admin = $request->user();
        $targetUser = $changeRequest->user;

        DB::transaction(function () use ($changeRequest, $targetUser, $admin, $request) {
            // Apply the change based on field_name
            $this->applyChange($targetUser, $changeRequest->field_name, $changeRequest->requested_value);

            $changeRequest->update([
                'status' => 'approved',
                'reviewed_by' => $admin->id,
                'review_notes' => $request->input('review_notes'),
            ]);

            ActivityLog::create([
                'user_id' => $admin->id,
                'action' => 'PROFILE_CHANGE_APPROVED',
                'description' => "Approved profile change request #{$changeRequest->id} for user #{$targetUser->id} ({$changeRequest->field_name})",
                'ip_address' => $request->ip(),
            ]);

            ActivityLog::create([
                'user_id' => $targetUser->id,
                'action' => 'PROFILE_CHANGE_APPROVED',
                'description' => "Your profile change request for {$changeRequest->field_name} has been approved.",
                'ip_address' => $request->ip(),
            ]);

            // Notify User
            $targetUser->notify(new AppNotification(
                'PROFILE_CHANGE',
                'Profile Change Approved',
                "Your profile change request for {$this->fieldLabel($changeRequest->field_name)} has been approved.",
                '/profile'
            ));
        });

        return response()->json([
            'success' => true,
            'message' => 'Change request approved and applied successfully.',
        ]);
    }

    /**
     * Reject a request.
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'review_notes' => 'required|string|min:5|max:1000',
        ], [
            'review_notes.required' => 'Please provide a reason for rejection.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $changeRequest = ProfileChangeRequest::with('user')->findOrFail($id);

        if (!$changeRequest->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been reviewed.',
            ], 422);
        }

        $admin = $request->user();

        $changeRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $admin->id,
            'review_notes' => $request->review_notes,
        ]);

        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'PROFILE_CHANGE_REJECTED',
            'description' => "Rejected profile change request #{$changeRequest->id} for user #{$changeRequest->user_id} ({$changeRequest->field_name})",
            'ip_address' => $request->ip(),
        ]);

        ActivityLog::create([
            'user_id' => $changeRequest->user_id,
            'action' => 'PROFILE_CHANGE_REJECTED',
            'description' => "Your profile change request for {$changeRequest->field_name} has been rejected.",
            'ip_address' => $request->ip(),
        ]);

        // Notify User
        $changeRequest->user->notify(new AppNotification(
            'PROFILE_CHANGE',
            'Profile Change Rejected',
            "Your profile change request for {$this->fieldLabel($changeRequest->field_name)} was rejected. Reason: {$request->review_notes}",
            '/profile'
        ));

        return response()->json([
            'success' => true,
            'message' => 'Change request has been rejected.',
        ]);
    }

    /**
     * Download a supporting document.
     */
    public function downloadDocument($id, $index)
    {
        $changeRequest = ProfileChangeRequest::findOrFail($id);

        $documents = $changeRequest->supporting_documents ?? [];

        if (!isset($documents[$index])) {
            return response()->json(['success' => false, 'message' => 'Document not found.'], 404);
        }

        $path = $documents[$index];

        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['success' => false, 'message' => 'Document file not found.'], 404);
        }

        return Storage::disk('local')->download($path, basename($path));
    }

    /**
     * Apply the approved change to the user's profile.
     */
    private function applyChange(User $user, string $fieldName, string $value): void
    {
        match ($fieldName) {
            'email' => $user->forceFill(['email' => $value])->save(),
            'first_name' => $user->student?->forceFill(['first_name' => $value])->save(),
            'middle_name' => $user->student?->forceFill(['middle_name' => $value])->save(),
            'last_name' => $user->student?->forceFill(['last_name' => $value])->save(),
            'date_of_birth' => $user->student?->forceFill(['date_of_birth' => $value])->save(),
            'nid' => $user->student?->forceFill(['nid_hash' => hash('sha256', $value)])->save(),
            'name' => $user->institution?->forceFill(['name' => $value])->save(),
            'registration_number' => $user->institution?->forceFill(['registration_number' => $value])->save(),
            'company_name' => $user->verifier?->forceFill(['company_name' => $value])->save(),
            default => null,
        };
    }

    private function formatRequestForAdmin(ProfileChangeRequest $request): array
    {
        return [
            'id' => $request->id,
            'user_id' => $request->user_id,
            'user_email' => $request->user?->email,
            'user_role' => $request->user?->role,
            'user_name' => $request->user?->name,
            'field_name' => $request->field_name,
            'field_label' => $this->fieldLabel($request->field_name),
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

    private function fieldLabel(string $fieldName): string
    {
        return match ($fieldName) {
            'email' => 'Email Address',
            'first_name' => 'First Name',
            'middle_name' => 'Middle Name',
            'last_name' => 'Last Name',
            'date_of_birth' => 'Date of Birth',
            'nid' => 'NID / Birth Certificate',
            'name' => 'Institution Name',
            'registration_number' => 'Registration Number',
            'company_name' => 'Company Name',
            default => $fieldName,
        };
    }
}
