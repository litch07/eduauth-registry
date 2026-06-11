<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class AppNotification extends Notification
{
    public $type;
    public $title;
    public $message;
    public $actionUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $type, string $title, string $message, string $actionUrl = null)
    {
        $this->type      = $type;
        $this->title     = $title;
        $this->message   = $message;
        $this->actionUrl = $actionUrl;
    }

    /**
     * Get the notification's delivery channels.
     *
     * Checks the user's in_app notification preferences before writing to the
     * database. If the user has turned off a specific notification type,
     * this returns an empty array and the notification is skipped entirely.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        try {
            $setting   = \App\Models\UserSetting::where('user_id', $notifiable->id)->first();
            $inAppPrefs = $setting?->preferences['notifications']['in_app'] ?? null;

            if ($inAppPrefs !== null) {
                $prefKey = $this->getPrefKey();
                if ($prefKey && isset($inAppPrefs[$prefKey]) && $inAppPrefs[$prefKey] === false) {
                    return []; // User has disabled this notification type
                }
            }
        } catch (\Exception $e) {
            // If preference check fails, default to sending the notification
            \Illuminate\Support\Facades\Log::debug('AppNotification preference check failed: ' . $e->getMessage());
        }

        return ['database'];
    }

    /**
     * Map this notification's type string to the user_settings preferences key.
     */
    private function getPrefKey(): ?string
    {
        return match ($this->type) {
            'CERTIFICATE'    => 'certificate_issued',
            'ENROLLMENT'     => 'enrollment_changes',
            'ACCESS_REQUEST' => 'access_requests',
            'PROFILE'        => 'profile_changes',
            'SECURITY'       => 'security_alerts',
            default          => null,
        };
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type'       => $this->type,
            'title'      => $this->title,
            'message'    => $this->message,
            'action_url' => $this->actionUrl,
        ];
    }
}
