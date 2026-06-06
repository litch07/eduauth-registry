<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\Institution;
use App\Models\PendingRegistration;
use App\Models\User;
use App\Models\VerificationLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $days = $request->query('days', 30);
        $startDate = Carbon::now()->subDays($days);

        $overview = [
            'totalUsers' => User::whereNull('deleted_at')->count(),
            'totalStudents' => User::where('role', 'student')->whereNull('deleted_at')->count(),
            'totalUniversities' => User::where('role', 'university')->whereNull('deleted_at')->count(),
            'totalVerifiers' => User::where('role', 'verifier')->whereNull('deleted_at')->count(),
            'totalCertificates' => Certificate::whereNull('deleted_at')->count(),
            'pendingApprovals' => User::where('is_approved', false)
                ->whereNull('deleted_at')
                ->whereIn('role', ['student', 'university', 'verifier'])
                ->count(),
            'pendingProfileChanges' => \App\Models\ProfileChangeRequest::where('status', 'pending')->count(),
            'activityToday' => ActivityLog::whereDate('created_at', Carbon::today())->count(),
            'totalVerifications' => VerificationLog::count(),
        ];

        $registrations = User::where('created_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy(DB::raw('DATE(created_at)'), 'ASC')
            ->get([
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            ])
            ->pluck('count', 'date');

        $certificatesIssued = Certificate::where('issue_date', '>=', $startDate)
            ->groupBy('issue_date')
            ->orderBy('issue_date', 'ASC')
            ->get([
                DB::raw('issue_date as date'),
                DB::raw('COUNT(*) as count')
            ])
            ->pluck('count', 'date');

        $verifications = VerificationLog::where('verified_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(verified_at)'))
            ->orderBy(DB::raw('DATE(verified_at)'), 'ASC')
            ->get([
                DB::raw('DATE(verified_at) as date'),
                DB::raw('COUNT(*) as count')
            ])
            ->pluck('count', 'date');

        $dateRange = collect();
        for ($i = 0; $i < $days; $i++) {
            $dateRange->push(Carbon::now()->subDays($i)->format('Y-m-d'));
        }

        $trends = [
            'registrations' => $dateRange->map(fn ($date) => ['date' => $date, 'count' => $registrations[$date] ?? 0])->reverse()->values(),
            'certificatesIssued' => $dateRange->map(fn ($date) => ['date' => $date, 'count' => $certificatesIssued[$date] ?? 0])->reverse()->values(),
            'verifications' => $dateRange->map(fn ($date) => ['date' => $date, 'count' => $verifications[$date] ?? 0])->reverse()->values(),
        ];

        $topUniversities = Institution::select('institutions.name', DB::raw('COUNT(certificates.id) as certificates_count'))
            ->join('certificates', 'institutions.id', '=', 'certificates.institution_id')
            ->groupBy('institutions.id', 'institutions.name')
            ->orderBy('certificates_count', 'DESC')
            ->limit(5)
            ->get();

        $recentActivity = ActivityLog::with(['user.student', 'user.institution', 'user.verifier'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'action' => $log->action,
                'user' => $log->user ? $log->user->name : 'System',
                'time' => $log->created_at->toDateTimeString(),
                'description' => $log->description,
            ]);

        $universityAnalytics = [
            'totalActiveStudents' => \App\Models\Enrollment::where('status', 'active')->count(),
            'certificatesIssuedAllTime' => Certificate::count(),
            'certificatesIssuedThisMonth' => Certificate::whereMonth('issue_date', Carbon::now()->month)
                                                         ->whereYear('issue_date', Carbon::now()->year)
                                                         ->count(),
        ];

        // 12-month enrollment trend
        $twelveMonthsDateRange = collect();
        for ($i = 11; $i >= 0; $i--) {
            $twelveMonthsDateRange->push(Carbon::now()->subMonths($i)->format('Y-m'));
        }

        $enrollmentTrendData = \App\Models\Enrollment::select(DB::raw('DATE_FORMAT(enrollment_date, "%Y-%m") as month'), DB::raw('COUNT(*) as count'))
            ->where('enrollment_date', '>=', Carbon::now()->subMonths(11)->startOfMonth())
            ->groupBy('month')
            ->pluck('count', 'month');

        $universityAnalytics['enrollmentTrend'] = $twelveMonthsDateRange->map(fn($month) => [
            'month' => Carbon::createFromFormat('Y-m', $month)->format('M Y'),
            'count' => $enrollmentTrendData[$month] ?? 0
        ])->values();

        $universityAnalytics['departmentBreakdown'] = \App\Models\Enrollment::select('program', DB::raw('COUNT(*) as count'))
            ->groupBy('program')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $universityAnalytics['perUniversitySummary'] = Institution::withCount([
            'enrollments as total_enrolled',
            'certificates as total_certificates',
            'enrollments as total_graduated' => function ($query) {
                $query->where('status', 'graduated');
            }
        ])->get()->map(function ($inst) {
            $graduationRate = $inst->total_enrolled > 0 ? round(($inst->total_graduated / $inst->total_enrolled) * 100, 1) : 0;
            return [
                'name' => $inst->name,
                'enrolled' => $inst->total_enrolled,
                'issued' => $inst->total_certificates,
                'graduation_rate' => $graduationRate,
            ];
        })->sortByDesc('enrolled')->values();

        $totalVerifications = VerificationLog::count();
        $successfulVerifications = VerificationLog::where('verification_result', 'success')->count();
        $verificationSuccessRate = $totalVerifications > 0 ? round(($successfulVerifications / $totalVerifications) * 100, 1) : 0;

        $verifierAnalytics = [
            'totalVerifications' => $totalVerifications,
            'verificationsThisMonth' => VerificationLog::whereMonth('verified_at', Carbon::now()->month)
                                                        ->whereYear('verified_at', Carbon::now()->year)
                                                        ->count(),
            'activeAccessGrants' => \App\Models\VerifierAccess::where('expires_at', '>', Carbon::now())
                                                              ->whereNull('revoked_at')
                                                              ->distinct('student_id')
                                                              ->count('student_id'),
            'verificationSuccessRate' => $verificationSuccessRate,
        ];

        $verificationTrendData = VerificationLog::select(DB::raw('DATE_FORMAT(verified_at, "%Y-%m") as month'), DB::raw('COUNT(*) as count'))
            ->where('verified_at', '>=', Carbon::now()->subMonths(11)->startOfMonth())
            ->groupBy('month')
            ->pluck('count', 'month');

        $verifierAnalytics['verificationTrend'] = $twelveMonthsDateRange->map(fn($month) => [
            'month' => Carbon::createFromFormat('Y-m', $month)->format('M Y'),
            'count' => $verificationTrendData[$month] ?? 0
        ])->values();

        $verifierAnalytics['mostVerifiedInstitutions'] = Institution::select('institutions.name', DB::raw('COUNT(verification_logs.id) as verifications_count'))
            ->join('certificates', 'institutions.id', '=', 'certificates.institution_id')
            ->join('verification_logs', 'certificates.id', '=', 'verification_logs.certificate_id')
            ->groupBy('institutions.id', 'institutions.name')
            ->orderByDesc('verifications_count')
            ->limit(5)
            ->get();

        return response()->json([
            'overview' => $overview,
            'trends' => $trends,
            'topUniversities' => $topUniversities,
            'recentActivity' => $recentActivity,
            'universityAnalytics' => $universityAnalytics,
            'verifierAnalytics' => $verifierAnalytics,
        ]);
    }
}
