<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    protected $fillable = [
        'user_id',
        'preferences',
        'profile_visibility',
        'allow_verifier_search',
        'show_email_to_verifiers',
        'show_institution_to_public',
    ];

    protected $casts = [
        'preferences' => 'array',
        'allow_verifier_search' => 'boolean',
        'show_email_to_verifiers' => 'boolean',
        'show_institution_to_public' => 'boolean',
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
                'certificate_default' => 'private',
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
                    // default_certificate_visibility
                    'default_visibility'         => 'private',
                    // auto_approve_access_requests
                    'auto_approve_verifier'      => false,
                    // default_access_duration_days
                    'default_access_duration'    => 30,
                    'notify_certificate_viewed'  => true,
                ],
                'enrollment_preferences' => [
                    'notify_status_changes'      => true,
                    'notify_graduation_extended' => true,
                ],
            ],
            'university' => [
                'institution_preferences' => [
                    // auto_graduate_on_certificate_issue
                    'auto_graduate_on_certificate' => true,
                    'auto_generate_student_ids'    => true,
                    'student_id_prefix'            => '',
                    'default_certificate_prefix'   => 'BSC',
                    // student_id_format (e.g. "UIU-{YEAR}-{SEQ}")
                    'student_id_format'            => null,
                ],
                'enrollment_settings' => [
                    'default_session_duration_years' => 4,
                ],
            ],
            'verifier' => [
                'verification_preferences' => [
                    // auto_log_verifications
                    'auto_log_verifications' => true,
                    // require_verification_notes
                    'require_note'           => false,
                    // default_verification_method: manual / qr / link
                    'default_method'         => 'manual',
                    'notify_access_expires'  => true,
                ],
                'access_request_settings' => [
                    'default_duration_days' => 30,
                ],
            ],
            'admin' => [
                'system_preferences' => [
                    // require_approval_for_universities
                    'require_approval_universities'  => true,
                    // require_approval_for_verifiers
                    'require_approval_verifiers'     => true,
                    'require_approval_new_users'     => true,
                    'auto_approve_verified_emails'   => false,
                    'daily_summary_report'           => true,
                    'profile_change_auto_approve'    => 'never',
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
