<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
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

        if ($user->student) {
            $user->student->delete();
        }

        if ($user->institution) {
            $user->institution->delete();
        }

        if ($user->verifier) {
            $user->verifier->delete();
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

        $user->delete();

        return response()->json([
            'message' => 'User rejected successfully.',
        ]);
    }
}
