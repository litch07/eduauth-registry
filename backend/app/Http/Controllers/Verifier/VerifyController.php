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
    public function dashboard(Request $request)
    {
        $logs = VerificationLog::where('verifier_user_id', $request->user()->id)
            ->latest('verified_at')
            ->limit(10)
            ->get();

        return response()->json([
            'stats' => [
                'total_verifications' => VerificationLog::where('verifier_user_id', $request->user()->id)->count(),
                'successful_verifications' => VerificationLog::where('verifier_user_id', $request->user()->id)->where('verification_result', 'success')->count(),
                'failed_verifications' => VerificationLog::where('verifier_user_id', $request->user()->id)->where('verification_result', 'failed')->count(),
            ],
            'recent_verifications' => $logs,
        ]);
    }

    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'serial' => 'required|string|max:100',
            'date_of_birth' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $certificate = Certificate::with(['student.user', 'institution', 'issuedBy'])
            ->where('serial', $request->serial)
            ->first();

        if (!$certificate) {
            $this->logVerification($request, null, 'failed', false, 'Certificate not found.');

            return response()->json([
                'error' => 'Certificate not found.',
            ], 404);
        }

        if ($certificate->revoked_at) {
            $this->logVerification($request, $certificate, 'revoked', false, 'Certificate has been revoked.');

            return response()->json([
                'error' => 'Certificate has been revoked.',
            ], 409);
        }

        $dobMatches = $certificate->student && $certificate->student->date_of_birth
            ? $certificate->student->date_of_birth->toDateString() === $request->date_of_birth
            : false;

        if (!$dobMatches) {
            $this->logVerification($request, $certificate, 'failed', false, 'Date of birth did not match.');

            return response()->json([
                'error' => 'Verification failed. Date of birth did not match.',
            ], 422);
        }

        $this->logVerification($request, $certificate, 'success', true, 'Certificate verified successfully.');

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'certificate_verified',
            'entity_type' => Certificate::class,
            'entity_id' => $certificate->id,
            'description' => 'Certificate verification completed.',
            'metadata' => [
                'serial' => $certificate->serial,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Certificate verified successfully.',
            'verified' => true,
            'certificate' => [
                'serial' => $certificate->serial,
                'degree_title' => $certificate->degree_title,
                'program_name' => $certificate->program_name,
                'major' => $certificate->major,
                'issue_date' => $certificate->issue_date,
                'institution' => $certificate->institution?->name,
                'student_name' => $certificate->student?->full_name,
                'status' => 'valid',
            ],
        ]);
    }

    private function logVerification(Request $request, ?Certificate $certificate, string $result, bool $matchedByDob, string $details): void
    {
        VerificationLog::create([
            'certificate_id' => $certificate?->id,
            'verifier_user_id' => $request->user()?->id,
            'serial' => $request->serial,
            'entered_date_of_birth' => $request->date_of_birth,
            'matched_by_dob' => $matchedByDob,
            'verification_result' => $result,
            'verified_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'details' => $details,
        ]);
    }
}
