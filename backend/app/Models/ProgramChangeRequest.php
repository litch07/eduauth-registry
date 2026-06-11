<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'student_id',
        'institution_id',
        'requested_department_id',
        'requested_major_id',
        'reason',
        'status',
        'admin_note'
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function requestedDepartment()
    {
        return $this->belongsTo(Department::class, 'requested_department_id');
    }

    public function requestedMajor()
    {
        return $this->belongsTo(Major::class, 'requested_major_id');
    }
}
