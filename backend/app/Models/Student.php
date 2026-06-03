<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'nid_hash',
        'date_of_birth',
        'phone',
        'address',
        'student_id',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function activeEnrollments()
    {
        return $this->hasMany(Enrollment::class)->where('status', 'active');
    }

    public function accessRequests()
    {
        return $this->hasMany(CertificateAccessRequest::class);
    }

    public function verifierAccesses()
    {
        return $this->hasMany(VerifierAccess::class);
    }

    public function institutions()
    {
        return $this->belongsToMany(Institution::class, 'enrollments')
            ->withPivot('enrollment_number', 'program', 'batch', 'status')
            ->withTimestamps();
    }

    public function enrollmentApplications()
    {
        return $this->hasMany(EnrollmentApplication::class);
    }


    public function getFullNameAttribute()
    {
        return trim(collect([$this->first_name, $this->middle_name, $this->last_name])->filter()->implode(' '));
    }
}
