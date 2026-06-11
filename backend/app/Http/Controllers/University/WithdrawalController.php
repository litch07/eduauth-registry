<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Institution;
use App\Models\WithdrawalRequest;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WithdrawalController extends Controller
{
    /**
     * Get pending withdrawal requests for university
     */
    public function pendingRequests(Request $request)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $search = $request->query('search', '');

            $requests = WithdrawalRequest::with(['enrollment.student.user'])
                ->whereHas('enrollment', function ($query) use ($institution, $search) {
                    $query->where('institution_id', $institution->id);
                    if ($search) {
                        $query->where(function ($q) use ($search) {
                            $q->whereHas('student', function ($sq) use ($search) {
                                $sq->where('first_name', 'like', "%{$search}%")
                                  ->orWhere('last_name', 'like', "%{$search}%")
                                  ->orWhere('student_id', 'like', "%{$search}%");
                            })->orWhere('enrollment_number', 'like', "%{$search}%");
                        });
                    }
                })
                ->where('status', 'pending')
                ->orderBy('created_at', 'asc')
                ->paginate(10);

            $mappedRequests = $requests->getCollection()->map(function ($req) {
                return [
                    'id' => $req->id,
                    'enrollment_id' => $req->enrollment_id,
                    'student_name' => trim($req->enrollment->student->first_name . ' ' . $req->enrollment->student->last_name),
                    'student_email' => $req->enrollment->student->user->email ?? 'N/A',
                    'enrollment_number' => $req->enrollment->enrollment_number,
                    'program' => $req->enrollment->program,
                    'batch' => $req->enrollment->batch,
                    'requested_by' => 'student',
                    'reason' => $req->reason,
                    'requested_at' => $req->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'requests' => $mappedRequests,
                'pagination' => [
                    'current_page' => $requests->currentPage(),
                    'last_page' => $requests->lastPage(),
                    'total' => $requests->total(),
                    'per_page' => $requests->perPage(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch withdrawal requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve withdrawal request
     */
    public function approveWithdrawal(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'response_message' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            $withdrawalRequest = WithdrawalRequest::with('enrollment.student')
                ->where('id', $id)
                ->whereHas('enrollment', function ($query) use ($institution) {
                    $query->where('institution_id', $institution->id);
                })
                ->where('status', 'pending')
                ->first();

            if (!$withdrawalRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal request not found or already processed'
                ], 404);
            }

            // Approve request
            $withdrawalRequest->update([
                'status' => 'approved',
                'reviewed_at' => now(),
                'reviewed_by' => $user->id,
                'rejection_note' => $request->response_message ?? 'Withdrawal approved',
            ]);

            // Update enrollment status to withdrawn
            $withdrawalRequest->enrollment->update([
                'status' => 'withdrawn',
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'WITHDRAWAL_APPROVED',
                'description' => "Approved withdrawal for {$withdrawalRequest->enrollment->student->first_name} {$withdrawalRequest->enrollment->student->last_name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify Student
            if ($withdrawalRequest->enrollment->student->user) {
                $withdrawalRequest->enrollment->student->user->notify(new AppNotification(
                    'WITHDRAWAL',
                    'Withdrawal Approved',
                    "Your withdrawal request from {$institution->name} has been approved.",
                    '/profile'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request approved. Student has been withdrawn.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve withdrawal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject withdrawal request
     */
    public function rejectWithdrawal(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'response_message' => 'required|string|min:10|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            $withdrawalRequest = WithdrawalRequest::with('enrollment.student')
                ->where('id', $id)
                ->whereHas('enrollment', function ($query) use ($institution) {
                    $query->where('institution_id', $institution->id);
                })
                ->where('status', 'pending')
                ->first();

            if (!$withdrawalRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal request not found or already processed'
                ], 404);
            }

            // Reject request
            $withdrawalRequest->update([
                'status' => 'rejected',
                'reviewed_at' => now(),
                'reviewed_by' => $user->id,
                'rejection_note' => $request->response_message,
            ]);

            // Revert enrollment status back to active
            $withdrawalRequest->enrollment->update([
                'status' => 'active',
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'WITHDRAWAL_REJECTED',
                'description' => "Rejected withdrawal for {$withdrawalRequest->enrollment->student->first_name} {$withdrawalRequest->enrollment->student->last_name}. Reason: {$request->response_message}",
                'ip_address' => $request->ip(),
            ]);

            // Notify Student
            if ($withdrawalRequest->enrollment->student->user) {
                $withdrawalRequest->enrollment->student->user->notify(new AppNotification(
                    'WITHDRAWAL',
                    'Withdrawal Rejected',
                    "Your withdrawal request from {$institution->name} was rejected.",
                    '/profile'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request rejected. Enrollment remains active.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject withdrawal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * University directly withdraws a student (no request needed)
     */
    public function withdrawStudent(Request $request, $enrollmentId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|min:20|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            $enrollment = Enrollment::where('id', $enrollmentId)
                ->where('institution_id', $institution->id)
                ->whereIn('status', ['active', 'suspended'])
                ->with('student')
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enrollment not found or not in a withdrawable state'
                ], 404);
            }

            // Create withdrawal record (initiated by university, auto-approved)
            WithdrawalRequest::create([
                'enrollment_id' => $enrollment->id,
                'student_id' => $enrollment->student->id,
                'reason' => $request->reason,
                'status' => 'approved',
                'reviewed_at' => now(),
                'reviewed_by' => $user->id,
                'rejection_note' => 'Withdrawal initiated by university',
            ]);

            // Update enrollment
            $enrollment->update(['status' => 'withdrawn']);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id'     => $user->id,
                'action'      => 'STUDENT_WITHDRAWN',
                'description' => "Withdrew {$enrollment->student->first_name} {$enrollment->student->last_name} from enrollment. Reason: {$request->reason}",
                'ip_address'  => $request->ip(),
            ]);

            // Notify student
            if ($enrollment->student->user) {
                $enrollment->student->user->notify(new AppNotification(
                    'WITHDRAWAL',
                    'Enrollment Withdrawn',
                    "Your enrollment at {$institution->name} has been withdrawn by the institution.",
                    '/student/my-university'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Student withdrawn successfully',
            ], 200);


        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to withdraw student',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
