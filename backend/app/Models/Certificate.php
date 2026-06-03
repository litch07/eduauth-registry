<?php

namespace App\Models;

use App\Services\EncryptionService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Certificate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'institution_id',
        'enrollment_id',
        'serial',
        'certificate_level',
        'certificate_name',
        'department',
        'major',
        'session',
        'cgpa',
        'degree_class',
        'issue_date',
        'convocation_date',
        'authority_name',
        'authority_title',
        'is_publicly_shareable',
        'pdf_path',
        'issued_by',
        'revoked_at',
        'revoked_by',
        'revocation_reason',
        'revocation_history',
        'issued_name',
    ];

    protected $casts = [
        'cgpa'                 => 'decimal:2',
        'issue_date'           => 'date',
        'convocation_date'     => 'date',
        'revoked_at'           => 'datetime',
        'is_publicly_shareable'=> 'boolean',
        'revocation_history'   => 'array',
    ];

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    /**
     * Append a status-change entry to the certificate's revocation_history log.
     *
     * @param string $action      'revoked' | 'restored'
     * @param int    $performedBy User ID performing the action
     * @param string $role        Role of the performing user
     * @param string $reason      Human-readable reason
     * @param string $name        Display name of the performing user
     */
    public function appendRevocationHistory(string $action, int $performedBy, string $role, string $reason, string $name): void
    {
        $history = $this->revocation_history ?? [];
        $history[] = [
            'action'       => $action,
            'performed_by' => $performedBy,
            'performed_by_name' => $name,
            'role'         => $role,
            'reason'       => $reason,
            'timestamp'    => now()->toIso8601String(),
        ];
        $this->revocation_history = $history;
        $this->saveQuietly();
    }

    /**
     * Generate an encrypted share link for this certificate.
     *
     * The link includes the serial and an encrypted DOB token,
     * allowing one-click verification without exposing the student's DOB.
     */
    public function getShareLinkAttribute(): ?string
    {
        $student = $this->student;

        if (!$student || !$student->date_of_birth) {
            return null;
        }

        $encryptedDob = EncryptionService::encryptDOB($student->date_of_birth->format('Y-m-d'));
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        return "{$frontendUrl}/verify?s={$this->serial}&v={$encryptedDob}";
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function revokedBy()
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function verificationLogs()
    {
        return $this->hasMany(VerificationLog::class);
    }

    public function scopeNotRevoked($query)
    {
        return $query->whereNull('revoked_at');
    }
}

