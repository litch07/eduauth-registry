<?php

namespace App\Services;

use App\Models\CertificateSequence;
use Illuminate\Support\Facades\DB;

class SerialGeneratorService
{
    /**
     * Generate unique certificate serial with checksum.
     * Format: PREFIX-YY-SEQSEQC
     * Example: BSc-26-000001M
     *
     * @param string $prefix  The short_code from the CertificateLevel model (e.g. "BSc", "PhD").
     */
    public static function generate(string $prefix): string
    {
        if (empty($prefix)) {
            throw new \InvalidArgumentException('Prefix cannot be empty');
        }
        $year = date('y'); // e.g. 26 for 2026

        // Get next sequence number with database locking
        $sequence = DB::transaction(function () use ($prefix, $year) {
            $seq = CertificateSequence::lockForUpdate()
                ->where('prefix', $prefix)
                ->where('year_suffix', $year)
                ->first();

            if (!$seq) {
                $seq = CertificateSequence::create([
                    'sequence_key' => 'certificate_serial_' . $prefix . '_' . $year,
                    'prefix' => $prefix,
                    'year_suffix' => $year,
                    'current_sequence' => 1,
                ]);
            } else {
                $seq->increment('current_sequence');
                $seq->refresh();
            }

            return $seq->current_sequence;
        });

        $seqStr = str_pad($sequence, 6, '0', STR_PAD_LEFT);

        $checksum = self::calculateChecksum($prefix, $year, $seqStr);

        return "{$prefix}-{$year}-{$seqStr}{$checksum}";
    }

    /**
     * Calculate checksum using modulo 32 algorithm.
     * Returns single character from alphanumeric set (excluding similar-looking chars).
     */
    private static function calculateChecksum(string $prefix, string $year, string $sequence): string
    {
        // Checksum character set (excluding 0, O, I, 1 to avoid confusion)
        $charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        $data = $prefix . $year . $sequence;

        $sum = 0;
        for ($i = 0; $i < strlen($data); $i++) {
            $sum += ord($data[$i]);
        }

        $index = $sum % strlen($charset);

        return $charset[$index];
    }

    /**
     * Validate serial checksum.
     */
    public static function validateChecksum(string $serial): bool
    {
        // Parse serial: BSC-26-000001M
        $parts = explode('-', $serial);

        if (count($parts) !== 3) {
            return false;
        }

        $prefix = $parts[0];
        $year = $parts[1];
        $seqWithChecksum = $parts[2];

        if (strlen($seqWithChecksum) !== 7) { // 6 digits + 1 checksum
            return false;
        }

        $sequence = substr($seqWithChecksum, 0, 6);
        $providedChecksum = substr($seqWithChecksum, 6, 1);

        $expectedChecksum = self::calculateChecksum($prefix, $year, $sequence);

        return $providedChecksum === $expectedChecksum;
    }
}
