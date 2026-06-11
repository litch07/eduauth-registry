<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'email',
        'password',
        'role',
        'email_verified_at',
        'is_approved',
        'approved_by',
        'approved_at',
        'pending_email',
        'pending_email_token',
        'pending_email_expires_at',
        'suspended_at',
        'suspension_reason',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at'        => 'datetime',
        'approved_at'              => 'datetime',
        'pending_email_expires_at' => 'datetime',
        'suspended_at'             => 'datetime',
        'is_approved'              => 'boolean',
        'password'                 => 'hashed',
    ];

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function institution()
    {
        return $this->hasOne(Institution::class);
    }

    public function verifier()
    {
        return $this->hasOne(Verifier::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(self::class, 'approved_by');
    }

    public function issuedCertificates()
    {
        return $this->hasMany(Certificate::class, 'issued_by');
    }

    public function verificationLogs()
    {
        return $this->hasMany(VerificationLog::class, 'verifier_user_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function profileChangeRequests()
    {
        return $this->hasMany(ProfileChangeRequest::class);
    }

    public function getNameAttribute(): string
    {
        if ($this->role === 'admin') {
            return 'System Administrator';
        }

        if ($this->role === 'student' && $this->student) {
            return trim(implode(' ', array_filter([
                $this->student->first_name,
                $this->student->middle_name,
                $this->student->last_name,
            ])));
        }

        if ($this->role === 'university' && $this->institution) {
            return $this->institution->name;
        }

        if ($this->role === 'verifier' && $this->verifier) {
            return $this->verifier->company_name;
        }

        return $this->email;
    }
}
