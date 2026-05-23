<?php

namespace App\Http\Controllers\Verifier;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\VerificationLog;
use App\Services\EncryptionService;
use App\Services\SerialGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VerifyController extends Controller
{
    public function dashboard(Request $request)
    {
        $userId = $request->user()->id;
        
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

        if (!SerialGeneratorService::validateChecksum($serial)) {
            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'Invalid certificate serial number format'
            ], 400);
        }

        $certificate = Certificate::with(['student', 'institution', 'issuedBy'])
            ->where('serial', $serial)
            ->whereNull('deleted_at')
            ->first();

        if (!$certificate) {
            $this->logVerification($request, null, 'not_found', false, 'Certificate not found');

            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'Certificate not found with this serial number'
            ], 404);
        }

        if ($certificate->revoked_at) {
            $this->logVerification($request, $certificate->id, 'revoked', false, 'Certificate has been revoked');

            return response()->json([
                'success' => true,
                'verified' => false,
                'status' => 'revoked',
                'message' => 'This certificate has been revoked.',
                'revoked_at' => $certificate->revoked_at->toDateString(),
                'revocation_reason' => $certificate->revocation_reason,
                'revoked_by' => $certificate->revokedBy?->name ?? 'Administrator',
            ], 200);
        }

        if ($certificate->student->date_of_birth->format('Y-m-d') !== $dateOfBirth) {
            $this->logVerification($request, $certificate, 'dob_mismatch', false, 'Date of birth did not match');

            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'Date of birth does not match our records'
            ], 401);
        }

        // Check if certificate is publicly shareable
        // Private certificates cannot be verified by anyone
        $isPublic = $certificate->is_publicly_shareable;

        if (!$isPublic) {
            $this->logVerification($request, $certificate, 'private_certificate', false, 'Certificate is private and not accessible for verification');

            return response()->json([
                'success' => false,
                'verified' => false,
                'message' => 'This certificate is private and cannot be verified. The student has restricted access to this certificate.'
            ], 403);
        }

        $this->logVerification($request, $certificate, 'success', true, 'Certificate verified successfully');

        // Log activity if authenticated
        if ($request->user()) {
            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'certificate_verified',
                'entity_type' => Certificate::class,
                'entity_id' => $certificate->id,
                'description' => 'Certificate verification completed',
                'metadata' => [
                    'serial' => $certificate->serial,
                    'student_name' => $certificate->student?->full_name,
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
                'student_name' => $certificate->student?->full_name ?? 'N/A',
                'student_id' => $certificate->student?->student_id ?? 'N/A',
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
                'is_public' => $certificate->is_publicly_shareable,
            ],
        ], 200);
    }

    /**
     * Verify certificate from an encrypted share link.
     *
     * This endpoint accepts a serial and an encrypted DOB token,
     * decrypts the DOB, and performs verification automatically.
     * Works for both public users and logged-in verifiers.
     */
    public function verifyFromLink(Request $request)
    {
        $validator = Validator::make($request->all(), [
            's' => 'required|string|max:100',
            'v' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'verified' => false,
                'error' => 'Invalid verification link',
            ], 422);
        }

        $serial = $request->input('s');
        $dobToken = $request->input('v');

        // Decrypt DOB from the URL token
        $dob = EncryptionService::decryptDOB($dobToken);

        if (!$dob) {
            return response()->json([
                'success' => false,
                'verified' => false,
                'error' => 'Invalid or expired verification link',
            ], 400);
        }

        // Delegate to the existing verify method with the decrypted data
        $verifyRequest = new Request([
            'serial' => $serial,
            'date_of_birth' => $dob,
        ]);

        // Preserve the authenticated user (if any) so verification
        // is logged under their account
        $verifyRequest->setUserResolver($request->getUserResolver());

        return $this->verify($verifyRequest);
    }

    /**
     * Get last 10 verifications for this verifier (for sidebar panel)
     */
    public function recentVerifications(Request $request)
    {
        $userId = $request->user()->id;

        $logs = VerificationLog::where('verifier_user_id', $userId)
            ->with('certificate.institution')
            ->latest('verified_at')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                $serial = $log->serial;
                // Mask middle of serial: BSC-26-000001M → BSC-26-***001M
                $maskedSerial = $serial
                    ? preg_replace('/(?<=.{7}).(?=.{4})/u', '*', $serial)
                    : null;

                $studentName = null;
                if ($log->certificate && $log->certificate->student) {
                    $full = $log->certificate->student->full_name ?? '';
                    $parts = explode(' ', trim($full));
                    $studentName = count($parts) > 1
                        ? $parts[0] . ' ' . strtoupper(substr(end($parts), 0, 1)) . '.'
                        : $full;
                }

                return [
                    'id'             => $log->id,
                    'serial'         => $log->serial,
                    'serial_masked'  => $maskedSerial,
                    'student_name'   => $studentName,
                    'institution'    => $log->certificate?->institution?->name,
                    'status'         => $log->verification_result,
                    'verified_at'    => $log->verified_at?->toIso8601String(),
                ];
            });

        return response()->json(['success' => true, 'verifications' => $logs]);
    }

    /**
     * Paginated verification history with filters
     */
    public function verificationHistory(Request $request)
    {
        $userId = $request->user()->id;
        $perPage = 25;

        $query = VerificationLog::where('verifier_user_id', $userId)
            ->with('certificate.institution', 'certificate.student');

        // Filters
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('verification_result', $request->status);
        }
        if ($request->filled('serial')) {
            $query->where('serial', 'like', '%' . $request->serial . '%');
        }
        if ($request->filled('from')) {
            $query->whereDate('verified_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('verified_at', '<=', $request->to);
        }

        $paginated = $query->latest('verified_at')->paginate($perPage);

        $items = collect($paginated->items())->map(function ($log) {
            $studentName = null;
            if ($log->certificate && $log->certificate->student) {
                $studentName = $log->certificate->student->full_name;
            }

            return [
                'id'           => $log->id,
                'serial'       => $log->serial,
                'student_name' => $studentName,
                'institution'  => $log->certificate?->institution?->name,
                'status'       => $log->verification_result,
                'verified_at'  => $log->verified_at?->format('Y-m-d H:i'),
                'details'      => $log->details,
                'certificate'  => $log->certificate ? [
                    'serial'       => $log->certificate->serial,
                    'degree_title' => $log->certificate->degree_title,
                    'program_name' => $log->certificate->program_name,
                    'major'        => $log->certificate->major,
                    'cgpa'         => $log->certificate->cgpa,
                    'issue_date'   => $log->certificate->issue_date?->format('Y-m-d'),
                    'student_name' => $log->certificate->student?->full_name,
                    'student_id'   => $log->certificate->student?->student_id,
                    'institution'  => $log->certificate->institution?->name,
                ] : null,
            ];
        });

        return response()->json([
            'success'      => true,
            'data'         => $items,
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
        ]);
    }

    /**
     * Export verification history as CSV
     */
    public function exportVerifications(Request $request)
    {
        $userId = $request->user()->id;

        $query = VerificationLog::where('verifier_user_id', $userId)
            ->with('certificate.institution', 'certificate.student');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('verification_result', $request->status);
        }
        if ($request->filled('serial')) {
            $query->where('serial', 'like', '%' . $request->serial . '%');
        }
        if ($request->filled('from')) {
            $query->whereDate('verified_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('verified_at', '<=', $request->to);
        }

        $logs = $query->latest('verified_at')->get();

        $filename = 'verifications_export_' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Serial Number', 'Student Name', 'Institution', 'Status', 'Verified At', 'Details']);
            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->serial,
                    $log->certificate?->student?->full_name ?? '—',
                    $log->certificate?->institution?->name ?? '—',
                    $log->verification_result,
                    $log->verified_at?->format('Y-m-d H:i:s'),
                    $log->details,
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
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
            'certificate_id'      => $certificate?->id,
            'verifier_user_id'    => $request->user()?->id,
            'serial'              => $request->input('serial'),
            'entered_date_of_birth' => $request->input('date_of_birth'),
            'matched_by_dob'      => $matchedByDob,
            'verification_result' => $result,
            'verified_at'         => now(),
            'ip_address'          => $request->ip(),
            'user_agent'          => $request->userAgent(),
            'details'             => $details,
        ]);
    }
}
