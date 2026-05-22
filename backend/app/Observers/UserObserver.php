<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * Cascade soft-delete from User down to their Student profile.
     * The StudentObserver then handles cascading further down to
     * Enrollments, Certificates, and Access Requests.
     */
    public function deleting(User $user): void
    {
        // If the user is a student, cascade delete their student profile
        if ($user->student) {
            $user->student->delete();
        }

        // If the user is an institution, cascade delete their institution profile
        if ($user->institution) {
            $user->institution->delete();
        }

        // If the user is a verifier, cascade delete their verifier profile
        if ($user->verifier) {
            $user->verifier->delete();
        }
    }
}
