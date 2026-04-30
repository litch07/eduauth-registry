<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VerificationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'certificate_id',
        'verifier_user_id',
        'serial',
        'entered_date_of_birth',
        'matched_by_dob',
        'verification_result',
        'verified_at',
        'ip_address',
        'user_agent',
        'details',
    ];

    protected $casts = [
        'entered_date_of_birth' => 'date',
        'matched_by_dob' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function certificate()
    {
        return $this->belongsTo(Certificate::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verifier_user_id');
    }
}
