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

        return response()->json([
            'overview' => $overview,
            'trends' => $trends,
            'topUniversities' => $topUniversities,
            'recentActivity' => $recentActivity,
        ]);
    }
}
