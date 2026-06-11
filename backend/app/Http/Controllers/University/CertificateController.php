<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Mail\CertificateIssuedMail;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\CertificateLevel;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Major;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSetting;
use App\Notifications\AppNotification;
use App\Services\SerialGeneratorService;
use App\Services\CertificateService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $certificates = Certificate::with(['student.user', 'certificateLevel'])
            ->where('institution_id', $institution->id)
            ->orderBy('issue_date', 'desc')
            ->get()
            ->map(function ($cert) {
                return [
                    'id'                => $cert->id,
                    'serial'            => $cert->serial,
                    'student_name'      => $cert->student?->user?->name ?? 'N/A',
                    'issued_name'       => $cert->issued_name,
                    // Use certificate_level relationship name if available, fall back to legacy string
                    'certificate_name'  => $cert->certificateLevel?->name ?? $cert->certificate_name ?? $cert->certificate_level,
                    'issue_date'        => $cert->issue_date,
                    'revoked_at'        => $cert->revoked_at,
                    'revoked_by_role'   => $cert->revoked_by_role,
                    'revocation_reason' => $cert->revocation_reason,
                ];
            });

        return response()->json([
            'success' => true,
            'certificates' => $certificates,
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $certificate = Certificate::with(['student.user', 'certificateLevel', 'department', 'majorRelation', 'revokedBy'])
            ->where('id', $id)
            ->where('institution_id', $institution->id)
            ->first();

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found or does not belong to your institution.'
            ], 404);
        }

        $certificateService = new CertificateService();

        return response()->json([
            'success' => true,
            'certificate' => [
                'id'                => $certificate->id,
                'serial'            => $certificate->serial,
                'student_name'      => $certificate->student?->user?->name ?? 'N/A',
                'issued_name'       => $certificate->issued_name,
                'roll_number'       => $certificate->enrollment?->roll_number, // displayed as "Student ID" in UI
                'certificate_name'  => $certificate->certificateLevel?->name ?? $certificate->certificate_name,
                'department'        => $certificate->department?->name ?? $certificate->department,
                'major'             => $certificate->majorRelation?->name ?? $certificate->major,
                'session'           => $certificate->session,
                'cgpa'              => $certificate->cgpa,
                'degree_class'      => $certificate->degree_class,
                'issue_date'        => $certificate->issue_date,
                'convocation_date'  => $certificate->convocation_date,
                'authority_name'    => $certificate->authority_name,
                'authority_title'   => $certificate->authority_title,
                'revoked_at'        => $certificate->revoked_at,
                'revoked_by_role'   => $certificate->revoked_by_role,
                'revocation_reason' => $certificate->revocation_reason,
                'revocation_history'=> $certificate->revocation_history ?? [],
                'revoked_by_name'   => $certificate->revokedBy?->name,
                'qr_code_url'       => $certificate->share_link ?? $certificateService->getVerificationUrl($certificate->serial),
            ]
        ]);
    }

    /**
     * Unrevoke a certificate that was revoked by the university itself.
     *
     * Hierarchy Rules enforced:
     * - Certificate must belong to this university (institution_id check).
     * - Certificate must currently be revoked.
     * - revoked_by_role must be 'university'; if 'admin', returns 403.
     * - A reason is required (min 10 characters).
     *
     * @param Request $request
     * @param string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function unrevoke(Request $request, $id)
    {
        $user        = $request->user();
        $institution = $user->institution;

        $certificate = Certificate::where('id', $id)
            ->where('institution_id', $institution->id)
            ->first();

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found or does not belong to your institution.',
            ], 404);
        }

        // Guard: certificate must be currently revoked
        if (!$certificate->isRevoked()) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate is not revoked.',
            ], 422);
        }

        // Hierarchy Rule 5: university cannot unrevoke a certificate revoked by admin
        if ($certificate->revoked_by_role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'This certificate was revoked by a platform administrator and cannot be restored by the university. Contact the platform admin.',
            ], 403);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:1000',
        ]);

        return DB::transaction(function () use ($certificate, $request, $user) {
            // Append unrevoke event to history BEFORE clearing fields
            $certificate->appendRevocationHistory(
                'unrevoked',
                $user->id,
                'university',
                $request->reason,
                $user->name
            );

            // Clear all revocation tracking fields
            $certificate->update([
                'revoked_at'        => null,
                'revoked_by'        => null,
                'revoked_by_role'   => null,
                'revocation_reason' => null,
            ]);

            ActivityLog::create([
                'user_id'     => $user->id,
                'action'      => 'certificate_unrevoked',
                'entity_type' => Certificate::class,
                'entity_id'   => $certificate->id,
                'description' => "Certificate {$certificate->serial} unrevoked by university.",
                'metadata'    => [
                    'reason' => $request->reason,
                ],
                'ip_address'  => request()->ip(),
            ]);

            return response()->json([
                'success'     => true,
                'message'     => 'Certificate successfully restored.',
                'certificate' => [
                    'id'                 => $certificate->id,
                    'serial'             => $certificate->serial,
                    'revoked_at'         => null,
                    'revoked_by_role'    => null,
                    'revocation_reason'  => null,
                    'revocation_history' => $certificate->revocation_history ?? [],
                ],
            ]);
        });
    }

    public function downloadPdf(Request $request, $id, CertificateService $certificateService)
    {
        $user = $request->user();
        $institution = $user->institution;

        $certificate = Certificate::where('id', $id)
            ->where('institution_id', $institution->id)
            ->first();

        if (!$certificate) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate not found or does not belong to your institution.'
            ], 404);
        }

        return $certificateService->getCertificatePdf($certificate->id);
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_id'           => ['required', Rule::exists('students', 'id')->whereNull('deleted_at')],
                'certificate_level_id' => ['required', 'integer', Rule::exists('certificate_levels', 'id')],
                'department_id'        => ['required', 'integer', Rule::exists('departments', 'id')],
                'major_id'             => ['nullable', 'integer', Rule::exists('majors', 'id')],
                'cgpa'                 => 'nullable|numeric|min:0|max:4',
                'degree_class'         => 'nullable|string|max:100',
                'session'              => 'required|string|max:255',
                'issue_date'           => 'required|string', // parsed as DD/MM/YYYY below
                'convocation_date'     => 'nullable|string',
                'authority_name'       => 'required|string|max:255',
                'authority_title'      => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            // Verify the certificate level belongs to this institution
            $level = CertificateLevel::findOrFail($request->certificate_level_id);

            if ($level->institution_id !== $institution->id || !$level->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid certificate level for this institution'
                ], 422);
            }

            if (empty($level->short_code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected certificate level has no short code set.'
                ], 422);
            }

            $certLevel = $level;

            // Verify the department belongs to this institution
            $department = Department::where('id', $request->department_id)
                ->where('institution_id', $institution->id)
                ->where('is_active', true)
                ->first();

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid department for this institution'
                ], 422);
            }

            // Verify the major belongs to the selected department (if provided)
            $major = null;
            if ($request->filled('major_id')) {
                $major = Major::where('id', $request->major_id)
                    ->where('department_id', $department->id)
                    ->where('is_active', true)
                    ->first();
                if (!$major) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid major for the selected department'
                    ], 422);
                }
            }

            // Validate enrollment
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

            // Parse DD/MM/YYYY dates
            $issueDate = $this->parseDMY($request->issue_date);
            $convocationDate = $request->convocation_date ? $this->parseDMY($request->convocation_date) : null;

            if (!$issueDate) {
                return response()->json(['success' => false, 'errors' => ['issue_date' => ['Invalid date format. Use DD/MM/YYYY.']]], 422);
            }

            // Duplicate check: same student, same cert level, same session
            $existingCertificate = Certificate::where('student_id', $request->student_id)
                ->where('institution_id', $institution->id)
                ->where('certificate_level_id', $request->certificate_level_id)
                ->where('session', $enrollment->batch)
                ->whereNull('revoked_at')
                ->first();

            if ($existingCertificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A certificate with the same level and session already exists for this student',
                    'existing_serial' => $existingCertificate->serial,
                ], 409);
            }

            $certificate = DB::transaction(function () use ($request, $institution, $enrollment, $user, $certLevel, $department, $major, $issueDate, $convocationDate) {
                // Generate serial using the level's short_code
                $serial = SerialGeneratorService::generate($certLevel->short_code);

                // Capture the student's legal name at issuance for audit
                $student = Student::with('user')->find($request->student_id);
                $issuedName = trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? ''));
                if (!$issuedName) {
                    $issuedName = $student?->user?->name ?? '';
                }

                $certificate = Certificate::create([
                    'serial'               => $serial,
                    'student_id'           => $request->student_id,
                    'institution_id'       => $institution->id,
                    'enrollment_id'        => $enrollment->id,
                    'issued_by'            => $user->id,
                    'certificate_level_id' => $certLevel->id,
                    'certificate_level'    => $certLevel->name,  // denormalized legacy column
                    'certificate_name'     => $certLevel->name,  // denormalized legacy column
                    'department_id'        => $department->id,
                    'department'           => $department->name, // denormalized legacy column
                    'major_id'             => $major?->id,
                    'major'                => $major?->name,     // denormalized legacy column
                    'session'              => $request->session,
                    'cgpa'                 => $request->cgpa,
                    'degree_class'         => $request->degree_class,
                    'issue_date'           => $issueDate,
                    'convocation_date'     => $convocationDate,
                    'authority_name'       => $request->authority_name,
                    'authority_title'      => $request->authority_title,
                    'is_publicly_shareable'=> $this->getStudentDefaultVisibility($request->student_id),
                    'issued_name'          => $issuedName,
                ]);

                ActivityLog::create([
                    'user_id'     => $user->id,
                    'action'      => 'CERTIFICATE_ISSUED',
                    'description' => "Issued certificate {$serial} to student ID {$request->student_id}",
                    'ip_address'  => request()->ip(),
                ]);

                // Auto-graduate the student if they were still active
                if ($enrollment->status === 'active') {
                    $enrollment->update([
                        'status' => 'graduated',
                        'actual_graduation_date' => $issueDate,
                    ]);

                    ActivityLog::create([
                        'user_id'     => $user->id,
                        'action'      => 'ENROLLMENT_STATUS_UPDATED',
                        'description' => "Auto-graduated student ID {$request->student_id} upon certificate issuance.",
                        'ip_address'  => request()->ip(),
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
                        "Your certificate ({$certLevel->name}) has been issued.",
                        '/student/certificates'
                    ));
                }
            } catch (\Throwable $throwable) {
                \Log::error('Failed to queue certificate issued notification', [
                    'certificate_id' => $certificate->id,
                    'student_id'     => $request->student_id,
                    'error'          => $throwable->getMessage(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Certificate issued successfully',
                'certificate' => [
                    'id'               => $certificate->id,
                    'serial'           => $certificate->serial,
                    'certificate_name' => $certLevel->name,
                    'issue_date'       => $certificate->issue_date,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to issue certificate',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Return pre-fill data for the certificate form when a student is selected.
     *
     * Pulls from the student's active/graduated enrollment under this
     * institution and from the institution's own default authority settings.
     */
    public function prefill(Request $request, int $studentId)
    {
        $user = $request->user();
        $institution = $user->institution;

        $enrollment = Enrollment::with(['major', 'major.department', 'certificateLevel'])
            ->where('student_id', $studentId)
            ->where('institution_id', $institution->id)
            ->whereIn('status', ['active', 'graduated'])
            ->first();

        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Student is not enrolled in your institution or enrollment is not active/graduated',
            ], 404);
        }

        $student = Student::with('user')->find($studentId);

        // Resolve department — prefer FK, fall back to program string
        $departmentId = $enrollment->department_id;
        $departmentName = null;
        if ($departmentId) {
            $dept = Department::find($departmentId);
            $departmentName = $dept?->name;
        } else {
            $departmentName = $enrollment->program;
        }

        // Resolve major
        $majorId = $enrollment->major_id;
        $majorName = $enrollment->major?->name;

        // Active certificate levels for this institution
        $certLevels = CertificateLevel::where('institution_id', $institution->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'short_code']);

        return response()->json([
            'success' => true,
            'prefill' => [
                'student_name'            => trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')) ?: ($student?->user?->name ?? ''),
                'student_email'           => $student?->user?->email,
                'roll_number'             => $enrollment->roll_number, // displayed as "Student ID" in UI
                'department_id'           => $departmentId,
                'department_name'         => $departmentName,
                'major_id'                => $majorId,
                'major_name'              => $majorName,
                'certificate_level_id'    => $enrollment->certificate_level_id,
                'certificate_level_name'  => $enrollment->certificateLevel?->name,
                'academic_session'        => $enrollment->batch,
                'cgpa'                    => null,  // Not stored on enrollment; leave blank for manual entry
                'degree_class'            => null,  // Not stored on enrollment; leave blank for manual entry
                'default_authority_name'  => $institution->default_authority_name ?? '',
                'default_authority_title' => $institution->default_authority_title ?? '',
                'certificate_levels'      => $certLevels,
            ],
        ]);
    }

    public function batchIssue(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
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
        $rows = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_map('trim', array_shift($rows));

        $results = [
            'processed'    => 0,
            'failed'       => 0,
            'errors'       => [],
            'certificates' => []
        ];

        DB::beginTransaction();

        try {
            // Collect activity log entries to bulk-insert after the loop
            $logEntries = [];

            foreach ($rows as $index => $row) {
                $rowNum = $index + 2;

                if (count($row) !== count($header)) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => 'N/A', 'error' => 'Column count mismatch'];
                    continue;
                }

                $data = array_combine($header, $row);

                // Row-level validation
                $rowValidator = Validator::make($data, [
                    'student_email'                => 'required|email',
                    'certificate_level_short_code' => 'required|string',
                    'department_name'              => 'required|string',
                    'major_name'                   => 'nullable|string',
                    'session'                      => 'required|string',
                    'cgpa'                         => 'nullable|numeric|min:0|max:4',
                    'degree_class'                 => 'nullable|string',
                    'issue_date'                   => 'required|string',
                    'convocation_date'             => 'nullable|string',
                    'authority_name'               => 'required|string',
                    'authority_title'              => 'required|string',
                ]);

                if ($rowValidator->fails()) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'row'           => $rowNum,
                        'student_email' => $data['student_email'] ?? 'N/A',
                        'error'         => $rowValidator->errors()->first()
                    ];
                    continue;
                }

                // Look up student
                $studentUser = User::where('email', trim($data['student_email']))
                    ->where('role', 'student')
                    ->where('is_approved', true)
                    ->first();

                if (!$studentUser || !$studentUser->student) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => 'Student not found or not approved'];
                    continue;
                }

                $student = $studentUser->student;

                // Verify enrollment under this institution
                $enrollment = Enrollment::where('student_id', $student->id)
                    ->where('institution_id', $institution->id)
                    ->whereIn('status', ['active', 'graduated'])
                    ->first();

                if (!$enrollment) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => 'Student not enrolled in your institution'];
                    continue;
                }

                // Resolve certificate level by short_code
                $certLevel = CertificateLevel::where('institution_id', $institution->id)
                    ->where('short_code', trim($data['certificate_level_short_code']))
                    ->where('is_active', true)
                    ->first();

                if (!$certLevel) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => "Certificate level '{$data['certificate_level_short_code']}' not found"];
                    continue;
                }

                if (empty($certLevel->short_code)) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => "Certificate level '{$data['certificate_level_short_code']}' has no short code set"];
                    continue;
                }

                // Resolve department by name
                $department = Department::where('institution_id', $institution->id)
                    ->where('name', trim($data['department_name']))
                    ->where('is_active', true)
                    ->first();

                if (!$department) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => "Department '{$data['department_name']}' not found"];
                    continue;
                }

                // Resolve major by name within department (optional)
                $major = null;
                if (!empty(trim($data['major_name'] ?? ''))) {
                    $major = Major::where('department_id', $department->id)
                        ->where('name', trim($data['major_name']))
                        ->where('is_active', true)
                        ->first();

                    if (!$major) {
                        $results['failed']++;
                        $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => "Major '{$data['major_name']}' not found in department '{$department->name}'"];
                        continue;
                    }
                }

                // Parse dates from DD/MM/YYYY
                $issueDate = $this->parseDMY($data['issue_date']);
                $convocationDate = !empty(trim($data['convocation_date'] ?? '')) ? $this->parseDMY($data['convocation_date']) : null;

                if (!$issueDate) {
                    $results['failed']++;
                    $results['errors'][] = ['row' => $rowNum, 'student_email' => $data['student_email'], 'error' => 'Invalid issue_date format. Use DD/MM/YYYY.'];
                    continue;
                }

                $serial = SerialGeneratorService::generate($certLevel->short_code);

                $issuedName = trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''));
                if (!$issuedName) {
                    $issuedName = $studentUser->name ?? '';
                }

                $certificate = Certificate::create([
                    'serial'               => $serial,
                    'student_id'           => $student->id,
                    'institution_id'       => $institution->id,
                    'enrollment_id'        => $enrollment->id,
                    'issued_by'            => $user->id,
                    'certificate_level_id' => $certLevel->id,
                    'certificate_level'    => $certLevel->name,
                    'certificate_name'     => $certLevel->name,
                    'department_id'        => $department->id,
                    'department'           => $department->name,
                    'major_id'             => $major?->id,
                    'major'                => $major?->name,
                    'session'              => $data['session'],
                    'cgpa'                 => $data['cgpa'] ?? null,
                    'degree_class'         => $data['degree_class'] ?? null,
                    'issue_date'           => $issueDate,
                    'convocation_date'     => $convocationDate,
                    'authority_name'       => $data['authority_name'],
                    'authority_title'      => $data['authority_title'],
                    'is_publicly_shareable'=> $this->getStudentDefaultVisibility($student->id),
                    'issued_name'          => $issuedName,
                ]);

                $results['processed']++;
                $results['certificates'][] = [
                    'serial'        => $serial,
                    'student_name'  => $studentUser->name,
                    'student_email' => $data['student_email'],
                ];

                try {
                    $studentUser->notify(new AppNotification(
                        'CERTIFICATE_ISSUED',
                        'Certificate Issued',
                        "Your certificate ({$certLevel->name}) has been issued by {$institution->name}.",
                        '/student/certificates'
                    ));
                } catch (\Throwable $e) {
                    \Log::error('Failed to send batch certificate notification', [
                        'student_email' => $data['student_email'],
                        'error'         => $e->getMessage(),
                    ]);
                }

                // Collect log entries instead of inserting one by one
                $now = now()->toDateTimeString();
                $logEntries[] = [
                    'user_id'     => $user->id,
                    'action'      => 'CERTIFICATE_BATCH_ISSUED',
                    'description' => "Issued certificate {$serial} via batch upload",
                    'ip_address'  => $request->ip(),
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];

                // Auto-graduate the student if they were still active
                if ($enrollment->status === 'active') {
                    $enrollment->update([
                        'status' => 'graduated',
                        'actual_graduation_date' => $issueDate,
                    ]);

                    $logEntries[] = [
                        'user_id'     => $user->id,
                        'action'      => 'ENROLLMENT_STATUS_UPDATED',
                        'description' => "Auto-graduated student ID {$student->id} upon batch certificate issuance.",
                        'ip_address'  => $request->ip(),
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ];
                }
            }

            // Bulk insert all activity logs in a single query instead of N inserts
            if (!empty($logEntries)) {
                ActivityLog::insert($logEntries);
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
                'error'   => $e->getMessage()
            ], 500);
        }
    }


    public function downloadSampleCSV()
    {
        $csvContent = "student_email,certificate_level_short_code,department_name,major_name,session,cgpa,degree_class,issue_date,convocation_date,authority_name,authority_title\n";
        $csvContent .= "student@example.com,BSc,Computer Science,Software Engineering,Spring 2024,3.75,First Class,15/05/2024,20/06/2024,Prof. Dr. John Smith,Vice Chancellor\n";
        $csvContent .= "student2@example.com,MSc,Mathematics,,Fall 2023,3.90,First Class,15/05/2024,,Prof. Dr. John Smith,Vice Chancellor\n";

        return response($csvContent, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="certificate_batch_template.csv"');
    }

    /**
     * Parse a DD/MM/YYYY date string to YYYY-MM-DD.
     * Returns null if parsing fails.
     */
    private function parseDMY(?string $date): ?string
    {
        if (!$date) return null;
        $date = trim($date);
        try {
            return Carbon::createFromFormat('d/m/Y', $date)->format('Y-m-d');
        } catch (\Exception $e) {
            // Try Y-m-d fallback (already correct format)
            try {
                return Carbon::createFromFormat('Y-m-d', $date)->format('Y-m-d');
            } catch (\Exception $e2) {
                return null;
            }
        }
    }

    /**
     * Resolve the student's default certificate visibility preference.
     *
     * Reads certificate_preferences.default_visibility from the student's
     * UserSetting. Falls back to private when no preference is stored,
     * aligning with GDPR data-ownership defaults.
     */
    private function getStudentDefaultVisibility(int $studentId): bool
    {
        $student = Student::find($studentId);

        if (!$student) {
            return false; // private by default
        }

        $setting = UserSetting::where('user_id', $student->user_id)->first();

        if (!$setting || !is_array($setting->preferences)) {
            return false; // private by default
        }

        $visibility = $setting->preferences['certificate_preferences']['default_visibility']
            ?? $setting->preferences['privacy']['certificate_default']
            ?? 'private';

        return $visibility === 'public';
    }
}
