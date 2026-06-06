<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Mail;
use App\Mail\CertificateRevokedMail;
use Illuminate\Support\Facades\Auth;

class CertificateController extends Controller
{
    protected $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->certificateService = $certificateService;
    }

    /**
     * Download the PDF for a specific certificate.
     *
     * @param string $id
     * @return \Illuminate\Http\Response
     */
    public function downloadPDF(string $id)
    {
        $certificate = Certificate::findOrFail($id);

        // Block PDF download for revoked certificates
        if ($certificate->isRevoked()) {
            return response()->json([
                'error' => 'This certificate has been revoked and cannot be downloaded.',
                'revoked_at' => $certificate->revoked_at,
                'revocation_reason' => $certificate->revocation_reason,
            ], 403);
        }

        // Authorization: Student who owns it, university that issued it, or verifier with access
        if (Gate::denies('view-certificate-pdf', $certificate)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return $this->certificateService->getCertificatePdf($id);
    }

    public function index(Request $request)
    {
        $certificates = Certificate::with(['student.user', 'institution'])
            ->orderBy('issue_date', 'desc')
            ->get()
            ->map(function ($cert) {
                return [
                    'id' => $cert->id,
                    'serial' => $cert->serial,
                    'student_name' => $cert->student?->user?->name ?? 'N/A',
                    'institution_name' => $cert->institution?->name ?? 'N/A',
                    'certificate_name' => $cert->certificate_name,
                    'issue_date' => $cert->issue_date,
                    'revoked_at' => $cert->revoked_at,
                    'revocation_reason' => $cert->revocation_reason,
                    'revocation_history' => $cert->revocation_history ?? [],
                ];
            });

        return response()->json([
            'success' => true,
            'certificates' => $certificates,
        ]);
    }

    /**
     * Revoke an issued certificate.
     * 
     * Business Logic:
     * - Only the admin or the specific university that issued the certificate can revoke it.
     * - A certificate cannot be revoked twice.
     * - A reason for revocation must be provided for audit purposes.
     * - Revocation triggers an email notification to the student and logs the activity.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function revoke(Request $request, $id)
    {
        $certificate = Certificate::findOrFail($id);

        // Guard against duplicate revocation attempts
        if ($certificate->isRevoked()) {
            return response()->json(['error' => 'Certificate is already revoked.'], 422);
        }

        $user = Auth::user();

        // Authorization Rule: The user must be a global admin, OR 
        // they must be a university account whose institution ID matches the certificate's issuing institution.
        if ($user->role !== 'admin' && ($user->role !== 'university' || $user->institution->id !== $certificate->institution_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:1000',
        ]);

        $certificate->update([
            'revoked_at' => now(),
            'revoked_by' => $user->id,
            'revocation_reason' => $request->reason,
        ]);

        // Append audit history entry
        $certificate->appendRevocationHistory(
            'revoked',
            $user->id,
            $user->role,
            $request->reason,
            $user->name
        );

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'certificate_revoked',
            'entity_type' => Certificate::class,
            'entity_id' => $certificate->id,
            'description' => "Certificate {$certificate->serial} revoked.",
            'metadata' => [
                'reason' => $request->reason,
            ],
            'ip_address' => $request->ip(),
        ]);

        // Notify student
        Mail::to($certificate->student->user->email)->queue(new CertificateRevokedMail($certificate, $certificate->student->user));

        return response()->json(['message' => 'Certificate revoked successfully.']);
    }

    /**
     * Advanced Search and Filtering for Certificates.
     * 
     * This endpoint handles multi-dimensional filtering, allowing users to search
     * across different relationships (Student, Institution) and specific attributes
     * (issue dates, status) simultaneously.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchCertificates(Request $request)
    {
        $user = $request->user();
        
        // Start with base query, eagerly loading relationships to prevent N+1 queries
        $query = Certificate::with(['student.user', 'institution']);

        // Scope by user role
        if ($user->role === 'student' && $user->student) {
            $query->where('student_id', $user->student->id);
        } elseif ($user->role === 'university' && $user->institution) {
            $query->where('institution_id', $user->institution->id);
        }

        // Text-based search: Matches against serial, certificate name, or the student's name
        $query->when($request->search, function ($q, $search) {
            $q->where(function ($subQ) use ($search) {
                $subQ->where('serial', 'like', "%{$search}%")
                    ->orWhere('certificate_name', 'like', "%{$search}%")
                    ->orWhere('degree_title', 'like', "%{$search}%")
                    // Search inside the nested relationship (Certificate -> Student -> User)
                    ->orWhereHas('student.user', function ($studentQ) use ($search) {
                        $studentQ->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('institution', function ($instQ) use ($search) {
                        $instQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        $query->when($request->institution_id, function ($q, $institutionId) {
            $q->where('institution_id', $institutionId);
        });

        $query->when($request->certificate_level, function ($q, $level) {
            $q->where('certificate_level', $level);
        });

        $query->when($request->date_from, function ($q, $dateFrom) {
            $q->whereDate('issue_date', '>=', $dateFrom);
        });

        $query->when($request->date_to, function ($q, $dateTo) {
            $q->whereDate('issue_date', '<=', $dateTo);
        });

        // Filter by active/revoked status
        $query->when($request->status, function ($q, $status) {
            if ($status === 'revoked') {
                $q->whereNotNull('revoked_at');
            } elseif ($status === 'active') {
                $q->whereNull('revoked_at');
            }
        });

        $perPage = $request->input('per_page', 15);
        $results = $query->orderBy('issue_date', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }
}
