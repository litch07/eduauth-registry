<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CertificateController extends Controller
{
    /**
     * Restore a previously revoked certificate.
     *
     * Business Logic:
     * - Only admins may restore a certificate (enforced by route middleware).
     * - A certificate must currently be revoked to be restored.
     * - A reason for restoration is required (min 10 characters) for audit purposes.
     * - Restoring clears revoked_at, revoked_by, revoked_by_role, and revocation_reason.
     * - Every restore action is appended to the certificate's revocation_history log.
     * - Admin can restore ANY revoked certificate regardless of who originally revoked it.
     *
     * @param Request $request
     * @param string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restore(Request $request, $id)
    {
        $certificate = Certificate::findOrFail($id);

        // Guard: certificate must be revoked before it can be restored
        if (!$certificate->isRevoked()) {
            return response()->json(['error' => 'Certificate is not revoked and cannot be restored.'], 422);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:1000',
        ]);

        $user = Auth::user();

        return DB::transaction(function () use ($certificate, $request, $user) {
            // Append restore event BEFORE clearing revocation fields so the history
            // still has access to the cert's current revocation data if needed.
            $certificate->appendRevocationHistory(
                'restored',
                $user->id,
                $user->role,
                $request->reason,
                $user->name
            );

            // Clear revocation fields to make the certificate active again
            $certificate->update([
                'revoked_at'        => null,
                'revoked_by'        => null,
                'revoked_by_role'   => null,
                'revocation_reason' => null,
            ]);

            ActivityLog::create([
                'user_id'     => $user->id,
                'action'      => 'certificate_restored',
                'entity_type' => Certificate::class,
                'entity_id'   => $certificate->id,
                'description' => "Certificate {$certificate->serial} restored by admin.",
                'metadata'    => [
                    'reason' => $request->reason,
                ],
                'ip_address'  => $request->ip(),
            ]);

            return response()->json([
                'message'     => 'Certificate restored successfully.',
                'certificate' => [
                    'id'                 => $certificate->id,
                    'serial'             => $certificate->serial,
                    'revoked_at'         => null,
                    'revoked_by_role'    => null,
                    'revocation_reason'  => null,
                    'revocation_history' => $certificate->revocation_history ?? [],
                ],
            ]);
        });
    }
}
