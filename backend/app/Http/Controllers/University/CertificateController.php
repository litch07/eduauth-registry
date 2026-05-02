<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\CertificateSequence;
use App\Models\Institution;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CertificateController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|string|max:50',
            'degree_title' => 'required|string|max:255',
            'program_name' => 'nullable|string|max:255',
            'major' => 'nullable|string|max:255',
            'registration_no' => 'nullable|string|max:100',
            'cgpa' => 'nullable|numeric|min:0|max:4',
            'issue_date' => 'required|date',
            'completion_date' => 'nullable|date|after_or_equal:issue_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institution = Institution::where('user_id', $request->user()->id)->first();

        if (!$institution) {
            return response()->json(['error' => 'Institution profile not found.'], 404);
        }

        $payload = $validator->validated();
        $studentIdentifier = trim($payload['student_id']);
        $student = Student::query()
            ->where('student_id', $studentIdentifier)
            ->orWhere('id', is_numeric($studentIdentifier) ? (int) $studentIdentifier : 0)
            ->first();

        if (!$student) {
            return response()->json([
                'error' => 'Student not found. Please enter a valid student ID.',
                'errors' => [
                    'student_id' => ['Student not found. Please check the student ID and try again.'],
                ],
            ], 422);
        }

        try {
            $certificate = DB::transaction(function () use ($payload, $institution, $request, $student) {
                $sequence = CertificateSequence::where('sequence_key', 'certificate_serial')->lockForUpdate()->first();

                if (!$sequence) {
                    $sequence = CertificateSequence::create([
                        'sequence_key' => 'certificate_serial',
                        'prefix' => 'BSC',
                        'year_suffix' => now()->format('y'),
                        'current_sequence' => 0,
                    ]);
                    $sequence = CertificateSequence::whereKey($sequence->id)->lockForUpdate()->firstOrFail();
                }

                if ($sequence->year_suffix !== now()->format('y')) {
                    $sequence->forceFill([
                        'year_suffix' => now()->format('y'),
                        'current_sequence' => 0,
                    ])->save();
                }

                $sequence->increment('current_sequence');
                $sequence->refresh();
                $serial = $this->generateSerial($sequence);

                $certificate = Certificate::create([
                    'student_id' => $student->id,
                    'institution_id' => $institution->id,
                    'issued_by' => $request->user()->id,
                    'serial' => $serial,
                    'degree_title' => $payload['degree_title'],
                    'program_name' => $payload['program_name'] ?? null,
                    'major' => $payload['major'] ?? null,
                    'registration_no' => $payload['registration_no'] ?? null,
                    'cgpa' => $payload['cgpa'] ?? null,
                    'issue_date' => $payload['issue_date'],
                    'completion_date' => $payload['completion_date'] ?? null,
                    'is_public' => true,
                ]);

                ActivityLog::create([
                    'user_id' => $request->user()->id,
                    'action' => 'certificate_issued',
                    'entity_type' => Certificate::class,
                    'entity_id' => $certificate->id,
                    'description' => 'Certificate issued for student.',
                    'metadata' => [
                        'serial' => $certificate->serial,
                        'student_id' => $certificate->student_id,
                        'institution_id' => $certificate->institution_id,
                    ],
                    'ip_address' => $request->ip(),
                ]);

                return $certificate;
            }, 3);

            return response()->json([
                'message' => 'Certificate issued successfully.',
                'certificate' => $certificate->load(['student', 'institution', 'issuedBy']),
            ], 201);
        } catch (\Throwable $throwable) {
            report($throwable);

            return response()->json([
                'error' => 'Unable to issue certificate at this time.',
            ], 500);
        }
    }

    private function generateSerial(CertificateSequence $sequence): string
    {
        $serialNumber = str_pad((string) $sequence->current_sequence, 6, '0', STR_PAD_LEFT);
        $rawValue = strtoupper($sequence->prefix).$sequence->year_suffix.$serialNumber;
        $checksum = chr(65 + (array_sum(array_map('ord', str_split($rawValue))) % 26));

        return sprintf('%s-%s-%s%s', strtoupper($sequence->prefix), $sequence->year_suffix, $serialNumber, $checksum);
    }
}
