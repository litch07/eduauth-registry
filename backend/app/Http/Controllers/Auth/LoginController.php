<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid email or password. Please try again.'], 401);
        }

        if (!$user->email_verified_at) {
            return response()->json(['error' => 'Email not verified. Please check your inbox.'], 403);
        }

        if (!$user->is_approved && $user->role !== 'admin') {
            return response()->json(['error' => 'Account pending admin approval. You\'ll be notified by email.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        $user->load(['student', 'institution', 'verifier']);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'logged_in',
            'entity_type' => User::class,
            'entity_id' => $user->id,
            'description' => 'User authenticated successfully.',
            'metadata' => [
                'role' => $user->role,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        if ($user) {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'logged_out',
                'entity_type' => User::class,
                'entity_id' => $user->id,
                'description' => 'User logged out from the API.',
                'metadata' => [
                    'role' => $user->role,
                ],
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $user->load(['student', 'institution', 'verifier']);

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }
}
