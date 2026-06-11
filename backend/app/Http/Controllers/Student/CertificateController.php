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

            $certificates = Certificate::with(['institution', 'enrollment'])
                ->where('student_id', $student->id)
                ->orderBy('issue_date', 'desc')
                ->get()
                ->map(function ($cert) {
                    return [
                        'id'                => $cert->id,
                        'serial'            => $cert->serial,
                        'degree_title'      => $cert->certificate_name,
                        'program_name'      => $cert->department,
                        'major'             => $cert->major,
                        'registration_no'   => $cert->enrollment?->enrollment_number,
                        'cgpa'              => $cert->cgpa,
                        'issue_date'        => $cert->issue_date,
                        'completion_date'   => $cert->convocation_date,
                        'institution_name'  => $cert->institution?->name,
                        'is_public'         => $cert->is_publicly_shareable,
                        'revoked_at'        => $cert->revoked_at,
                        'revocation_reason' => $cert->revocation_reason,
                        'created_at'        => $cert->created_at,
                        'share_link'        => $cert->share_link,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $certificates,
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

            $certificate = Certificate::with(['institution', 'enrollment'])
                ->where('id', $id)
                ->where('student_id', $student->id)
                ->first();

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate not found'
                ], 404);
            }

            return response()->json([
                'success'     => true,
                'message'     => 'Certificate retrieved successfully',
                'data' => [
                    'id'                => $certificate->id,
                    'serial'            => $certificate->serial,
                    'degree_title'      => $certificate->certificate_name,
                    'program_name'      => $certificate->department,
                    'major'             => $certificate->major,
                    'registration_no'   => $certificate->enrollment?->enrollment_number,
                    'cgpa'              => $certificate->cgpa,
                    'issue_date'        => $certificate->issue_date,
                    'completion_date'   => $certificate->convocation_date,
                    'institution_name'  => $certificate->institution?->name,
                    'is_public'         => $certificate->is_publicly_shareable,
                    'revoked_at'        => $certificate->revoked_at,
                    'revocation_reason' => $certificate->revocation_reason,
                    'share_link'        => $certificate->share_link,
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
                ->first();

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certificate not found'
                ], 404);
            }

            $certificate->is_publicly_shareable = !$certificate->is_publicly_shareable;
            $certificate->save();

            return response()->json([
                'success' => true,
                'message' => $certificate->is_publicly_shareable ? 'Certificate is now public' : 'Certificate is now private',
                'is_public' => $certificate->is_publicly_shareable,
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
