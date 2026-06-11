<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PendingEmailChangeMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $userName;
    public string $verificationLink;

    /**
     * Create a new message instance.
     */
    public function __construct(string $userName, string $token)
    {
        $this->userName        = $userName;
        $this->verificationLink = rtrim(config('app.url'), '/') . '/verify-email-change?token=' . $token;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirm your new email address',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.pending-email-change',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
