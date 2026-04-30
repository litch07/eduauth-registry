<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->first();

        if (!$student) {
            return response()->json(['error' => 'Student profile not found.'], 404);
        }

        $recentCertificates = Certificate::with(['institution', 'issuedBy'])
            ->where('student_id', $student->id)
            ->whereNull('revoked_at')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_certificates' => Certificate::where('student_id', $student->id)->whereNull('revoked_at')->count(),
                'public_certificates' => Certificate::where('student_id', $student->id)->where('is_public', true)->whereNull('revoked_at')->count(),
                'private_certificates' => Certificate::where('student_id', $student->id)->where('is_public', false)->whereNull('revoked_at')->count(),
                'revoked_certificates' => Certificate::where('student_id', $student->id)->whereNotNull('revoked_at')->count(),
            ],
            'recent_certificates' => $recentCertificates,
            'student' => $student,
        ]);
    }
}
