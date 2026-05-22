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
    ];

    protected $casts = [
        'cgpa' => 'decimal:2',
        'issue_date' => 'date',
        'convocation_date' => 'date',
        'revoked_at' => 'datetime',
        'is_publicly_shareable' => 'boolean',
    ];

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
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

