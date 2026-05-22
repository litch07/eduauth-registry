<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Student;
use App\Models\Institution;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateService
{
    /**
     * Generate a QR code for a given certificate.
     *
     * Uses the encrypted share link so scanning auto-verifies.
     *
     * @param Certificate $certificate
     * @return string Base64-encoded PNG QR code
     */
    public function generateQRCode(Certificate $certificate): string
    {
        $url = $certificate->share_link ?? $this->getVerificationUrl($certificate->serial);
        return base64_encode(QrCode::format('svg')->size(200)->generate($url));
    }

    /**
     * Get the public verification URL for a certificate (fallback, serial-only).
     *
     * @param string $serial
     * @return string
     */
    public function getVerificationUrl(string $serial): string
    {
        return config('app.frontend_url', 'http://localhost:5173') . '/verify?serial=' . $serial;
    }

    /**
     * Generate and store the PDF for a certificate.
     *
     * @param string $certificateId
     * @return string The path to the stored PDF.
     */
    public function generatePDF(string $certificateId): string
    {
        $certificate = Certificate::with(['student.user', 'institution.user', 'enrollment'])->findOrFail($certificateId);
        $student = $certificate->student;
        $institution = $certificate->institution;

        $filePath = 'public/certificates/' . $certificate->serial . '.pdf';
        if (Storage::exists($filePath)) {
            return $filePath;
        }

        $qrCode = $this->generateQRCode($certificate);
        $verificationUrl = $certificate->share_link ?? $this->getVerificationUrl($certificate->serial);

        $pdf = Pdf::loadView('certificates.template', compact('certificate', 'student', 'institution', 'qrCode', 'verificationUrl'));
        $pdf->setPaper('A4', 'landscape');

        $output = $pdf->output();
        Storage::put($filePath, $output);

        $certificate->update(['pdf_path' => $filePath]);

        try {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => 'certificate_pdf_generated',
                'entity_type' => Certificate::class,
                'entity_id' => $certificate->id,
                'description' => "Generated PDF for certificate {$certificate->serial}.",
                'ip_address' => request()->ip(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to log PDF generation activity: ' . $e->getMessage());
        }

        return $filePath;
    }

    /**
     * Get the PDF for a certificate, generating it if it doesn't exist.
     *
     * @param string $certificateId
     * @return \Illuminate\Http\Response
     */
    public function getCertificatePdf(string $certificateId)
    {
        $certificate = Certificate::findOrFail($certificateId);
        $filePath = $certificate->pdf_path;

        if (!$filePath || !Storage::exists($filePath)) {
            $filePath = $this->generatePDF($certificateId);
        }

        return Storage::download($filePath, $certificate->serial . '.pdf');
    }
}