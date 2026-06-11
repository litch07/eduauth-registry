<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\CertificateLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CertificateLevelController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $levels = CertificateLevel::where('institution_id', $institution->id)
            ->withCount(['enrollments as student_count' => function($q) {
                $q->where('status', 'active');
            }])
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'certificate_levels' => $levels
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('certificate_levels', 'name')->where(function ($query) use ($institution) {
                    return $query->where('institution_id', $institution->id);
                })
            ],
            'short_code' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $level = CertificateLevel::create([
            'institution_id' => $institution->id,
            'name' => $request->name,
            'short_code' => $request->short_code,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Certificate level created successfully',
            'certificate_level' => $level
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $level = CertificateLevel::where('institution_id', $institution->id)
            ->where('id', $id)
            ->first();

        if (!$level) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate level not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('certificate_levels', 'name')->where(function ($query) use ($institution, $id) {
                    return $query->where('institution_id', $institution->id)->where('id', '!=', $id);
                })
            ],
            'short_code' => 'required|string|max:20',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $level->update([
            'name' => $request->name,
            'short_code' => $request->short_code,
            'is_active' => $request->has('is_active') ? $request->is_active : $level->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Certificate level updated successfully',
            'certificate_level' => $level
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $level = CertificateLevel::where('institution_id', $institution->id)
            ->where('id', $id)
            ->first();

        if (!$level) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate level not found'
            ], 404);
        }

        $level->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Certificate level deactivated successfully',
            'certificate_level' => $level
        ]);
    }

    public function reactivate(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $level = CertificateLevel::where('institution_id', $institution->id)
            ->where('id', $id)
            ->first();

        if (!$level) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate level not found'
            ], 404);
        }

        $level->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Certificate level reactivated successfully',
            'certificate_level' => $level
        ]);
    }
}
