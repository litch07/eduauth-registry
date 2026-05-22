<?php

namespace App\Providers;

use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Observers\InstitutionObserver;
use App\Observers\StudentObserver;
use App\Observers\UserObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Register model observers to handle cascade soft-deletes.
        // These ensure that when a User, Student, or Institution is soft-deleted,
        // all their related records are logically removed as well.
        User::observe(UserObserver::class);
        Student::observe(StudentObserver::class);
        Institution::observe(InstitutionObserver::class);
    }
}
