<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'institution_id',
        'enrollment_number',
        'roll_number',
        'department_id',
        'major_id',
        'program',
        'batch',
        'status',
        'suspension_reason',
        'enrollment_date',
        'expected_graduation_date',
        'actual_graduation_date',
        'enrolled_by',
        'certificate_level_id',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'expected_graduation_date' => 'date',
        'actual_graduation_date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function enrolledBy()
    {
        return $this->belongsTo(User::class, 'enrolled_by');
    }

    public function major()
    {
        return $this->belongsTo(Major::class);
    }

    public function certificateLevel()
    {
        return $this->belongsTo(CertificateLevel::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function withdrawalRequests()
    {
        return $this->hasMany(WithdrawalRequest::class);
    }

    public function extensionRequests()
    {
        return $this->hasMany(ExtensionRequest::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeGraduated($query)
    {
        return $query->where('status', 'graduated');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function canReceiveCertificate(): bool
    {
        return in_array($this->status, ['active', 'graduated'], true);
    }
}
