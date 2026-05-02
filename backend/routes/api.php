<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Student\CertificateController as StudentCertificate;
use App\Http\Controllers\Student\DashboardController as StudentDashboard;
use App\Http\Controllers\University\CertificateController as UniversityCertificate;
use App\Http\Controllers\University\DashboardController as UniversityDashboard;
use App\Http\Controllers\Verifier\VerifyController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/auth/resend-verification', [AuthController::class, 'resendVerificationCode']);
Route::post('/verify/certificate', [VerifyController::class, 'verify']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::prefix('student')->middleware(\App\Http\Middleware\CheckRole::class.':student')->group(function () {
        Route::get('/dashboard', [StudentDashboard::class, 'index']);
        Route::get('/certificates', [StudentCertificate::class, 'index']);
        Route::get('/certificates/{id}', [StudentCertificate::class, 'show']);
        Route::post('/certificates/{id}/toggle-visibility', [StudentCertificate::class, 'toggleVisibility']);
    });

    Route::prefix('university')->middleware(\App\Http\Middleware\CheckRole::class.':university')->group(function () {
        Route::get('/dashboard', [UniversityDashboard::class, 'index']);
        Route::post('/certificates', [UniversityCertificate::class, 'store']);
    });

    Route::prefix('verifier')->middleware(\App\Http\Middleware\CheckRole::class.':verifier')->group(function () {
        Route::get('/dashboard', [VerifyController::class, 'dashboard']);
        Route::post('/verify', [VerifyController::class, 'verify']);
    });

    Route::prefix('admin')->middleware(\App\Http\Middleware\CheckRole::class.':admin')->group(function () {
        Route::get('/dashboard', [UserController::class, 'dashboard']);
        Route::get('/pending-users', [UserController::class, 'pendingUsers']);
        Route::post('/approve-user/{id}', [UserController::class, 'approveUser']);
        Route::post('/reject-user/{id}', [UserController::class, 'rejectUser']);
    });
});
