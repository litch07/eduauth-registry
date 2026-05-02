<?php

namespace App\Http\Controllers\Verifier;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\VerificationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VerifyController extends Controller
{
    /**
     * Get verifier dashboard stats and recent verifications
     */
    public function dashboard(Request $request)
    {
        $userId = $request->user()->id;
        
        // Get stats
        $totalVerifications = VerificationLog::where('verifier_user_id', $userId)->count();
        $successfulVerifications = VerificationLog::where('verifier_user_id', $userId)
            ->where('verification_result', 'success')
            ->count();
        $failedVerifications = VerificationLog::where('verifier_user_id', $userId)
            ->where('verification_result', 'failed')
            ->count();
        $verificationsToday = VerificationLog::where('verifier_user_id', $userId)
            ->whereDate('verified_at', today())
            ->count();
        
        // Get recent verifications
        $recentVerifications = VerificationLog::where('verifier_user_id', $userId)
            ->with(['certificate'])
            ->latest('verified_at')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'serial' => $log->serial,
                    'result' => $log->verification_result,
                    'verified_at' => $log->verified_at->format('Y-m-d H:i'),
                    'details' => $log->details,
                ];
            });

        return response()->json([
            'stats' => [
                'total_verifications' => $totalVerifications,
                'successful_verifications' => $successfulVerifications,
                'failed_verifications' => $failedVerifications,
                'verifications_today' => $verificationsToday,
            ],
            'recent_verifications' => $recentVerifications,
        ]);
    }

    /**
     * Verify certificate - works for both public and authenticated users
     * If authenticated, logs the verification for the verifier
     */
    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'serial' => 'required|string|max:100',
            'date_of_birth' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'verified' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $serial = $request->serial;
        $dateOfBirth = $request->date_of_birth;

        // Find certificate with relationships
        $certificate = Certificate::with(['student', 'institution', 'issuedBy'])
            ->where('serial', $serial)
            ->whereNull('deleted_at')
            ->first();

        if (!$certificate) {
            // Log failed verification attempt
            $this->logVerification($request, null, 'not_found', false, 'Certificate not found');

            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'Certificate not found with this serial number'
            ], 404);
        }

        // Check if certificate is revoked
        if ($certificate->revoked_at) {
            $this->logVerification($request, $certificate, 'revoked', false, 'Certificate has been revoked');

            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'This certificate has been revoked and is no longer valid'
            ], 409);
        }

        // Verify date of birth matches
        $student = $certificate->student;
        $dobMatches = $student && $student->date_of_birth
            ? $student->date_of_birth->toDateString() === $dateOfBirth
            : false;

        if (!$dobMatches) {
            $this->logVerification($request, $certificate, 'dob_mismatch', false, 'Date of birth did not match');

            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'Date of birth does not match our records'
            ], 401);
        }

        // Check if certificate is publicly shareable
        // Private certificates cannot be verified by anyone
        $isPublic = $certificate->is_public;

        if (!$isPublic) {
            $this->logVerification($request, $certificate, 'private_certificate', false, 'Certificate is private and not accessible for verification');

            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'This certificate is private and cannot be verified. The student has restricted access to this certificate.'
            ], 403);
        }

        // Log successful verification
        $this->logVerification($request, $certificate, 'success', true, 'Certificate verified successfully');

        // Log activity if authenticated
        if ($isAuthenticated) {
            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'certificate_verified',
                'entity_type' => Certificate::class,
                'entity_id' => $certificate->id,
                'description' => 'Certificate verification completed',
                'metadata' => [
                    'serial' => $certificate->serial,
                    'student_name' => $student?->full_name,
                ],
                'ip_address' => $request->ip(),
            ]);
        }

        // Return certificate details
        return response()->json([
            'success' => true,
            'verified' => true,
            'message' => 'Certificate verified successfully',
            'certificate' => [
                'serial' => $certificate->serial,
                'student_name' => $student?->full_name ?? 'N/A',
                'student_id' => $student?->student_id ?? 'N/A',
                'degree_title' => $certificate->degree_title,
                'program_name' => $certificate->program_name,
                'major' => $certificate->major,
                'registration_no' => $certificate->registration_no,
                'cgpa' => $certificate->cgpa,
                'issue_date' => $certificate->issue_date?->format('Y-m-d'),
                'completion_date' => $certificate->completion_date?->format('Y-m-d'),
                'institution' => $certificate->institution?->name ?? 'N/A',
                'issued_by' => $certificate->issuedBy?->name ?? 'N/A',
                'status' => 'valid',
                'is_public' => $certificate->is_public,
            ],
        ], 200);
    }

    /**
     * Log verification attempt
     */
    private function logVerification(
        Request $request,
        ?Certificate $certificate,
        string $result,
        bool $matchedByDob,
        string $details
    ): void {
        VerificationLog::create([
            'certificate_id' => $certificate?->id,
            'verifier_user_id' => $request->user()?->id,
            'serial' => $request->input('serial'),
            'entered_date_of_birth' => $request->input('date_of_birth'),
            'matched_by_dob' => $matchedByDob,
            'verification_result' => $result,
            'verified_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'details' => $details,
        ]);
    }
}
