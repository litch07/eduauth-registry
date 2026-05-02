<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PendingRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'user_name',
        'registration_role',
        'code_hash',
        'expires_at',
        'verified_at',
        'attempts',
        'registration_data',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'attempts' => 'integer',
        'registration_data' => 'array',
    ];

    public function scopeValid($query)
    {
        return $query->whereNull('verified_at')->where('expires_at', '>', now());
    }
}