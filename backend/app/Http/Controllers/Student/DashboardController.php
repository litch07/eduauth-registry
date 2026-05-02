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
                ->whereNull('deleted_at')
                ->count();

            $publicCertificates = Certificate::where('student_id', $student->id)
                ->where('is_public', true)
                ->whereNull('deleted_at')
                ->count();

            $revokedCertificates = Certificate::where('student_id', $student->id)
                ->whereNotNull('revoked_at')
                ->whereNull('deleted_at')
                ->count();

            // Get recent certificates
            $recentCertificates = Certificate::with('institution')
                ->where('student_id', $student->id)
                ->whereNull('deleted_at')
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
                            'is_public' => $cert->is_public,
                            // Add validation for fields here if necessary
                        ];
                });

            return response()->json([
                'success' => true,
                'stats' => [
                    'total_certificates' => $totalCertificates,
                    'public_certificates' => $publicCertificates,
                    'private_certificates' => $totalCertificates - $publicCertificates,
                    'revoked_certificates' => $revokedCertificates,
                ],
                'recent_certificates' => $recentCertificates,
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
