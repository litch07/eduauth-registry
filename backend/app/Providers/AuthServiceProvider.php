<?php

namespace App\Providers;

use App\Models\Certificate;
use App\Models\VerifierAccess;
use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        Gate::define('view-certificate-pdf', function (User $user, Certificate $certificate) {
            // Student who owns the certificate
            if ($user->role === 'student' && $user->id === $certificate->student->user_id) {
                return true;
            }

            // University that issued the certificate
            if ($user->role === 'university' && $user->id === $certificate->institution->user_id) {
                return true;
            }
            
            // Verifier who has active access to the student's certificates
            if ($user->role === 'verifier' && $user->verifier) {
                return VerifierAccess::where('verifier_id', $user->verifier->id)
                    ->where('student_id', $certificate->student_id)
                    ->active()
                    ->exists();
            }

            return false;
        });
    }
}
