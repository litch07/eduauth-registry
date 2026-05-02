<?php

namespace App\Http\Controllers\Admin;

use App\Mail\SendRejectionNotification;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function dashboard()
    {
        $totalUsers = User::whereNull('deleted_at')->count();
        $pendingApprovals = User::where('is_approved', false)
            ->whereNull('deleted_at')
            ->whereIn('role', ['student', 'university', 'verifier'])
            ->count();
        $totalCertificates = \App\Models\Certificate::whereNull('deleted_at')->count();
        $totalActivity = ActivityLog::count();

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'pending_approvals' => $pendingApprovals,
                'total_certificates' => $totalCertificates,
                'total_activity' => $totalActivity,
            ],
        ]);
    }

    public function pendingUsers()
    {
        $users = User::with(['student', 'institution', 'verifier'])
            ->where('is_approved', false)
            ->whereNull('deleted_at')
            ->whereIn('role', ['student', 'university', 'verifier'])
            ->latest()
            ->get();

        return response()->json([
            'pending_users' => $users,
        ]);
    }

    public function approveUser(Request $request, $id)
    {
        $user = User::with(['student', 'institution', 'verifier'])->find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if ($user->is_approved) {
            return response()->json(['error' => 'User is already approved.'], 422);
        }

        $user->forceFill([
            'is_approved' => true,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ])->save();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_approved',
            'entity_type' => User::class,
            'entity_id' => $user->id,
            'description' => 'User approved by administrator.',
            'metadata' => [
                'approved_user_email' => $user->email,
                'role' => $user->role,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'User approved successfully.',
            'user' => $user->fresh(['student', 'institution', 'verifier']),
        ]);
    }

    public function rejectUser(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::with(['student', 'institution', 'verifier'])->find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        try {
            Mail::to($user->email)->send(new SendRejectionNotification($user->fresh(['student', 'institution', 'verifier']), $request->reason));
        } catch (\Throwable $throwable) {
            \Log::error('Failed to send rejection notification', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $throwable->getMessage(),
            ]);
        }

        DB::transaction(function () use ($request, $user) {
            if ($user->student) {
                $user->student->forceDelete();
            }

            if ($user->institution) {
                $user->institution->forceDelete();
            }

            if ($user->verifier) {
                $user->verifier->forceDelete();
            }

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_rejected',
                'entity_type' => User::class,
                'entity_id' => $user->id,
                'description' => 'User rejected by administrator.',
                'metadata' => [
                    'reason' => $request->reason,
                    'rejected_user_email' => $user->email,
                    'role' => $user->role,
                ],
                'ip_address' => $request->ip(),
            ]);

            $user->forceDelete();
        });

        return response()->json([
            'message' => 'User rejected successfully.',
        ]);
    }
}
