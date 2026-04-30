<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CertificateSequence extends Model
{
    use HasFactory;

    protected $fillable = [
        'sequence_key',
        'prefix',
        'year_suffix',
        'current_sequence',
        'last_generated_at',
    ];

    protected $casts = [
        'current_sequence' => 'integer',
        'last_generated_at' => 'datetime',
    ];
}
