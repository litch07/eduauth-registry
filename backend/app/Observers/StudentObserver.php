<?php

namespace App\Observers;

use App\Models\Student;

class StudentObserver
{
    /**
     * Cascade soft-delete from Student to all related records.
     * This ensures that when a student is removed, all their data is
     * logically removed from the system to preserve data integrity
     * and comply with data privacy requirements.
     */
    public function deleting(Student $student): void
    {
        // Soft-delete all enrollments belonging to this student
        $student->enrollments()->each(fn ($enrollment) => $enrollment->delete());

        // Soft-delete all certificates belonging to this student
        $student->certificates()->each(fn ($certificate) => $certificate->delete());

        // Delete all access requests (no soft-deletes on this model, so force-delete)
        $student->accessRequests()->each(fn ($request) => $request->delete());

        // Revoke any active verifier access grants for this student
        $student->verifierAccesses()->each(fn ($access) => $access->delete());
    }
}
