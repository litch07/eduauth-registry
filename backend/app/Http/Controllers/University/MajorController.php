<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Major;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MajorController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;
        $departmentId = $request->query('department_id');

        $query = Major::whereHas('department', function ($q) use ($institution) {
            $q->where('institution_id', $institution->id);
        });

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $majors = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'majors' => $majors
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $validator = Validator::make($request->all(), [
            'department_id' => 'required|integer',
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('majors', 'name')->where(function ($query) use ($request) {
                    return $query->where('department_id', $request->department_id);
                })
            ]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $department = Department::where('institution_id', $institution->id)
            ->where('id', $request->department_id)
            ->first();

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $major = Major::create([
            'department_id' => $department->id,
            'name' => $request->name,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Major created successfully',
            'major' => $major
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $major = Major::whereHas('department', function ($q) use ($institution) {
            $q->where('institution_id', $institution->id);
        })->where('id', $id)->first();

        if (!$major) {
            return response()->json([
                'success' => false,
                'message' => 'Major not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('majors', 'name')->where(function ($query) use ($major, $id) {
                    return $query->where('department_id', $major->department_id)->where('id', '!=', $id);
                })
            ],
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $major->update([
            'name' => $request->name,
            'is_active' => $request->has('is_active') ? $request->is_active : $major->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Major updated successfully',
            'major' => $major
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $major = Major::whereHas('department', function ($q) use ($institution) {
            $q->where('institution_id', $institution->id);
        })->where('id', $id)->first();

        if (!$major) {
            return response()->json([
                'success' => false,
                'message' => 'Major not found'
            ], 404);
        }

        $major->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Major deactivated successfully',
            'major' => $major
        ]);
    }

    public function reactivate(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $major = Major::whereHas('department', function ($q) use ($institution) {
            $q->where('institution_id', $institution->id);
        })->where('id', $id)->first();

        if (!$major) {
            return response()->json([
                'success' => false,
                'message' => 'Major not found'
            ], 404);
        }

        $major->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Major reactivated successfully',
            'major' => $major
        ]);
    }
}
