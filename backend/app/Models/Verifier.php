<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Verifier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'company_name',
        'contact_person',
        'designation',
        'email',
        'phone',
        'purpose',
        'address',
        'website',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verificationLogs()
    {
        return $this->hasMany(VerificationLog::class, 'verifier_user_id', 'user_id');
    }
}
