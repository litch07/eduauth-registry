<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->first();

        if (!$student) {
            return response()->json(['error' => 'Student profile not found.'], 404);
        }

        $certificates = Certificate::with(['institution', 'issuedBy'])
            ->where('student_id', $student->id)
            ->whereNull('revoked_at')
            ->latest()
            ->get();

        return response()->json([
            'certificates' => $certificates,
        ]);
    }
}
