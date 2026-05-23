<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get student dashboard with stats and recent certificates
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $student = Student::where('user_id', $user->id)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            // Count certificates
            $totalCertificates = Certificate::where('student_id', $student->id)
                ->count();

            $publicCertificates = Certificate::where('student_id', $student->id)
                ->where('is_publicly_shareable', true)
                ->count();

            $revokedCertificates = Certificate::where('student_id', $student->id)
                ->whereNotNull('revoked_at')
                ->count();

            $pendingAccessRequests = \App\Models\CertificateAccessRequest::where('student_id', $student->id)
                ->where('status', 'pending')
                ->count();

            $activeAccessGrants = \App\Models\VerifierAccess::where('student_id', $student->id)
                ->active()
                ->count();

            // Get recent certificates
            $recentCertificates = Certificate::with('institution')
                ->where('student_id', $student->id)
                ->orderBy('issue_date', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($cert) {
                        return [
                            'id' => $cert->id,
                            'serial' => $cert->serial,
                            'degree_title' => $cert->degree_title,
                            'institution_name' => $cert->institution?->name,
                            'issue_date' => $cert->issue_date,
                            'is_public' => $cert->is_publicly_shareable,
                            // Add validation for fields here if necessary
                        ];
                });

            // Get recent activities
            $recentActivities = \App\Models\ActivityLog::where('user_id', $user->id)
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'action' => $log->action,
                        'description' => $log->description,
                        'date' => optional($log->created_at)->toDateTimeString(),
                    ];
                });

            // Get current enrollment details
            $enrollment = \App\Models\Enrollment::where('student_id', $student->id)
                ->whereIn('status', ['active', 'withdrawal_requested'])
                ->with('institution')
                ->first();

            $currentEnrollment = null;
            if ($enrollment) {
                $currentEnrollment = [
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

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_certificates' => $totalCertificates,
                    'public_certificates' => $publicCertificates,
                    'private_certificates' => $totalCertificates - $publicCertificates,
                    'revoked_certificates' => $revokedCertificates,
                    'pending_access_requests' => $pendingAccessRequests,
                    'active_access_grants' => $activeAccessGrants,
                ],
                'recent_certificates' => $recentCertificates,
                'recent_activities' => $recentActivities,
                'current_enrollment' => $currentEnrollment,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
