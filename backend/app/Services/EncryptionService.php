<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class EncryptionService
{
    /**
     * Encrypt a date of birth for URL sharing.
     *
     * Uses Laravel's built-in AES-256-CBC encryption (via APP_KEY),
     * then converts to URL-safe base64 encoding.
     *
     * @param string $dob Date of birth in Y-m-d format
     * @return string URL-safe encrypted token
     */
    public static function encryptDOB(string $dob): string
    {
        $encrypted = Crypt::encryptString($dob);

        // Convert to URL-safe base64 (replace +/ with -_, strip padding)
        return rtrim(strtr(base64_encode($encrypted), '+/', '-_'), '=');
    }

    /**
     * Decrypt a DOB token from a share link URL.
     *
     * @param string $token URL-safe encrypted token
     * @return string|null Date in Y-m-d format, or null if decryption fails
     */
    public static function decryptDOB(string $token): ?string
    {
        try {
            // Restore standard base64 from URL-safe encoding
            $encrypted = base64_decode(strtr($token, '-_', '+/'));

            if ($encrypted === false) {
                return null;
            }

            $dob = Crypt::decryptString($encrypted);

            // Validate that the decrypted value is a valid date
            $date = \DateTime::createFromFormat('Y-m-d', $dob);
            if (!$date || $date->format('Y-m-d') !== $dob) {
                return null;
            }

            return $dob;
        } catch (\Exception $e) {
            Log::debug('DOB decryption failed: ' . $e->getMessage());
            return null;
        }
    }
}
