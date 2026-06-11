<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\ProgramChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProgramChangeRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['success' => false, 'message' => 'Student profile not found'], 404);
        }

        $requests = ProgramChangeRequest::with(['institution', 'requestedDepartment', 'requestedMajor'])
            ->where('student_id', $user->student->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'institution_name' => $req->institution->name,
                    'requested_department' => $req->requestedDepartment->name,
                    'requested_major' => $req->requestedMajor?->name,
                    'reason' => $req->reason,
                    'status' => $req->status,
                    'admin_note' => $req->admin_note,
                    'created_at' => $req->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'requests' => $requests
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->student) {
            return response()->json(['success' => false, 'message' => 'Student profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'enrollment_id' => 'required|exists:enrollments,id',
            'requested_department_id' => 'required|exists:departments,id',
            'requested_major_id' => 'nullable|exists:majors,id',
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $enrollment = Enrollment::where('id', $request->enrollment_id)
            ->where('student_id', $user->student->id)
            ->first();

        if (!$enrollment) {
            return response()->json(['success' => false, 'message' => 'Enrollment not found or unauthorized'], 403);
        }

        if ($enrollment->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Program change requests can only be made for active enrollments'], 400);
        }

        // Check for existing pending requests
        $existing = ProgramChangeRequest::where('enrollment_id', $enrollment->id)
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'You already have a pending program change request for this enrollment'], 400);
        }

        $programRequest = ProgramChangeRequest::create([
            'enrollment_id' => $enrollment->id,
            'student_id' => $user->student->id,
            'institution_id' => $enrollment->institution_id,
            'requested_department_id' => $request->requested_department_id,
            'requested_major_id' => $request->requested_major_id,
            'reason' => $request->reason,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Program change request submitted successfully',
            'request' => $programRequest
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $programRequest = ProgramChangeRequest::where('id', $id)
            ->where('student_id', $user->student->id)
            ->first();

        if (!$programRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found or unauthorized'], 403);
        }

        if ($programRequest->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be cancelled'], 400);
        }

        $programRequest->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Program change request cancelled'
        ]);
    }
}
