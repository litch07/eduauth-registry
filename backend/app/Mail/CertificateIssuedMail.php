<?php

namespace App\Mail;

use App\Models\Certificate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CertificateIssuedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Certificate $certificate)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Certificate Has Been Issued - EduAuth Registry',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.certificate-issued',
            with: [
                'certificate' => $this->certificate,
                'studentName' => $this->certificate->student?->user?->name ?? 'Student',
                'institutionName' => $this->certificate->institution?->name ?? 'Institution',
                'serial' => $this->certificate->serial,
                'degree' => $this->certificate->degree_title ?? $this->certificate->certificate_level,
                'verificationUrl' => config('app.frontend_url', 'http://localhost:5173') . '/verify?serial=' . $this->certificate->serial,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
