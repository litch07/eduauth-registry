<?php

namespace App\Mail;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrollmentConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Enrollment $enrollment)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Enrollment Confirmed - EduAuth Registry',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.enrollment-confirmation',
            with: [
                'enrollment' => $this->enrollment,
                'studentName' => $this->enrollment->student?->user?->name ?? 'Student',
                'institutionName' => $this->enrollment->institution?->name ?? 'Institution',
                'program' => $this->enrollment->program ?? 'Your Program',
                'status' => ucfirst($this->enrollment->status ?? 'active'),
                'dashboardUrl' => config('app.frontend_url', 'http://localhost:5173') . '/student/dashboard',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
