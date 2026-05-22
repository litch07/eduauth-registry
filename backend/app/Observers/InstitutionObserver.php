<?php

namespace App\Observers;

use App\Models\Institution;

class InstitutionObserver
{
    /**
     * Cascade soft-delete from Institution to related Enrollments and Certificates.
     * This prevents orphaned enrollment and certificate records from remaining
     * active after an institution is removed from the system.
     */
    public function deleting(Institution $institution): void
    {
        // Soft-delete all enrollments under this institution
        $institution->enrollments()->each(fn ($enrollment) => $enrollment->delete());

        // Soft-delete all certificates issued by this institution
        $institution->certificates()->each(fn ($certificate) => $certificate->delete());
    }
}
