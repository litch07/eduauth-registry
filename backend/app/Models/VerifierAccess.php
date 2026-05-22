<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VerifierAccess extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'verifier_access';

    protected $fillable = [
        'verifier_id',
        'student_id',
        'request_id',
        'granted_at',
        'expires_at',
        'revoked_at',
        'revoked_by',
    ];

    protected $casts = [
        'granted_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function verifier()
    {
        return $this->belongsTo(Verifier::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function request()
    {
        return $this->belongsTo(CertificateAccessRequest::class, 'request_id');
    }

    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now())->whereNull('revoked_at');
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    public function scopeNotRevoked($query)
    {
        return $query->whereNull('revoked_at');
    }

    public function isActive()
    {
        return $this->expires_at > now() && is_null($this->revoked_at);
    }

    public function revoke($userId)
    {
        $this->revoked_at = now();
        $this->revoked_by = $userId;
        $this->save();
    }
}
