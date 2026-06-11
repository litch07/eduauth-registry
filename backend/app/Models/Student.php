<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Services\EncryptionService;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'nid_hash',
        'nid_encrypted',
        'date_of_birth',
        'gender',
        'phone',
        'address',
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

    /**
     * The student's current (active) institution via the active enrollment.
     * Resolves $student->institution as a single Institution model.
     */
    public function institution()
    {
        return $this->hasOneThrough(
            Institution::class,
            Enrollment::class,
            'student_id',    // FK on enrollments pointing to students
            'id',            // FK on institutions
            'id',            // local key on students
            'institution_id' // local key on enrollments
        )->where('enrollments.status', 'active');
    }

    public function enrollmentApplications()
    {
        return $this->hasMany(EnrollmentApplication::class);
    }


    public function getFullNameAttribute()
    {
        return trim(collect([$this->first_name, $this->middle_name, $this->last_name])->filter()->implode(' '));
    }

    /**
     * Decrypt the NID from the nid_encrypted column.
     *
     * Returns '[Not Available]' for legacy records where nid_encrypted is null
     * (these students only have nid_hash and their NID cannot be recovered).
     *
     * @return string Decrypted NID, '[Not Available]' if no encrypted value, or '[Encrypted]' on decryption failure
     */
    public function getNidDecryptedAttribute(): string
    {
        if (is_null($this->nid_encrypted)) {
            return '[Not Available]';
        }

        return EncryptionService::decryptNid($this->nid_encrypted);
    }
}
