<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnrollmentApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'institution_id',
        'certificate_level_id',
        'department_id',
        'batch',
        'reason',
        'document_path',
        'consent_provided',
        'status',
        'university_response',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function certificateLevel()
    {
        return $this->belongsTo(CertificateLevel::class);
    }

    // ── Scopes ─────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'pending');
    }
}
