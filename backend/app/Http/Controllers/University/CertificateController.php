<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Mail\CertificateIssuedMail;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\CertificateSequence;
use App\Models\Enrollment;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Notifications\AppNotification;
use App\Services\BatchCertificateService;
use App\Services\SerialGeneratorService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use SplFileObject;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $certificates = Certificate::with('student.user')
            ->where('institution_id', $institution->id)
            ->orderBy('issue_date', 'desc')
            ->get()
            ->map(function ($cert) {
                return [
                    'id' => $cert->id,
                    'serial' => $cert->serial,
                    'student_name' => $cert->student?->user?->name ?? 'N/A',
                    'certificate_name' => $cert->certificate_name,
                    'issue_date' => $cert->issue_date,
                    'revoked_at' => $cert->revoked_at,
                    'revocation_reason' => $cert->revocation_reason,
                ];
            });

        return response()->json([
            'success' => true,
            'certificates' => $certificates,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_id' => ['required', Rule::exists('students', 'id')->whereNull('deleted_at')],
                'certificate_level' => 'required|in:Bachelor,Master,PhD',
                'certificate_name' => 'required|string|max:255',
                'department' => 'required|string|max:255',
                'major' => 'required|string|max:255',
                'session' => 'required|string|max:100',
                'cgpa' => 'nullable|numeric|min:0|max:4',
                'degree_class' => 'nullable|string|max:100',
                'issue_date' => 'required|date|before_or_equal:today',
                'convocation_date' => 'nullable|date|after_or_equal:issue_date',
                'authority_name' => 'required|string|max:255',
                'authority_title' => 'required|string|max:255',
                'is_publicly_shareable' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            $enrollment = Enrollment::where('student_id', $request->student_id)
                ->where('institution_id', $institution->id)
                ->whereIn('status', ['active', 'graduated'])
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is not enrolled in your institution or enrollment is not active/graduated'
                ], 403);
            }

            $existingCertificate = Certificate::where('student_id', $request->student_id)
                ->where('institution_id', $institution->id)
                ->where('certificate_name', $request->certificate_name)
                ->where('session', $request->session)
                ->whereNull('revoked_at')
                ->first();

            if ($existingCertificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A certificate with the same name and session already exists for this student',
                    'existing_serial' => $existingCertificate->serial,
                ], 409);
            }

            $certificate = DB::transaction(function () use ($request, $institution, $enrollment, $user) {
                $serial = SerialGeneratorService::generate($request->certificate_level);

                $certificate = Certificate::create([
                    'serial' => $serial,
                    'student_id' => $request->student_id,
                    'institution_id' => $institution->id,
                    'enrollment_id' => $enrollment->id,
                    'issued_by' => $user->id,
                    'certificate_level' => $request->certificate_level,
                    'certificate_name' => $request->certificate_name,
                    'department' => $request->department,
                    'major' => $request->major,
                    'session' => $request->session,
                    'cgpa' => $request->cgpa,
                    'degree_class' => $request->degree_class,
                    'issue_date' => $request->issue_date,
                    'convocation_date' => $request->convocation_date,
                    'authority_name' => $request->authority_name,
                    'authority_title' => $request->authority_title,
                    'is_publicly_shareable' => $request->is_publicly_shareable ?? true,
                ]);

                ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => 'CERTIFICATE_ISSUED',
                    'description' => "Issued certificate {$serial} to student ID {$request->student_id}",
                    'ip_address' => $request->ip(),
                ]);

                // Auto-graduate the student if they were still active
                if ($enrollment->status === 'active') {
                    $enrollment->update([
                        'status' => 'graduated',
                        'actual_graduation_date' => $request->issue_date,
                    ]);

                    ActivityLog::create([
                        'user_id' => $user->id,
                        'action' => 'ENROLLMENT_STATUS_UPDATED',
                        'description' => "Auto-graduated student ID {$request->student_id} upon certificate issuance.",
                        'ip_address' => $request->ip(),
                    ]);
                }

                return $certificate;
            });

            try {
                $student = $enrollment->student;
                if ($student && $student->user) {
                    Mail::to($student->user->email)->queue(new CertificateIssuedMail($certificate));
                    
                    $student->user->notify(new AppNotification(
                        'CERTIFICATE_ISSUED',
                        'Certificate Issued',
                        "Your certificate {$certificate->certificate_name} has been issued.",
                        '/student/certificates'
                    ));
                }
            } catch (\Throwable $throwable) {
                \Log::error('Failed to queue certificate issued notification', [
                    'certificate_id' => $certificate->id,
                    'student_id' => $request->student_id,
                    'error' => $throwable->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Certificate issued successfully',
                'certificate' => [
                    'id' => $certificate->id,
                    'serial' => $certificate->serial,
                    'certificate_name' => $certificate->certificate_name,
                    'issue_date' => $certificate->issue_date,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to issue certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function batchIssue(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
            'certificate_name' => 'required|string',
            'department' => 'required|string',
            'major' => 'required|string',
            'session' => 'required|string',
            'authority_name' => 'required|string',
            'authority_title' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();
        $institution = $user->institution;
        
        $file = $request->file('csv_file');
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_shift($csvData);
        
        $results = [
            'processed' => 0,
            'failed' => 0,
            'errors' => [],
            'certificates' => []
        ];
        
        DB::beginTransaction();
        
        try {
            foreach ($csvData as $index => $row) {
                $rowNum = $index + 2;
                $data = array_combine($header, $row);

                $rowValidator = Validator::make($data, [
                    'student_email' => 'required|email',
                    'certificate_level' => 'required|in:Bachelor,Master,PhD',
                    'cgpa' => 'nullable|numeric|min:0|max:4',
                    'degree_class' => 'nullable|string',
                    'issue_date' => 'required|date',
                    'convocation_date' => 'nullable|date|after_or_equal:issue_date',
                ]);
                
                if ($rowValidator->fails()) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'row' => $rowNum,
                        'student_email' => $data['student_email'] ?? 'N/A',
                        'error' => $rowValidator->errors()->first()
                    ];
                    continue;
                }
                
                $studentUser = User::where('email', $data['student_email'])
                    ->where('role', 'student')
                    ->where('is_approved', true)
                    ->first();

                if (!$studentUser || !$studentUser->student) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => 'Student not found or not approved'];
                    continue;
                }

                $student = $studentUser->student;

                $enrollment = Enrollment::where('student_id', $student->id)
                    ->where('institution_id', $institution->id)
                    ->whereIn('status', ['active', 'graduated'])
                    ->first();

                if (!$enrollment) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => 'Student not enrolled in your institution'];
                    continue;
                }

                $serial = SerialGeneratorService::generate($data['certificate_level']);

                $certificate = Certificate::create([
                    'serial' => $serial,
                    'student_id' => $student->id,
                    'institution_id' => $institution->id,
                    'enrollment_id' => $enrollment->id,
                    'issued_by' => $user->id,
                    'certificate_level' => $data['certificate_level'],
                    'certificate_name' => $request->certificate_name,
                    'department' => $request->department,
                    'major' => $request->major,
                    'session' => $request->session,
                    'cgpa' => $data['cgpa'] ?? null,
                    'degree_class' => $data['degree_class'] ?? null,
                    'issue_date' => $data['issue_date'],
                    'convocation_date' => $data['convocation_date'] ?? null,
                    'authority_name' => $request->authority_name,
                    'authority_title' => $request->authority_title,
                    'is_publicly_shareable' => true,
                ]);
                
                $results['processed']++;
                $results['certificates'][] = ['serial' => $serial, 'student_name' => $studentUser->name, 'student_email' => $data['student_email']];

                \App\Models\ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => 'CERTIFICATE_BATCH_ISSUED',
                    'description' => "Issued certificate {$serial} via batch upload",
                    'ip_address' => $request->ip(),
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => "Processed {$results['processed']} certificates, {$results['failed']} failed",
                'results' => $results
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Batch import failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function downloadSampleCSV()
    {
        $csvContent = "student_email,certificate_level,cgpa,degree_class,issue_date,convocation_date\n";
        $csvContent .= "student@example.com,Bachelor,3.75,First Class,2024-05-15,2024-06-20\n";
        $csvContent .= "student2@example.com,Master,3.90,First Class,2024-05-15,\n";
        
        return response($csvContent, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="certificate_batch_template.csv"');
    }
}
