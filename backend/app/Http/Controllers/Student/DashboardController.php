<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

            $studentId = $student->id;
            $userId = $user->id;

            $stats = cache()->remember("dashboard_student_{$userId}", 60, function () use ($studentId) {
                // Single conditional aggregation replaces 3 separate COUNT queries
                $certStats = DB::table('certificates')
                    ->selectRaw('
                        COUNT(*) as total,
                        SUM(CASE WHEN is_publicly_shareable = 1 THEN 1 ELSE 0 END) as public_count,
                        SUM(CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END) as revoked_count
                    ')
                    ->where('student_id', $studentId)
                    ->whereNull('deleted_at')
                    ->first();

                $total     = (int) ($certStats->total ?? 0);
                $public    = (int) ($certStats->public_count ?? 0);
                $revoked   = (int) ($certStats->revoked_count ?? 0);

                $pendingAccessRequests = \App\Models\CertificateAccessRequest::where('student_id', $studentId)
                    ->where('status', 'pending')
                    ->count();

                $activeAccessGrants = \App\Models\VerifierAccess::where('student_id', $studentId)
                    ->active()
                    ->count();

                return [
                    'total_certificates'      => $total,
                    'public_certificates'     => $public,
                    'private_certificates'    => $total - $public,
                    'revoked_certificates'    => $revoked,
                    'pending_access_requests' => $pendingAccessRequests,
                    'active_access_grants'    => $activeAccessGrants,
                ];
            });

            // Get recent certificates
            $recentCertificates = Certificate::with('institution')
                ->where('student_id', $studentId)
                ->orderBy('issue_date', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($cert) {
                        return [
                            'id'               => $cert->id,
                            'serial'           => $cert->serial,
                            'certificate_level' => $cert->certificate_level,
                            'institution_name' => $cert->institution?->name,
                            'issue_date'       => $cert->issue_date,
                            'is_public'        => $cert->is_publicly_shareable,
                            // Add validation for fields here if necessary
                        ];
                });

            // Get recent activities
            $recentActivities = \App\Models\ActivityLog::where('user_id', $userId)
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($log) {
                    return [
                        'id'          => $log->id,
                        'action'      => $log->action,
                        'description' => $log->description,
                        'date'        => optional($log->created_at)->toDateTimeString(),
                    ];
                });

            // Get current enrollment details
            $enrollment = \App\Models\Enrollment::where('student_id', $studentId)
                ->whereIn('status', ['active', 'withdrawal_requested'])
                ->with('institution')
                ->first();

            $currentEnrollment = null;
            if ($enrollment) {
                $currentEnrollment = [
                    'id'                      => $enrollment->id,
                    'institution_name'        => $enrollment->institution->name,
                    'enrollment_number'       => $enrollment->enrollment_number,
                    'program'                 => $enrollment->program,
                    'batch'                   => $enrollment->batch,
                    'enrollment_date'         => $enrollment->enrollment_date?->toDateString(),
                    'expected_graduation_date'=> $enrollment->expected_graduation_date?->toDateString(),
                    'status'                  => $enrollment->status,
                ];
            }

            return response()->json([
                'success'            => true,
                'stats'              => $stats,
                'recent_certificates'=> $recentCertificates,
                'recent_activities'  => $recentActivities,
                'current_enrollment' => $currentEnrollment,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
