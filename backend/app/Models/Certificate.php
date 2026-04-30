<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Certificate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'institution_id',
        'issued_by',
        'revoked_by',
        'restored_by',
        'serial',
        'degree_title',
        'program_name',
        'major',
        'registration_no',
        'cgpa',
        'issue_date',
        'completion_date',
        'pdf_path',
        'is_public',
        'revoked_at',
        'revocation_reason',
        'restored_at',
        'restoration_reason',
    ];

    protected $casts = [
        'cgpa' => 'decimal:2',
        'issue_date' => 'date',
        'completion_date' => 'date',
        'revoked_at' => 'datetime',
        'restored_at' => 'datetime',
        'is_public' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function revokedBy()
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function restoredBy()
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function verificationLogs()
    {
        return $this->hasMany(VerificationLog::class);
    }

    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at');
    }
}
