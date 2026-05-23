<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Institution;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $institution = Institution::where('user_id', $request->user()->id)->first();

        if (!$institution) {
            return response()->json(['error' => 'Institution profile not found.'], 404);
        }

        return response()->json([
            'institution' => $institution,
            'stats' => [
                'total_certificates' => Certificate::where('institution_id', $institution->id)->whereNull('deleted_at')->count(),
                'active_certificates' => Certificate::where('institution_id', $institution->id)->whereNull('revoked_at')->whereNull('deleted_at')->count(),
                'revoked_certificates' => Certificate::where('institution_id', $institution->id)->whereNotNull('revoked_at')->count(),
                'pending_withdrawals' => \App\Models\WithdrawalRequest::whereHas('enrollment', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                })->where('status', 'pending')->count(),
                'total_enrolled' => \App\Models\Enrollment::where('institution_id', $institution->id)->where('status', 'active')->count(),
                'graduated_students' => \App\Models\Enrollment::where('institution_id', $institution->id)->where('status', 'graduated')->count(),
                'this_month_certificates' => Certificate::where('institution_id', $institution->id)->whereMonth('issue_date', now()->month)->whereYear('issue_date', now()->year)->whereNull('deleted_at')->count(),
                'active_programs' => \App\Models\Enrollment::where('institution_id', $institution->id)->distinct('program')->count('program'),
            ],
            'recent_certificates' => Certificate::where('institution_id', $institution->id)->whereNull('deleted_at')->latest()->limit(5)->get(),
        ]);
    }
}
