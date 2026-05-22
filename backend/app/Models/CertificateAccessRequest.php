<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CertificateAccessRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'verifier_id',
        'student_id',
        'purpose',
        'status',
        'responded_at',
        'rejection_reason',
        'access_duration_days',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
    ];

    public function verifier()
    {
        return $this->belongsTo(Verifier::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function access()
    {
        return $this->hasOne(VerifierAccess::class, 'request_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function approve($days)
    {
        $this->status = 'approved';
        $this->responded_at = now();
        $this->access_duration_days = $days;
        $this->save();

        return VerifierAccess::create([
            'verifier_id' => $this->verifier_id,
            'student_id' => $this->student_id,
            'request_id' => $this->id,
            'granted_at' => now(),
            'expires_at' => now()->addDays($days),
        ]);
    }

    public function reject($reason)
    {
        $this->status = 'rejected';
        $this->responded_at = now();
        $this->rejection_reason = $reason;
        $this->save();
    }
}
