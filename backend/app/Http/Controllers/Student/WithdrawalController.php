<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WithdrawalController extends Controller
{
    /**
     * Student requests withdrawal from enrollment
     */
    public function requestWithdrawal(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'enrollment_id' => 'required|exists:enrollments,id',
                'reason' => 'required|string|min:20|max:1000',
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

            // Check if already requested
            $pendingRequest = WithdrawalRequest::where('enrollment_id', $enrollment->id)
                ->where('status', 'pending')
                ->exists();

            if ($pendingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal request already pending'
                ], 409);
            }

            // Check if enrollment is in a valid state for withdrawal
            if (!in_array($enrollment->status, ['active', 'suspended'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot request withdrawal. Current enrollment status: {$enrollment->status}"
                ], 409);
            }

            // Create withdrawal request
            $withdrawalRequest = WithdrawalRequest::create([
                'enrollment_id' => $enrollment->id,
                'student_id' => $student->id,
                'reason' => $request->reason,
                'status' => 'pending',
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'WITHDRAWAL_REQUESTED',
                'description' => "Requested withdrawal from {$enrollment->institution->name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify University
            if ($enrollment->institution && $enrollment->institution->user) {
                $enrollment->institution->user->notify(new AppNotification(
                    'WITHDRAWAL',
                    'New Withdrawal Request',
                    "Student {$user->student->first_name} {$user->student->last_name} requested withdrawal from {$enrollment->program}.",
                    '/university/enrollments'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request submitted successfully',
                'request' => [
                    'id' => $withdrawalRequest->id,
                    'status' => $withdrawalRequest->status,
                    'created_at' => $withdrawalRequest->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit withdrawal request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get withdrawal requests for current student
     */
    public function myRequests(Request $request)
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

            $requests = WithdrawalRequest::with(['enrollment.institution', 'reviewer'])
                ->whereHas('enrollment', function ($query) use ($student) {
                    $query->where('student_id', $student->id);
                })
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($req) {
                    return [
                        'id' => $req->id,
                        'enrollment_id' => $req->enrollment_id,
                        'institution_name' => $req->enrollment->institution->name ?? 'N/A',
                        'program' => $req->enrollment->program,
                        'requested_by' => 'student',
                        'reason' => $req->reason,
                        'status' => $req->status,
                        'requested_at' => $req->created_at,
                        'responded_at' => $req->reviewed_at,
                        'response_message' => $req->rejection_note,
                    ];
                });

            return response()->json([
                'success' => true,
                'requests' => $requests,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch withdrawal requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
