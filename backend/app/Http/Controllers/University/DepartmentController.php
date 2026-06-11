<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $query = Department::where('institution_id', $institution->id)
            ->withCount(['enrollments as student_count' => function($q) {
                $q->where('status', 'active');
            }])
            ->orderBy('name', 'asc');

        if ($request->filled('certificate_level_id')) {
            $levelId = (int) $request->query('certificate_level_id');
            $query->where(function ($q) use ($levelId) {
                $q->where('certificate_level_id', $levelId)
                  ->orWhereNull('certificate_level_id');
            });
        }

        $departments = $query->get();

        return response()->json([
            'success' => true,
            'departments' => $departments
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
                Rule::unique('departments', 'name')->where(function ($query) use ($institution) {
                    return $query->where('institution_id', $institution->id);
                })
            ],
            'short_code' => 'nullable|string|max:50',
            'certificate_level_id' => 'nullable|integer|exists:certificate_levels,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $department = Department::create([
            'institution_id' => $institution->id,
            'certificate_level_id' => $request->filled('certificate_level_id') ? $request->certificate_level_id : null,
            'name' => $request->name,
            'short_code' => $request->short_code,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully',
            'department' => $department
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $department = Department::where('institution_id', $institution->id)
            ->where('id', $id)
            ->first();

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('departments', 'name')->where(function ($query) use ($institution, $id) {
                    return $query->where('institution_id', $institution->id)->where('id', '!=', $id);
                })
            ],
            'short_code' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'certificate_level_id' => 'nullable|integer|exists:certificate_levels,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $department->update([
            'name' => $request->name,
            'short_code' => $request->short_code,
            'is_active' => $request->has('is_active') ? $request->is_active : $department->is_active,
            'certificate_level_id' => $request->has('certificate_level_id') ? $request->certificate_level_id : $department->certificate_level_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully',
            'department' => $department
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $department = Department::where('institution_id', $institution->id)
            ->where('id', $id)
            ->first();

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        // Soft disable instead of delete
        $department->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Department deactivated successfully',
            'department' => $department
        ]);
    }

    public function reactivate(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $department = Department::where('institution_id', $institution->id)
            ->where('id', $id)
            ->first();

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $department->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Department reactivated successfully',
            'department' => $department
        ]);
    }
}
