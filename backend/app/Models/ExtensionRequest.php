<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExtensionRequest extends Model
{
    protected $fillable = [
        'enrollment_id',
        'student_id',
        'requested_graduation_date',
        'reason',
        'supporting_document_path',
        'status',
        'university_response',
        'counter_offered_date',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'requested_graduation_date' => 'date',
        'counter_offered_date' => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
