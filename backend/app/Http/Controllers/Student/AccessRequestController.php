<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CertificateAccessRequest;
use App\Models\Student;
use App\Models\VerifierAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Notifications\AppNotification;

class AccessRequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $student = Student::where('user_id', $request->user()->id)->first();
            $requests = CertificateAccessRequest::with('verifier.user')
                ->where('student_id', $student->id)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'requests' => $requests,
                'pending_requests' => $requests->where('status', 'pending')->values(),
                'history' => $requests->whereIn('status', ['approved', 'rejected'])->values(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch access requests.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'access_duration_days' => 'required|in:7,30,90,365',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $student = Student::where('user_id', $request->user()->id)->first();
            $accessRequest = CertificateAccessRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->pending()
                ->firstOrFail();

            $accessRequest->approve($request->access_duration_days);

            // Log activity & Notify verifier
            if ($accessRequest->verifier && $accessRequest->verifier->user) {
                $accessRequest->verifier->user->notify(new AppNotification(
                    'APPROVAL',
                    'Access Request Approved',
                    "Student {$student->first_name} {$student->last_name} approved your access request for {$request->access_duration_days} days.",
                    '/verifier/accessible-certificates'
                ));
            }

            return response()->json(['success' => true, 'message' => 'Access request approved successfully.']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve access request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|min:10|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $student = Student::where('user_id', $request->user()->id)->first();
            $accessRequest = CertificateAccessRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->pending()
                ->firstOrFail();

            $accessRequest->reject($request->rejection_reason);

            // Log activity & Notify verifier
            if ($accessRequest->verifier && $accessRequest->verifier->user) {
                $accessRequest->verifier->user->notify(new AppNotification(
                    'APPROVAL',
                    'Access Request Rejected',
                    "Student {$student->first_name} {$student->last_name} rejected your access request.",
                    '/verifier/access-requests'
                ));
            }

            return response()->json(['success' => true, 'message' => 'Access request rejected successfully.']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject access request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function grantedAccess(Request $request)
    {
        try {
            $student = Student::where('user_id', $request->user()->id)->first();
            $accesses = VerifierAccess::with('verifier.user')
                ->where('student_id', $student->id)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'accesses' => $accesses->map(function ($access) {
                    return [
                        'id' => $access->id,
                        'verifier_id' => $access->verifier_id,
                        'student_id' => $access->student_id,
                        'request_id' => $access->request_id,
                        'company_name' => $access->verifier?->company_name,
                        'contact_person' => $access->verifier?->contact_person,
                        'granted_at' => $access->granted_at,
                        'expires_at' => $access->expires_at,
                        'revoked_at' => $access->revoked_at,
                        'is_active' => $access->isActive(),
                        'request' => $access->request,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            \Log::error('Granted Access Error: ' . $e->getMessage() . ' Line: ' . $e->getLine() . ' File: ' . $e->getFile());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch granted accesses.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function revokeAccess(Request $request, $id)
    {
        try {
            $student = Student::where('user_id', $request->user()->id)->first();
            $access = VerifierAccess::where('id', $id)
                ->where('student_id', $student->id)
                ->active()
                ->firstOrFail();

            $access->revoke($request->user()->id);

            // Log activity & Email verifier (to be implemented)

            return response()->json(['success' => true, 'message' => 'Access revoked successfully.']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke access.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
