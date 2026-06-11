<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Institution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $institution = Institution::where('user_id', $userId)->first();

        if (!$institution) {
            return response()->json(['error' => 'Institution profile not found.'], 404);
        }

        $institutionId = $institution->id;

        $stats = cache()->remember("dashboard_university_{$userId}", 60, function () use ($institutionId) {
            // Single conditional aggregation for all certificate counts
            $certStats = DB::table('certificates')
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN revoked_at IS NULL AND deleted_at IS NULL THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END) as revoked,
                    SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as total_not_deleted,
                    SUM(CASE WHEN MONTH(issue_date) = MONTH(CURDATE()) AND YEAR(issue_date) = YEAR(CURDATE()) AND deleted_at IS NULL THEN 1 ELSE 0 END) as this_month
                ')
                ->where('institution_id', $institutionId)
                ->first();

            // Single conditional aggregation for enrollment counts
            $enrollStats = DB::table('enrollments')
                ->selectRaw('
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active_count,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as graduated_count,
                    COUNT(DISTINCT CASE WHEN status IS NOT NULL THEN program END) as program_count
                ', ['active', 'graduated'])
                ->where('institution_id', $institutionId)
                ->whereNull('deleted_at')
                ->first();

            $pendingWithdrawals = DB::table('withdrawal_requests')
                ->join('enrollments', 'withdrawal_requests.enrollment_id', '=', 'enrollments.id')
                ->where('enrollments.institution_id', $institutionId)
                ->where('withdrawal_requests.status', 'pending')
                ->count();

            $pendingEnrollmentApplications = DB::table('enrollment_applications')
                ->where('institution_id', $institutionId)
                ->where('status', 'pending')
                ->count();

            return [
                'total_certificates'    => (int) ($certStats->total_not_deleted ?? 0),
                'active_certificates'   => (int) ($certStats->active ?? 0),
                'revoked_certificates'  => (int) ($certStats->revoked ?? 0),
                'pending_withdrawals'   => $pendingWithdrawals,
                'pending_enrollment_applications' => $pendingEnrollmentApplications,
                'total_enrolled'        => (int) ($enrollStats->active_count ?? 0),
                'graduated_students'    => (int) ($enrollStats->graduated_count ?? 0),
                'this_month_certificates' => (int) ($certStats->this_month ?? 0),
                'active_programs'       => (int) ($enrollStats->program_count ?? 0),
            ];
        });

        $recentCertificates = Certificate::where('institution_id', $institutionId)
            ->whereNull('deleted_at')
            ->latest()
            ->limit(5)
            ->get();

        $recentEnrollments = \App\Models\Enrollment::with(['student'])
            ->where('institution_id', $institutionId)
            ->whereNull('deleted_at')
            ->orderBy('enrollment_date', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($enr) {
                return [
                    'id' => $enr->id,
                    'student_name' => $enr->student ? trim($enr->student->first_name . ' ' . $enr->student->last_name) : 'N/A',
                    'program' => $enr->program,
                    'enrollment_date' => $enr->enrollment_date,
                    'status' => $enr->status,
                ];
            });

        return response()->json([
            'institution'         => $institution,
            'stats'               => $stats,
            'recent_certificates' => $recentCertificates,
            'recent_enrollments'  => $recentEnrollments,
        ]);
    }
}

