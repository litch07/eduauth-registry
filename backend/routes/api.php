<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\CertificateController as AdminCertificateController;
use App\Http\Controllers\Admin\ProfileChangeRequestController as AdminProfileChangeRequestController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileChangeRequestController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\Student\AccessRequestController as StudentAccessRequestController;
use App\Http\Controllers\Student\CertificateController as StudentCertificate;
use App\Http\Controllers\Student\DashboardController as StudentDashboard;
use App\Http\Controllers\Student\WithdrawalController as StudentWithdrawalController;
use App\Http\Controllers\Student\ExtensionRequestController as StudentExtensionRequestController;
use App\Http\Controllers\Student\EnrollmentApplicationController as StudentEnrollmentApplicationController;
use App\Http\Controllers\University\CertificateController as UniversityCertificate;
use App\Http\Controllers\University\DashboardController as UniversityDashboard;
use App\Http\Controllers\University\DepartmentController;
use App\Http\Controllers\University\EnrollmentController;
use App\Http\Controllers\University\WithdrawalController as UniversityWithdrawalController;
use App\Http\Controllers\Verifier\AccessRequestController as VerifierAccessRequestController;
use App\Http\Controllers\Verifier\VerifyController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [RegisterController::class, 'register']);
Route::post('/auth/login', [LoginController::class, 'login']);
Route::post('/auth/verify-email', [VerificationController::class, 'verifyEmail']);
Route::post('/auth/resend-verification', [VerificationController::class, 'resendVerificationCode']);
Route::post('/verify/certificate', [VerifyController::class, 'verify']);
Route::get('/verify-link', [VerifyController::class, 'verifyFromLink']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [LoginController::class, 'logout']);
    Route::get('/auth/me', [LoginController::class, 'me']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('/profile/activity', [ProfileController::class, 'activity']);

    Route::get('/profile/change-requests', [ProfileChangeRequestController::class, 'myRequests']);
    Route::post('/profile/change-requests', [ProfileChangeRequestController::class, 'store']);
    Route::delete('/profile/change-requests/{id}', [ProfileChangeRequestController::class, 'cancel']);

    Route::get('/certificates/{id}/pdf', [CertificateController::class, 'downloadPDF']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/all', [NotificationController::class, 'all']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/settings/reset', [SettingsController::class, 'reset']);

    Route::get('/certificates/search', [CertificateController::class, 'searchCertificates']);
    Route::get('/students/search', [\App\Http\Controllers\StudentController::class, 'search']);

    Route::prefix('student')->middleware(\App\Http\Middleware\CheckRole::class.':student')->group(function () {
        Route::get('/dashboard', [StudentDashboard::class, 'index']);
        Route::get('/certificates', [StudentCertificate::class, 'index']);
        Route::get('/certificates/{id}', [StudentCertificate::class, 'show']);
        Route::post('/certificates/{id}/toggle-visibility', [StudentCertificate::class, 'toggleVisibility']);

        Route::get('/access-requests', [StudentAccessRequestController::class, 'index']);
        Route::post('/access-requests/{id}/approve', [StudentAccessRequestController::class, 'approve']);
        Route::post('/access-requests/{id}/reject', [StudentAccessRequestController::class, 'reject']);
        Route::get('/granted-access', [StudentAccessRequestController::class, 'grantedAccess']);
        Route::post('/granted-access/{id}/revoke', [StudentAccessRequestController::class, 'revokeAccess']);

        Route::post('/withdrawal/request', [StudentWithdrawalController::class, 'requestWithdrawal']);
        Route::get('/withdrawal/requests', [StudentWithdrawalController::class, 'myRequests']);

        Route::get('/extension-requests', [StudentExtensionRequestController::class, 'index']);
        Route::post('/extension-requests', [StudentExtensionRequestController::class, 'store']);
        Route::delete('/extension-requests/{id}', [StudentExtensionRequestController::class, 'destroy']);
        Route::post('/extension-requests/{id}/accept', [StudentExtensionRequestController::class, 'acceptCounterOffer']);
        Route::post('/extension-requests/{id}/decline', [StudentExtensionRequestController::class, 'declineCounterOffer']);

        Route::get('/universities', [StudentEnrollmentApplicationController::class, 'institutions']);
        Route::get('/enrollment-applications', [StudentEnrollmentApplicationController::class, 'index']);
        Route::post('/enrollment-applications', [StudentEnrollmentApplicationController::class, 'store']);
        Route::delete('/enrollment-applications/{id}', [StudentEnrollmentApplicationController::class, 'destroy']);
    });

    Route::prefix('university')->middleware(\App\Http\Middleware\CheckRole::class.':university')->group(function () {
        Route::get('/dashboard', [UniversityDashboard::class, 'index']);
        
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::put('/departments/{id}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);

        Route::get('/enrollments', [EnrollmentController::class, 'index']);
        Route::get('/enrollments/programs', [EnrollmentController::class, 'programs']);
        Route::post('/enrollments', [EnrollmentController::class, 'store']);
        Route::patch('/enrollments/{id}', [EnrollmentController::class, 'update']);
        Route::patch('/enrollments/{id}/status', [EnrollmentController::class, 'updateStatus']);
        Route::patch('/enrollments/{id}/extend-graduation', [EnrollmentController::class, 'extendGraduation']);
        Route::get('/students/search', [EnrollmentController::class, 'searchStudents']);

        Route::post('/certificates', [UniversityCertificate::class, 'store']);
        Route::post('/certificates/batch', [UniversityCertificate::class, 'batchIssue']);
        Route::get('/certificates/batch-template', [UniversityCertificate::class, 'downloadSampleCSV']);
        Route::get('/certificates', [UniversityCertificate::class, 'index']);
        Route::get('/certificates/prefill/{studentId}', [UniversityCertificate::class, 'prefill']);
        Route::post('/certificates/{id}/revoke', [CertificateController::class, 'revoke']);

        Route::get('/withdrawal/pending', [UniversityWithdrawalController::class, 'pendingRequests']);
        Route::post('/withdrawal/{id}/approve', [UniversityWithdrawalController::class, 'approveWithdrawal']);
        Route::post('/withdrawal/{id}/reject', [UniversityWithdrawalController::class, 'rejectWithdrawal']);
        Route::post('/enrollments/{id}/withdraw', [UniversityWithdrawalController::class, 'withdrawStudent']);

        Route::get('/extension-requests', [EnrollmentController::class, 'extensionRequests']);
        Route::post('/extension-requests/{id}/approve', [EnrollmentController::class, 'approveExtension']);
        Route::post('/extension-requests/{id}/reject', [EnrollmentController::class, 'rejectExtension']);
        Route::post('/extension-requests/{id}/counter-offer', [EnrollmentController::class, 'counterOfferExtension']);

        Route::get('/enrollment-applications', [EnrollmentController::class, 'applications']);
        Route::post('/enrollment-applications/{id}/approve', [EnrollmentController::class, 'approveApplication']);
        Route::post('/enrollment-applications/{id}/reject', [EnrollmentController::class, 'rejectApplication']);
        Route::post('/enrollment-applications/{id}/request-more-info', [EnrollmentController::class, 'requestMoreInfo']);
    });

    Route::prefix('verifier')->middleware(\App\Http\Middleware\CheckRole::class.':verifier')->group(function () {
        Route::get('/dashboard', [VerifyController::class, 'dashboard']);
        Route::post('/verify', [VerifyController::class, 'verify']);
        Route::get('/verifications/recent', [VerifyController::class, 'recentVerifications']);
        Route::get('/verifications/export', [VerifyController::class, 'exportVerifications']);
        Route::get('/verifications/history', [VerifyController::class, 'verificationHistory']);
        Route::get('/students/search', [VerifierAccessRequestController::class, 'searchStudents']);
        Route::get('/students/{studentId}', [VerifierAccessRequestController::class, 'showStudentProfile']);

        Route::post('/access-requests', [VerifierAccessRequestController::class, 'store']);
        Route::get('/access-requests', [VerifierAccessRequestController::class, 'index']);
        Route::delete('/access-requests/{id}', [VerifierAccessRequestController::class, 'cancel']);
        Route::get('/accessible-students', [VerifierAccessRequestController::class, 'accessibleStudents']);
    });

    Route::prefix('admin')->middleware(\App\Http\Middleware\CheckRole::class.':admin')->group(function () {
        Route::get('/dashboard', [UserController::class, 'dashboard']);
        Route::get('/search', [UserController::class, 'search']);
        Route::get('/pending-users', [UserController::class, 'pendingUsers']);
        Route::post('/approve-user/{id}', [UserController::class, 'approveUser']);
        Route::post('/reject-user/{id}', [UserController::class, 'rejectUser']);
        Route::get('/certificates', [CertificateController::class, 'index']);
        Route::post('/certificates/{id}/revoke', [CertificateController::class, 'revoke']);
        Route::post('/certificates/{id}/restore', [AdminCertificateController::class, 'restore']);
        Route::get('/analytics', [AnalyticsController::class, 'index']);

        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/export', [UserController::class, 'exportUsers']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::get('/users/{id}/certificates', [UserController::class, 'userCertificates']);
        Route::get('/users/{id}/enrollments', [UserController::class, 'userEnrollments']);
        Route::get('/users/{id}/activity', [UserController::class, 'userActivity']);
        Route::get('/certificates/{id}/details', [UserController::class, 'certificateDetails']);

        Route::get('/profile-change-requests', [AdminProfileChangeRequestController::class, 'index']);
        Route::get('/profile-change-requests/{id}', [AdminProfileChangeRequestController::class, 'show']);
        Route::post('/profile-change-requests/{id}/approve', [AdminProfileChangeRequestController::class, 'approve']);
        Route::post('/profile-change-requests/{id}/reject', [AdminProfileChangeRequestController::class, 'reject']);
        Route::get('/profile-change-requests/{id}/documents/{index}', [AdminProfileChangeRequestController::class, 'downloadDocument']);
    });
});

