<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    /**
     * Get all certificates for the authenticated student
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

            $certificates = Certificate::with('institution')
                ->where('student_id', $student->id)
                ->whereNull('deleted_at')
                ->orderBy('issue_date', 'desc')
                ->get()
                ->map(function ($cert) {
                    return [
                        'id' => $cert->id,
                        'serial' => $cert->serial,
                        'degree_title' => $cert->degree_title,
                        'program_name' => $cert->program_name,
                        'major' => $cert->major,
                        'registration_no' => $cert->registration_no,
                        'cgpa' => $cert->cgpa,
                        'issue_date' => $cert->issue_date,
                        'completion_date' => $cert->completion_date,
                        'institution_name' => $cert->institution?->name,
                        'is_public' => $cert->is_public,
                        'revoked_at' => $cert->revoked_at,
                        'created_at' => $cert->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'certificates' => $certificates,
                'total' => $certificates->count(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch certificates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single certificate details
     */
    public function show(Request $request, $id)
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

            $certificate = Certificate::with('institution')
                ->where('id', $id)
                ->where('student_id', $student->id)
                ->whereNull('deleted_at')
                ->first();

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'certificate' => [
                    'id' => $certificate->id,
                    'serial' => $certificate->serial,
                    'degree_title' => $certificate->degree_title,
                    'program_name' => $certificate->program_name,
                    'major' => $certificate->major,
                    'registration_no' => $certificate->registration_no,
                    'cgpa' => $certificate->cgpa,
                    'issue_date' => $certificate->issue_date,
                    'completion_date' => $certificate->completion_date,
                    'institution_name' => $certificate->institution?->name,
                    'is_public' => $certificate->is_public,
                    'revoked_at' => $certificate->revoked_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle certificate visibility (public/private)
     */
    public function toggleVisibility(Request $request, $id)
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

            $certificate = Certificate::where('id', $id)
                ->where('student_id', $student->id)
                ->whereNull('deleted_at')
                ->first();

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate not found'
                ], 404);
            }

            $certificate->is_public = !$certificate->is_public;
            $certificate->save();

            return response()->json([
                'success' => true,
                'message' => $certificate->is_public ? 'Certificate is now public' : 'Certificate is now private',
                'is_public' => $certificate->is_public,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update visibility',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
