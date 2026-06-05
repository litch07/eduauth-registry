<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\ExtensionRequest;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ExtensionRequestController extends Controller
{
    /**
     * List all extension requests for the authenticated student's active enrollment.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'success' => true,
                    'requests' => [],
                ], 200);
            }

            $requests = ExtensionRequest::with(['enrollment.institution', 'reviewer'])
                ->where('student_id', $student->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($req) {
                    return [
                        'id' => $req->id,
                        'enrollment_id' => $req->enrollment_id,
                        'institution_name' => $req->enrollment->institution->name ?? 'N/A',
                        'program' => $req->enrollment->program,
                        'current_expected_graduation' => $req->enrollment->expected_graduation_date,
                        'requested_graduation_date' => $req->requested_graduation_date,
                        'reason' => $req->reason,
                        'supporting_document_path' => $req->supporting_document_path,
                        'status' => $req->status,
                        'university_response' => $req->university_response,
                        'counter_offered_date' => $req->counter_offered_date,
                        'reviewer_name' => $req->reviewer?->email,
                        'reviewed_at' => $req->reviewed_at,
                        'created_at' => $req->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'requests' => $requests,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch extension requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new extension request.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'enrollment_id' => 'required|exists:enrollments,id',
                'requested_graduation_date' => 'required|date|after:today',
                'reason' => 'required|string|min:30',
                'supporting_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            // Find enrollment belonging to this student
            $enrollment = Enrollment::where('id', $request->enrollment_id)
                ->where('student_id', $student->id)
                ->with('institution')
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enrollment not found'
                ], 404);
            }

            // Enrollment must be active
            if ($enrollment->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot request extension. Current enrollment status: {$enrollment->status}"
                ], 409);
            }

            // Requested date must be after current expected graduation date
            $currentExpected = \Carbon\Carbon::parse($enrollment->expected_graduation_date);
            $requestedDate = \Carbon\Carbon::parse($request->requested_graduation_date);

            if ($requestedDate->lte($currentExpected)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Requested graduation date must be after the current expected graduation date (' . $currentExpected->toDateString() . ')'
                ], 422);
            }

            // Only one pending or counter_offered request allowed at a time per enrollment
            $existingRequest = ExtensionRequest::where('enrollment_id', $enrollment->id)
                ->whereIn('status', ['pending', 'counter_offered'])
                ->exists();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending or counter-offered extension request for this enrollment'
                ], 409);
            }

            // Handle file upload
            $documentPath = null;
            if ($request->hasFile('supporting_document')) {
                $documentPath = $request->file('supporting_document')
                    ->store("extension-documents/{$student->id}", 'local');
            }

            // Create extension request
            $extensionRequest = ExtensionRequest::create([
                'enrollment_id' => $enrollment->id,
                'student_id' => $student->id,
                'requested_graduation_date' => $request->requested_graduation_date,
                'reason' => $request->reason,
                'supporting_document_path' => $documentPath,
                'status' => 'pending',
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'EXTENSION_REQUESTED',
                'description' => "Requested graduation date extension for enrollment at {$enrollment->institution->name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify University
            if ($enrollment->institution && $enrollment->institution->user) {
                $enrollment->institution->user->notify(new AppNotification(
                    'EXTENSION',
                    'New Extension Request',
                    "Student {$student->first_name} {$student->last_name} requested a graduation date extension for {$enrollment->program}.",
                    '/university/enrollments?tab=extensions'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Extension request submitted successfully',
                'request' => [
                    'id' => $extensionRequest->id,
                    'status' => $extensionRequest->status,
                    'requested_graduation_date' => $extensionRequest->requested_graduation_date,
                    'created_at' => $extensionRequest->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit extension request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a pending extension request.
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();
            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            $extensionRequest = ExtensionRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->first();

            if (!$extensionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Extension request not found'
                ], 404);
            }

            if ($extensionRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending requests can be cancelled'
                ], 422);
            }

            // Delete uploaded file if exists
            if ($extensionRequest->supporting_document_path) {
                Storage::disk('local')->delete($extensionRequest->supporting_document_path);
            }

            $extensionRequest->delete();

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'EXTENSION_CANCELLED',
                'description' => 'Cancelled graduation date extension request',
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Extension request cancelled successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel extension request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Accept a counter-offered extension date.
     */
    public function acceptCounterOffer(Request $request, $id)
    {
        try {
            $user = $request->user();
            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            $extensionRequest = ExtensionRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->with(['enrollment.institution'])
                ->first();

            if (!$extensionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Extension request not found'
                ], 404);
            }

            if ($extensionRequest->status !== 'counter_offered') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request does not have a counter offer to accept'
                ], 422);
            }

            $enrollment = $extensionRequest->enrollment;

            // Update enrollment graduation date and request status atomically
            DB::transaction(function () use ($extensionRequest, $enrollment, $user) {
                $enrollment->update([
                    'expected_graduation_date' => $extensionRequest->counter_offered_date,
                ]);

                $extensionRequest->update([
                    'status' => 'approved',
                    'reviewed_at' => now(),
                ]);
            });

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'EXTENSION_COUNTER_OFFER_ACCEPTED',
                'description' => "Accepted counter-offered graduation date ({$extensionRequest->counter_offered_date->toDateString()}) for {$enrollment->program}",
                'ip_address' => $request->ip(),
            ]);

            // Notify university
            if ($enrollment->institution && $enrollment->institution->user) {
                $enrollment->institution->user->notify(new AppNotification(
                    'EXTENSION',
                    'Counter Offer Accepted',
                    "Student {$student->first_name} {$student->last_name} accepted the counter-offered graduation date for {$enrollment->program}.",
                    '/university/enrollments?tab=extensions'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Counter offer accepted. Graduation date updated.',
                'new_expected_graduation_date' => $extensionRequest->counter_offered_date,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept counter offer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Decline a counter-offered extension date.
     */
    public function declineCounterOffer(Request $request, $id)
    {
        try {
            $user = $request->user();
            $student = $user->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            $extensionRequest = ExtensionRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->with(['enrollment.institution'])
                ->first();

            if (!$extensionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Extension request not found'
                ], 404);
            }

            if ($extensionRequest->status !== 'counter_offered') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request does not have a counter offer to decline'
                ], 422);
            }

            $extensionRequest->update([
                'status' => 'rejected',
                'reviewed_at' => now(),
            ]);

            $enrollment = $extensionRequest->enrollment;

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'EXTENSION_COUNTER_OFFER_DECLINED',
                'description' => "Declined counter-offered graduation date for {$enrollment->program}",
                'ip_address' => $request->ip(),
            ]);

            // Notify university
            if ($enrollment->institution && $enrollment->institution->user) {
                $enrollment->institution->user->notify(new AppNotification(
                    'EXTENSION',
                    'Counter Offer Declined',
                    "Student {$student->first_name} {$student->last_name} declined the counter-offered graduation date for {$enrollment->program}.",
                    '/university/enrollments?tab=extensions'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Counter offer declined.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to decline counter offer',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
