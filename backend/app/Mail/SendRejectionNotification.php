<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendRejectionNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $rejectionReason,
    ) {
        $this->user = $user;
        $this->rejectionReason = $rejectionReason;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Registration Update - EduAuth Registry',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.rejection-notification',
            with: [
                'userName' => $this->resolveDisplayName(),
                'rejectionReason' => $this->rejectionReason,
                'registerUrl' => rtrim(config('app.url'), '/') . '/register',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }

    private function resolveDisplayName(): string
    {
        $this->user->loadMissing(['student', 'institution', 'verifier']);

        return match ($this->user->role) {
            'student' => $this->user->student ? $this->user->student->full_name : 'Student',
            'university' => $this->user->institution?->name ?? 'University',
            'verifier' => $this->user->verifier?->contact_person ?? 'Verifier',
            default => 'User',
        };
    }
}
