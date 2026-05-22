<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    protected $fillable = ['user_id', 'preferences'];

    protected $casts = [
        'preferences' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get default preferences for a given role.
     */
    public static function getDefaults(string $role): array
    {
        $common = [
            'notifications' => [
                'email' => [
                    'certificate_issued' => true,
                    'enrollment_changes' => true,
                    'access_requests' => true,
                    'profile_changes' => true,
                    'security_alerts' => true,
                ],
                'in_app' => [
                    'certificate_issued' => true,
                    'enrollment_changes' => true,
                    'access_requests' => true,
                    'profile_changes' => true,
                    'security_alerts' => true,
                ],
                'frequency' => 'instant',
            ],
            'privacy' => [
                'profile_visibility' => 'public',
                'certificate_default' => 'public',
                'show_email_to_verifiers' => false,
                'show_phone_to_verifiers' => false,
                'allow_university_search' => true,
            ],
            'display' => [
                'theme' => 'system',
                'date_format' => 'DD/MM/YYYY',
                'timezone' => 'Asia/Dhaka',
                'items_per_page' => 25,
            ],
        ];

        $roleSpecific = match ($role) {
            'student' => [
                'certificate_preferences' => [
                    'default_visibility' => 'public',
                    'auto_approve_verifier' => false,
                    'default_access_duration' => 30,
                    'notify_certificate_viewed' => true,
                ],
                'enrollment_preferences' => [
                    'notify_status_changes' => true,
                    'notify_graduation_extended' => true,
                ],
            ],
            'university' => [
                'institution_preferences' => [
                    'auto_graduate_on_certificate' => true,
                    'auto_generate_student_ids' => true,
                    'student_id_prefix' => '',
                    'default_certificate_prefix' => 'BSC',
                ],
                'enrollment_settings' => [
                    'default_session_duration_years' => 4,
                ],
            ],
            'verifier' => [
                'verification_preferences' => [
                    'auto_log_verifications' => true,
                    'require_note' => false,
                    'default_method' => 'serial_dob',
                    'notify_access_expires' => true,
                ],
                'access_request_settings' => [
                    'default_duration_days' => 30,
                ],
            ],
            'admin' => [
                'system_preferences' => [
                    'require_approval_new_users' => true,
                    'auto_approve_verified_emails' => false,
                    'daily_summary_report' => true,
                    'profile_change_auto_approve' => 'never',
                ],
            ],
            default => [],
        };

        return array_merge($common, $roleSpecific);
    }

    /**
     * Deep merge two arrays recursively.
     */
    public static function deepMerge(array $base, array $override): array
    {
        foreach ($override as $key => $value) {
            if (isset($base[$key]) && is_array($base[$key]) && is_array($value)) {
                $base[$key] = self::deepMerge($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }

        return $base;
    }
}
