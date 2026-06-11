<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    public function updateAuthority(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $validator = Validator::make($request->all(), [
            'default_authority_name' => 'nullable|string|max:255',
            'default_authority_title' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $institution->update([
            'default_authority_name' => $request->default_authority_name,
            'default_authority_title' => $request->default_authority_title,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Authority defaults updated successfully',
            'institution' => [
                'default_authority_name' => $institution->default_authority_name,
                'default_authority_title' => $institution->default_authority_title,
            ]
        ]);
    }
}
