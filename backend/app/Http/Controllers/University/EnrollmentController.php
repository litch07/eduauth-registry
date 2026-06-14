<?php

namespace App\Http\Controllers\University;

use App\Http\Controllers\Controller;
use App\Mail\EnrollmentConfirmationMail;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $status = $request->query('status', 'all');
            $search = $request->query('search', '');

            $query = Enrollment::with(['student.user', 'certificateLevel', 'department', 'major'])
                ->where('institution_id', $institution->id);

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            if ($request->filled('certificate_level_id')) {
                $query->where('certificate_level_id', $request->query('certificate_level_id'));
            }

            if ($request->filled('department_id')) {
                $query->where('department_id', $request->query('department_id'));
            }

            if ($search) {
                $query->where(function ($mainQuery) use ($search) {
                    $mainQuery->whereHas('student', function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhere('enrollment_number', 'like', "%{$search}%")
                    ->orWhere('roll_number', 'like', "%{$search}%");
                });
            }

            // Single aggregation replaces 3 separate COUNT queries
            $rawStats = DB::table('enrollments')
                ->selectRaw('
                    COUNT(*) as total,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as graduated
                ', ['active', 'graduated'])
                ->where('institution_id', $institution->id)
                ->whereNull('deleted_at')
                ->first();

            $stats = [
                'total'     => (int) ($rawStats->total ?? 0),
                'active'    => (int) ($rawStats->active ?? 0),
                'graduated' => (int) ($rawStats->graduated ?? 0),
            ];

            $paginator = $query->orderBy('created_at', 'desc')->paginate(15);

            $enrollments = $paginator->getCollection()->map(function ($enrollment) {
                return [
                    'id' => $enrollment->id,
                    'enrollment_number' => $enrollment->enrollment_number,
                    'student_name' => $enrollment->student
                        ? trim($enrollment->student->first_name . ' ' . $enrollment->student->last_name)
                        : 'N/A',
                    'student_id' => $enrollment->roll_number, // displayed as "Student ID" in UI
                    'roll_number' => $enrollment->roll_number, // displayed as "Student ID" in UI
                    'student_email' => $enrollment->student?->user?->email,
                    'db_student_id' => $enrollment->student_id,
                    'program' => $enrollment->program,
                    'certificate_level_id' => $enrollment->certificate_level_id,
                    'certificate_level_name' => $enrollment->certificateLevel?->name,
                    'department_id' => $enrollment->department_id,
                    'department_name' => $enrollment->department?->name,
                    'major_id' => $enrollment->major_id,
                    'major_name' => $enrollment->major?->name,
                    'batch' => $enrollment->batch,
                    'status' => $enrollment->status,
                    'enrollment_date' => $enrollment->enrollment_date,
                    'expected_graduation' => $enrollment->expected_graduation_date,
                    'actual_graduation' => $enrollment->actual_graduation_date,
                    'created_at' => $enrollment->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'enrollments' => $enrollments,
                'stats' => $stats,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch enrollments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function programs(Request $request)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            // Get all enrollments for this institution with student user data
            $enrollments = Enrollment::with(['student.user'])
                ->where('institution_id', $institution->id)
                ->whereNotNull('program')
                ->where('program', '!=', '')
                ->orderBy('enrollment_date', 'desc')
                ->get();

            $programsData = [];

            foreach ($enrollments as $enrollment) {
                $programName = $enrollment->program;
                
                if (!isset($programsData[$programName])) {
                    $programsData[$programName] = [
                        'name' => $programName,
                        'active_count' => 0,
                        'graduated_count' => 0,
                        'withdrawn_count' => 0,
                        'recent_enrollment_date' => $enrollment->enrollment_date,
                        'students' => []
                    ];
                }

                if ($enrollment->status === 'active') {
                    $programsData[$programName]['active_count']++;
                } elseif ($enrollment->status === 'graduated') {
                    $programsData[$programName]['graduated_count']++;
                } elseif ($enrollment->status === 'withdrawn') {
                    $programsData[$programName]['withdrawn_count']++;
                }

                // Update recent enrollment date if this one is newer
                if (strtotime($enrollment->enrollment_date) > strtotime($programsData[$programName]['recent_enrollment_date'])) {
                    $programsData[$programName]['recent_enrollment_date'] = $enrollment->enrollment_date;
                }

                $programsData[$programName]['students'][] = [
                    'id' => $enrollment->id,
                    'student_name' => $enrollment->student ? trim($enrollment->student->first_name . ' ' . $enrollment->student->last_name) : 'N/A',
                    'roll_number' => $enrollment->roll_number, // displayed as "Student ID" in UI
                    'batch' => $enrollment->batch,
                    'enrollment_date' => $enrollment->enrollment_date,
                    'status' => $enrollment->status,
                ];
            }

            // Convert to indexed array and sort by program name
            $programsList = array_values($programsData);
            usort($programsList, function($a, $b) {
                return strcmp($a['name'], $b['name']);
            });

            return response()->json([
                'success' => true,
                'programs' => $programsList
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch programs data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_email' => 'required|email|exists:users,email',
                'program' => 'required_without:department_id|string|max:255',
                'department_id' => 'required|integer|exists:departments,id',
                'major_id' => 'nullable|integer|exists:majors,id',
                'certificate_level_id' => 'required|integer|exists:certificate_levels,id',
                'program_level' => 'nullable|string|max:255',
                'batch' => 'required|string|max:100',
                'roll_number' => ['required', 'string', 'max:100'],
                'enrollment_date' => 'required|date',
                'expected_graduation_date' => 'nullable|date|after:enrollment_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            $studentUser = User::where('email', $request->student_email)
                ->where('role', 'student')
                ->where('is_approved', true)
                ->first();

            if (!$studentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found or not approved'
                ], 404);
            }

            // Verify the certificate level belongs to this institution
            $certLevel = \App\Models\CertificateLevel::where('id', $request->certificate_level_id)
                ->where('institution_id', $institution->id)
                ->where('is_active', true)
                ->first();

            if (!$certLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid certificate level for this institution'
                ], 422);
            }

            // Verify the department belongs to this institution
            $department = \App\Models\Department::where('id', $request->department_id)
                ->where('institution_id', $institution->id)
                ->where('is_active', true)
                ->first();

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid department for this institution'
                ], 422);
            }

            // Verify the major belongs to the selected department (only if major_id is provided)
            if ($request->filled('major_id')) {
                $major = \App\Models\Major::where('id', $request->major_id)
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

            $student = $studentUser->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            // STEP 1 — Global active enrollment check (across ALL universities).
            // A student may not be enrolled at two universities simultaneously.
            $globalActiveEnrollment = Enrollment::where('student_id', $student->id)
                ->whereIn('status', ['active', 'withdrawal_requested'])
                ->with('institution')
                ->first();

            if ($globalActiveEnrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'This student is currently enrolled at another university. They must graduate or complete their withdrawal before enrolling here.',
                    'current_enrollment' => [
                        'institution' => $globalActiveEnrollment->institution->name,
                        'program'     => $globalActiveEnrollment->program,
                        'batch'       => $globalActiveEnrollment->batch,
                        'status'      => $globalActiveEnrollment->status,
                    ]
                ], 409);
            }

            // STEP 2 — Same-university suspension check.
            // A suspended student cannot re-enroll at the same university until the suspension is resolved.
            $suspendedHere = Enrollment::where('student_id', $student->id)
                ->where('institution_id', $institution->id)
                ->where('status', 'suspended')
                ->first();

            if ($suspendedHere) {
                return response()->json([
                    'success' => false,
                    'message' => 'This student has a suspended enrollment at your institution. Please resolve the suspension before creating a new enrollment.',
                ], 409);
            }

            // STEP 3 — Re-enrollment is allowed.
            // Students who previously graduated or withdrew from this university
            // are explicitly permitted to enroll again (higher degree, re-admission, etc.).

            // Check if the provided roll_number is already assigned to another student in this university
            if ($request->filled('roll_number')) {
                $duplicateStudent = Enrollment::where('institution_id', $institution->id)
                    ->where('roll_number', $request->roll_number)
                    ->where('student_id', '!=', $student->id)
                    ->first();

                if ($duplicateStudent) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This Student ID is already assigned to another student in your university'
                    ], 422);
                }
            }

            $enrollment = DB::transaction(function () use ($student, $institution, $request, $user, $certLevel, $department) {
                // Generate enrollment number inside transaction to utilize lock
                $enrollmentNumber = $this->generateEnrollmentNumber($institution);

                // Build program display name as "CertLevel — Department"
                $programName = $certLevel->name . ' — ' . $department->name;

                // Create enrollment
                return Enrollment::create([
                    'student_id' => $student->id,
                    'institution_id' => $institution->id,
                    'enrollment_number' => $enrollmentNumber,
                    'roll_number' => $request->roll_number ?: null,
                    'department_id' => $request->department_id,
                    'major_id' => $request->filled('major_id') ? $request->major_id : null,
                    'certificate_level_id' => $request->certificate_level_id,
                    'program' => $programName,
                    'batch' => $request->batch,
                    'status' => 'active',
                    'enrollment_date' => $request->enrollment_date,
                    'expected_graduation_date' => $request->expected_graduation_date,
                    'enrolled_by' => $user->id,
                ]);
            });

            // Auto-approve pending enrollment applications for this student at this institution
            \App\Models\EnrollmentApplication::where('student_id', $student->id)
                ->where('institution_id', $institution->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'approved',
                    'reviewed_by' => $user->id,
                    'reviewed_at' => now(),
                ]);

            // Send enrollment confirmation email
            try {
                Mail::to($studentUser->email)->queue(new EnrollmentConfirmationMail($enrollment));
            } catch (\Throwable $throwable) {
                \Log::error('Failed to queue enrollment confirmation', [
                    'enrollment_id' => $enrollment->id,
                    'student_email' => $studentUser->email,
                    'error' => $throwable->getMessage(),
                ]);
            }

            // Log activity
            // HIGH-09: Use $enrollment->program (the computed display name) instead of
            // $request->program which may be null when student is enrolled by department_id.
            \App\Models\ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STUDENT_ENROLLED',
                'description' => "Enrolled student {$student->first_name} {$student->last_name} in {$enrollment->program}",
                'ip_address' => $request->ip(),
            ]);

            if ($student->user) {
                $student->user->notify(new AppNotification(
                    'ENROLLMENT',
                    'You have been enrolled',
                    // HIGH-10: Use $enrollment->program (the computed display name) instead of
                    // $request->program which may be null when student is enrolled by department_id.
                    "You have been enrolled in {$enrollment->program} at {$institution->name}.",
                    '/student/dashboard'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Student enrolled successfully',
                'enrollment' => [
                    'id' => $enrollment->id,
                    'enrollment_number' => $enrollment->enrollment_number,
                    'student_name' => $student->first_name . ' ' . $student->last_name,
                    'program' => $enrollment->program,
                    'batch' => $enrollment->batch,
                    'status' => $enrollment->status,
                ]
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            // 23000 is a unique constraint violation — happens if two requests race past the duplicate check
            if ($e->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is already enrolled in your institution',
                ], 409);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll student',
                'error' => $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            $enrollment = Enrollment::where('id', $id)
                ->where('institution_id', $institution->id)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enrollment not found'
                ], 404);
            }

            if (in_array($enrollment->status, ['graduated', 'withdrawn'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot edit graduated or withdrawn enrollments'
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'department_id' => 'required|integer|exists:departments,id',
                'major_id' => 'nullable|integer|exists:majors,id',
                'certificate_level_id' => 'required|integer|exists:certificate_levels,id',
                'batch' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify the certificate level belongs to this institution
            $certLevel = \App\Models\CertificateLevel::where('id', $request->certificate_level_id)
                ->where('institution_id', $institution->id)
                ->where('is_active', true)
                ->first();

            if (!$certLevel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid certificate level for this institution'
                ], 422);
            }

            // Verify the department belongs to this institution
            $department = \App\Models\Department::where('id', $request->department_id)
                ->where('institution_id', $institution->id)
                ->where('is_active', true)
                ->first();

            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid department for this institution'
                ], 422);
            }

            // Verify the major belongs to the selected department (only if major_id is provided)
            if ($request->filled('major_id')) {
                $major = \App\Models\Major::where('id', $request->major_id)
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

            $oldValues = $enrollment->only(['program', 'batch', 'department_id', 'major_id', 'certificate_level_id']);

            $enrollment = DB::transaction(function () use ($enrollment, $request, $department, $certLevel) {
                // Recompute stored program name from cert level + department
                $programName = $certLevel->name . ' — ' . $department->name;

                $updateData = [
                    'certificate_level_id' => $request->certificate_level_id,
                    'department_id' => $request->department_id,
                    'major_id' => $request->filled('major_id') ? $request->major_id : null,
                    'program' => $programName,
                ];

                if ($request->has('batch') && $request->batch !== null) {
                    $updateData['batch'] = $request->batch;
                }

                $enrollment->update($updateData);
                return $enrollment->fresh(['certificateLevel', 'department', 'major']);
            });

            $newValues = $enrollment->only(['program', 'batch', 'department_id', 'major_id', 'certificate_level_id']);

            // Only log if something actually changed
            if ($oldValues !== $newValues) {
                \App\Models\ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => 'ENROLLMENT_UPDATED',
                    'description' => "Updated enrollment details for student {$enrollment->student?->first_name} {$enrollment->student?->last_name}",
                    'metadata' => [
                        'old' => $oldValues,
                        'new' => $newValues,
                    ],
                    'ip_address' => $request->ip(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Enrollment updated successfully',
                'enrollment' => [
                    'id' => $enrollment->id,
                    'program' => $enrollment->program,
                    'certificate_level_id' => $enrollment->certificate_level_id,
                    'certificate_level_name' => $enrollment->certificateLevel?->name,
                    'department_id' => $enrollment->department_id,
                    'department_name' => $enrollment->department?->name,
                    'major_id' => $enrollment->major_id,
                    'major_name' => $enrollment->major?->name,
                    'batch' => $enrollment->batch,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update enrollment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update enrollment status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:active,graduated,suspended,withdrawn,withdrawal_requested',
                'actual_graduation_date' => 'nullable|date',
                'suspension_reason' => 'required_if:status,suspended|nullable|string|min:10|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            $enrollment = Enrollment::where('id', $id)
                ->where('institution_id', $institution->id)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enrollment not found'
                ], 404);
            }

            // Define valid status transitions per current state.
            // Terminal states (graduated, withdrawn) are intentionally omitted
            // as keys — any transition away from them will resolve to an empty
            // allowed list and be blocked below.
            $allowedTransitions = [
                'active'                => ['active', 'graduated', 'suspended', 'withdrawn'],
                'suspended'             => ['suspended', 'active', 'withdrawn'],
                'withdrawal_requested'  => ['withdrawn', 'active'],
            ];

            $allowed = $allowedTransitions[$enrollment->status] ?? [];
            if (!in_array($request->status, $allowed)) {
                $terminalStates = ['graduated', 'withdrawn'];
                $message = in_array($enrollment->status, $terminalStates)
                    ? "Cannot change enrollment status: '{$enrollment->status}' is a terminal state and cannot be reversed."
                    : "Invalid status transition from '{$enrollment->status}' to '{$request->status}'.";

                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 422);
            }

            $oldStatus = $enrollment->status;

            $enrollment->update([
                'status' => $request->status,
                'suspension_reason' => $request->status === 'suspended' ? $request->suspension_reason : ($request->status === 'active' ? null : $enrollment->suspension_reason),
                'actual_graduation_date' => $request->status === 'graduated'
                    ? ($request->actual_graduation_date ?? now()->toDateString())
                    : $enrollment->actual_graduation_date, // preserve existing date on non-graduation transitions
            ]);

            // Auto-resolve pending withdrawal requests if status changes
            if ($oldStatus === 'withdrawal_requested' && in_array($request->status, ['withdrawn', 'active'])) {
                $pendingRequest = \App\Models\WithdrawalRequest::where('enrollment_id', $enrollment->id)
                    ->where('status', 'pending')
                    ->first();
                    
                if ($pendingRequest) {
                    $pendingRequest->update([
                        'status'         => $request->status === 'withdrawn' ? 'approved' : 'rejected',
                        'reviewed_at'    => now(),
                        'reviewed_by'    => $user->id,
                        'rejection_note' => $request->status === 'withdrawn'
                            ? 'Approved from enrollment list'
                            : 'Rejected from enrollment list',
                    ]);
                }
            }

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'ENROLLMENT_STATUS_UPDATED',
                'description' => "Updated enrollment status to {$request->status} for student {$enrollment->student?->first_name} {$enrollment->student?->last_name}",
                'ip_address' => $request->ip(),
            ]);

            $responseData = [
                'success' => true,
                'message' => 'Enrollment status updated successfully',
                'enrollment' => [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status,
                    'suspension_reason' => $enrollment->suspension_reason,
                    'actual_graduation_date' => $enrollment->actual_graduation_date,
                ]
            ];

            if ($request->status === 'graduated') {
                $responseData['redirect_to_certificate_issuance'] = true;
                $responseData['student_data'] = [
                    'id'            => $enrollment->student_id,
                    'name'          => trim($enrollment->student->first_name . ' ' . $enrollment->student->last_name),
                    'enrollment_id' => $enrollment->id,
                    'program'       => $enrollment->program,
                    'batch'         => $enrollment->batch,
                ];

                // Notify student of graduation
                if ($enrollment->student->user) {
                    $enrollment->student->user->notify(new AppNotification(
                        'APPROVAL',
                        'Congratulations! You Have Graduated',
                        "Your enrollment in {$enrollment->program} at {$institution->name} has been marked as graduated.",
                        '/student/certificates'
                    ));
                }
            }

            return response()->json($responseData, 200);


        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update enrollment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate unique enrollment number
     */
    private function generateEnrollmentNumber($institution)
    {
        $institutionPrefix = strtoupper(substr($institution->name, 0, 3));
        $year = date('y');
        $seqPrefix = $institutionPrefix . '_' . $institution->id;
        $sequenceKey = 'enrollment_serial_' . $institution->id;

        // same lockForUpdate pattern as certificate serials — keeps numbers unique under concurrency
        $sequence = \App\Models\CertificateSequence::where('prefix', $seqPrefix)
            ->where('year_suffix', $year)
            ->lockForUpdate()
            ->first();

        if (!$sequence) {
            $sequence = \App\Models\CertificateSequence::create([
                'sequence_key' => $sequenceKey,
                'prefix' => $seqPrefix,
                'year_suffix' => $year,
                'current_sequence' => 0,
            ]);
            $sequence = \App\Models\CertificateSequence::whereKey($sequence->id)->lockForUpdate()->firstOrFail();
        }

        if ($sequence->year_suffix !== $year) {
            $sequence->forceFill([
                'year_suffix' => $year,
                'current_sequence' => 0,
            ])->save();
        }

        $sequence->increment('current_sequence');
        $sequence->refresh();

        $serialNumber = str_pad((string) $sequence->current_sequence, 6, '0', STR_PAD_LEFT);
        
        return $institutionPrefix . '-' . $year . '-' . $serialNumber;
    }

    /**
     * Search students to enroll (not yet enrolled)
     */
    public function searchStudents(Request $request)
    {
        try {
            $search = $request->query('search', $request->query('q', ''));
            $user = $request->user();
            $institution = $user->institution;

            if (strlen($search) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Search query must be at least 2 characters'
                ], 400);
            }

            $nidHash = hash('sha256', trim($search));

            $query = Student::with(['user', 'enrollments.institution'])
                ->whereHas('user', function ($q) {
                    $q->where('role', 'student')
                      ->where('is_approved', true);
                })
                ->where(function ($q) use ($search, $nidHash) {
                    $q->where('nid_hash', $nidHash)
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('email', 'like', "%{$search}%");
                      })
                      ->orWhereHas('enrollments', function ($eq) use ($search) {
                          $eq->where('roll_number', 'like', "%{$search}%");
                      });
                });

            if ($request->boolean('enrolled')) {
                $query->whereHas('enrollments', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id)
                      ->whereIn('status', ['active', 'graduated', 'suspended', 'withdrawal_requested']);
                });
            }

            $students = $query->limit(20)->get()->map(function ($student) use ($institution) {
                $isEnrolledHere = false;
                $activeEnrollmentInstitution = null;

                foreach ($student->enrollments as $enrollment) {
                    // Check if enrolled here (any status except withdrawn implies they have a record)
                    if ($enrollment->institution_id === $institution->id && in_array($enrollment->status, ['active', 'graduated', 'suspended', 'withdrawal_requested'])) {
                        $isEnrolledHere = true;
                    }

                    // Check if actively enrolled anywhere
                    if (in_array($enrollment->status, ['active', 'withdrawal_requested'])) {
                        $activeEnrollmentInstitution = $enrollment->institution->name;
                    }
                }

                return [
                    'id'               => $student->id,
                    'name'             => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
                    'email'            => $student->user->email,
                    'is_enrolled_here' => $isEnrolledHere,
                    'is_enrolled_anywhere' => $activeEnrollmentInstitution !== null,
                    'active_institution'   => $activeEnrollmentInstitution,
                ];
            });

            return response()->json([
                'success' => true,
                'students' => $students,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show full student profile
     */
    public function showStudent(Request $request, $id)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            $student = Student::with(['user', 'enrollments.institution'])->findOrFail($id);

            // Ownership check: student must be enrolled at this institution
            $isEnrolled = $student->enrollments
                ->where('institution_id', $institution->id)
                ->isNotEmpty();

            if (!$isEnrolled) {
                return response()->json([
                    'success' => false,
                    'message' => 'This student is not enrolled at your institution.',
                ], 403);
            }

            // Note: NID is not returned.
            return response()->json([
                'success' => true,
                'student' => [
                    'id'            => $student->id,
                    'name'          => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
                    'email'         => $student->user->email,
                    'phone'         => $student->phone,
                    'gender'        => ucfirst($student->gender),
                    'date_of_birth' => $student->date_of_birth ? $student->date_of_birth->format('d/m/Y') : null,
                    'address'       => $student->address,
                    'enrollments'   => $student->enrollments->map(function ($enr) {
                        return [
                            'institution'       => $enr->institution->name,
                            'program'           => $enr->program,
                            'batch'             => $enr->batch,
                            'status'            => $enr->status,
                            'enrollment_date'   => $enr->enrollment_date ? $enr->enrollment_date->format('d/m/Y') : null,
                        ];
                    }),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch student details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extend expected graduation date for enrollment
     */
    public function extendGraduation(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'new_expected_graduation_date' => 'required|date',
                'reason' => 'required|string|min:10|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            // Find enrollment
            $enrollment = Enrollment::where('id', $id)
                ->where('institution_id', $institution->id)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enrollment not found'
                ], 404);
            }

            // Validate new date is after current expected date
            $currentDate = \Carbon\Carbon::parse($enrollment->expected_graduation_date);
            $newDate = \Carbon\Carbon::parse($request->new_expected_graduation_date);

            if ($newDate->lte($currentDate)) {
                return response()->json([
                    'success' => false,
                    'message' => 'New graduation date must be later than current expected date'
                ], 422);
            }

            // Check enrollment date
            $enrollmentDate = \Carbon\Carbon::parse($enrollment->enrollment_date);
            if ($newDate->lte($enrollmentDate)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Graduation date must be after enrollment date'
                ], 422);
            }

            // Calculate extension period
            $extensionMonths = $currentDate->diffInMonths($newDate);
            $extensionYears = floor($extensionMonths / 12);
            $remainingMonths = $extensionMonths % 12;

            $extensionText = '';
            if ($extensionYears > 0) {
                $extensionText .= "{$extensionYears} year" . ($extensionYears > 1 ? 's' : '');
            }
            if ($remainingMonths > 0) {
                if ($extensionYears > 0) $extensionText .= ' and ';
                $extensionText .= "{$remainingMonths} month" . ($remainingMonths > 1 ? 's' : '');
            }

            // Store old date for logging
            $oldDate = $enrollment->expected_graduation_date;

            // Update enrollment
            $enrollment->expected_graduation_date = $request->new_expected_graduation_date;
            $enrollment->save();

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'GRADUATION_DATE_EXTENDED',
                'description' => "Extended graduation date for {$enrollment->student->first_name} {$enrollment->student->last_name} by {$extensionText}. Reason: {$request->reason}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Graduation date extended by {$extensionText}",
                'enrollment' => [
                    'id' => $enrollment->id,
                    'old_expected_graduation' => $oldDate,
                    'new_expected_graduation' => $enrollment->expected_graduation_date,
                    'extension_period' => $extensionText,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to extend graduation date',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List all pending/counter-offered extension requests for this university's enrollments.
     */
    public function extensionRequests(Request $request)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $requests = \App\Models\ExtensionRequest::with(['enrollment.institution', 'student.user', 'reviewer'])
                ->whereHas('enrollment', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                })
                ->orderByRaw("FIELD(status, 'pending', 'counter_offered', 'approved', 'rejected')")
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            $mappedRequests = $requests->getCollection()->map(function ($req) {
                return [
                    'id' => $req->id,
                    'enrollment_id' => $req->enrollment_id,
                    'student_name' => $req->student
                        ? trim($req->student->first_name . ' ' . $req->student->last_name)
                        : 'N/A',
                    'student_email' => $req->student?->user?->email,
                    'program' => $req->enrollment->program,
                    'batch' => $req->enrollment->batch,
                    'current_expected_graduation' => $req->enrollment->expected_graduation_date,
                    'requested_graduation_date' => $req->requested_graduation_date,
                    'reason' => $req->reason,
                    'supporting_document_path' => $req->supporting_document_path,
                    'status' => $req->status,
                    'university_response' => $req->university_response,
                    'counter_offered_date' => $req->counter_offered_date,
                    'reviewed_by' => $req->reviewer?->email,
                    'reviewed_at' => $req->reviewed_at,
                    'created_at' => $req->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'requests' => $mappedRequests,
                'pagination' => [
                    'current_page' => $requests->currentPage(),
                    'last_page' => $requests->lastPage(),
                    'total' => $requests->total(),
                    'per_page' => $requests->perPage(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch extension requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an extension request — updates enrollment expected_graduation_date atomically.
     */
    public function approveExtension(Request $request, $id)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $extensionRequest = \App\Models\ExtensionRequest::where('id', $id)
                ->whereHas('enrollment', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                })
                ->with(['enrollment', 'student.user'])
                ->first();

            if (!$extensionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Extension request not found'
                ], 404);
            }

            if ($extensionRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending requests can be approved'
                ], 422);
            }

            $enrollment = $extensionRequest->enrollment;
            $oldDate = $enrollment->expected_graduation_date;

            // Update enrollment and request atomically
            DB::transaction(function () use ($extensionRequest, $enrollment, $user) {
                $enrollment->update([
                    'expected_graduation_date' => $extensionRequest->requested_graduation_date,
                ]);

                $extensionRequest->update([
                    'status' => 'approved',
                    'reviewed_by' => $user->id,
                    'reviewed_at' => now(),
                ]);
            });

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'EXTENSION_APPROVED',
                'description' => "Approved graduation date extension for {$extensionRequest->student->first_name} {$extensionRequest->student->last_name}. New date: {$extensionRequest->requested_graduation_date->toDateString()}",
                'metadata' => [
                    'old_date' => $oldDate?->toDateString(),
                    'new_date' => $extensionRequest->requested_graduation_date->toDateString(),
                ],
                'ip_address' => $request->ip(),
            ]);

            // Notify student
            if ($extensionRequest->student?->user) {
                $extensionRequest->student->user->notify(new AppNotification(
                    'EXTENSION',
                    'Extension Request Approved',
                    "Your graduation date extension request for {$enrollment->program} has been approved. New expected graduation date: {$extensionRequest->requested_graduation_date->toDateString()}.",
                    '/student/my-university'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Extension request approved successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve extension request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an extension request with a required response reason.
     */
    public function rejectExtension(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'university_response' => 'required|string|min:10|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $extensionRequest = \App\Models\ExtensionRequest::where('id', $id)
                ->whereHas('enrollment', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                })
                ->with(['enrollment', 'student.user'])
                ->first();

            if (!$extensionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Extension request not found'
                ], 404);
            }

            if ($extensionRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending requests can be rejected'
                ], 422);
            }

            $extensionRequest->update([
                'status' => 'rejected',
                'university_response' => $request->university_response,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'EXTENSION_REJECTED',
                'description' => "Rejected graduation date extension for {$extensionRequest->student->first_name} {$extensionRequest->student->last_name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify student
            if ($extensionRequest->student?->user) {
                $extensionRequest->student->user->notify(new AppNotification(
                    'EXTENSION',
                    'Extension Request Rejected',
                    "Your graduation date extension request for {$extensionRequest->enrollment->program} has been rejected.",
                    '/student/my-university'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Extension request rejected',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject extension request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Counter-offer an extension request with an alternative date.
     */
    public function counterOfferExtension(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'counter_offered_date' => 'required|date|after:today',
                'university_response' => 'required|string|min:10|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $extensionRequest = \App\Models\ExtensionRequest::where('id', $id)
                ->whereHas('enrollment', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                })
                ->with(['enrollment', 'student.user'])
                ->first();

            if (!$extensionRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Extension request not found'
                ], 404);
            }

            if ($extensionRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending requests can receive a counter offer'
                ], 422);
            }

            // Counter-offered date must be after current expected graduation date
            $enrollment = $extensionRequest->enrollment;
            $currentExpected = \Carbon\Carbon::parse($enrollment->expected_graduation_date);
            $counterDate = \Carbon\Carbon::parse($request->counter_offered_date);

            if ($counterDate->lte($currentExpected)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Counter-offered date must be after the current expected graduation date'
                ], 422);
            }

            $extensionRequest->update([
                'status' => 'counter_offered',
                'counter_offered_date' => $request->counter_offered_date,
                'university_response' => $request->university_response,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'EXTENSION_COUNTER_OFFERED',
                'description' => "Counter-offered graduation date extension for {$extensionRequest->student->first_name} {$extensionRequest->student->last_name}. Offered date: {$request->counter_offered_date}",
                'ip_address' => $request->ip(),
            ]);

            // Notify student
            if ($extensionRequest->student?->user) {
                $extensionRequest->student->user->notify(new AppNotification(
                    'EXTENSION',
                    'Extension Counter Offer Received',
                    "Your university has proposed an alternative graduation date for {$enrollment->program}. Please review the offer.",
                    '/student/my-university'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Counter offer sent to student',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send counter offer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ─── ENROLLMENT APPLICATION REVIEW METHODS ─────────────────────
    // ═══════════════════════════════════════════════════════════════

    /**
     * List all enrollment applications for this university.
     */
    public function applications(Request $request)
    {
        try {
            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $applications = \App\Models\EnrollmentApplication::with(['student.user', 'student.certificates.institution', 'reviewer', 'certificateLevel', 'department'])
                ->where('institution_id', $institution->id)
                ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected')")
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            $mappedApplications = $applications->getCollection()->map(function ($app) {
                return [
                    'id' => $app->id,
                    'student_id' => $app->student_id,
                    'student_name' => $app->student
                        ? trim($app->student->first_name . ' ' . $app->student->last_name)
                        : 'N/A',
                    'student_email' => $app->student?->user?->email,
                    'certificate_level_id' => $app->certificate_level_id,
                    'department_id' => $app->department_id,
                    'certificate_level_name' => $app->certificateLevel ? $app->certificateLevel->name : null,
                    'department_name' => $app->department ? $app->department->name : null,
                    'batch' => $app->batch,
                    'reason' => $app->reason,
                    'document_path' => $app->document_path,
                    'status' => $app->status,
                    'university_response' => $app->university_response,
                    'reviewed_by' => $app->reviewer?->email,
                    'reviewed_at' => $app->reviewed_at,
                    'created_at' => $app->created_at,
                    'certificates' => $app->student ? $app->student->certificates->map(function ($cert) {
                        return [
                            'id' => $cert->id,
                            'certificate_number' => $cert->serial,
                            'title' => $cert->certificate_name,
                            'issue_date' => $cert->issue_date,
                            'program_name' => trim($cert->certificate_level . ' ' . $cert->major),
                            'grade' => $cert->cgpa,
                            'status' => $cert->revoked_at ? 'revoked' : 'valid',
                            'institution' => $cert->institution ? $cert->institution->name : 'Unknown Institution',
                        ];
                    })->values()->toArray() : [],
                ];
            });

            return response()->json([
                'success' => true,
                'applications' => $mappedApplications,
                'pagination' => [
                    'current_page' => $applications->currentPage(),
                    'last_page' => $applications->lastPage(),
                    'total' => $applications->total(),
                    'per_page' => $applications->perPage(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch enrollment applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an enrollment application — creates a real Enrollment record
     * reusing the same logic and business rules as store().
     */
    public function approveApplication(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'roll_number' => ['required', 'string', 'max:100'],
                'program_level' => 'nullable|string|max:255',
                'department_id' => 'nullable|integer|exists:departments,id',
                'batch' => 'required|string|max:100',
                'enrollment_date' => 'required|date',
                'expected_graduation_date' => 'nullable|date|after:enrollment_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $application = \App\Models\EnrollmentApplication::where('id', $id)
                ->where('institution_id', $institution->id)
                ->where('status', 'pending')
                ->with(['student.user'])
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found or not in pending status'
                ], 404);
            }

            $student = $application->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            // CRITICAL: Check for active enrollment in ANY university (same as store())
            $activeEnrollment = Enrollment::where('student_id', $student->id)
                ->whereIn('status', ['active', 'withdrawal_requested'])
                ->with('institution')
                ->first();

            if ($activeEnrollment) {
                return response()->json([
                    'success' => false,
                    'message' => "Student is currently enrolled at {$activeEnrollment->institution->name}. A student can only have one active enrollment at a time.",
                    'current_enrollment' => [
                        'institution' => $activeEnrollment->institution->name,
                        'program' => $activeEnrollment->program,
                        'batch' => $activeEnrollment->batch,
                        'status' => $activeEnrollment->status,
                    ]
                ], 409);
            }

            // Check for existing enrollment in THIS university (same as store())
            $existingInThisUni = Enrollment::where('student_id', $student->id)
                ->where('institution_id', $institution->id)
                ->whereIn('status', ['active', 'suspended', 'withdrawal_requested'])
                ->first();

            if ($existingInThisUni) {
                return response()->json([
                    'success' => false,
                    'message' => "Student already has an enrollment record in your institution with status: {$existingInThisUni->status}"
                ], 409);
            }

            // Check if the provided roll_number is already assigned to another student in this university
            if ($request->filled('roll_number')) {
                $duplicateStudent = Enrollment::where('institution_id', $institution->id)
                    ->where('roll_number', $request->roll_number)
                    ->where('student_id', '!=', $student->id)
                    ->first();

                if ($duplicateStudent) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This Student ID is already assigned to another student in your university'
                    ], 422);
                }
            }

            $enrollment = DB::transaction(function () use ($student, $institution, $request, $user, $application) {
                // Generate enrollment number inside transaction (same as store())
                $enrollmentNumber = $this->generateEnrollmentNumber($institution);

                // Resolve program name from department if provided (same as store())
                $programName = $request->program;
                if ($request->filled('department_id')) {
                    $department = \App\Models\Department::find($request->department_id);
                    if ($department && $department->institution_id === $institution->id) {
                        $programName = $request->filled('program_level') ? $request->program_level . ' in ' . $department->name : $department->name;
                    }
                } elseif ($request->filled('program_level') && !$request->filled('department_id')) {
                    // If only program_level is provided without department
                    $programName = $programName ?: $request->program_level;
                }

                // Create enrollment (same as store())
                $enrollment = Enrollment::create([
                    'student_id' => $student->id,
                    'institution_id' => $institution->id,
                    'enrollment_number' => $enrollmentNumber,
                    'roll_number' => $request->roll_number ?: null,
                    'department_id' => $request->department_id,
                    'certificate_level_id' => $application->certificate_level_id,
                    'major_id' => $application->major_id ?? null,
                    'program' => $programName,
                    'batch' => $request->batch ?: $application->batch,
                    'status' => 'active',
                    'enrollment_date' => $request->enrollment_date,
                    'expected_graduation_date' => $request->expected_graduation_date,
                    'enrolled_by' => $user->id,
                ]);

                // Update application status
                $application->update([
                    'status' => 'approved',
                    'reviewed_by' => $user->id,
                    'reviewed_at' => now(),
                ]);

                return $enrollment;
            });

            // Send enrollment confirmation email
            try {
                $studentUser = $student->user;
                if ($studentUser) {
                    Mail::to($studentUser->email)->queue(new EnrollmentConfirmationMail($enrollment));
                }
            } catch (\Throwable $throwable) {
                \Log::error('Failed to queue enrollment confirmation (from application approval)', [
                    'enrollment_id' => $enrollment->id,
                    'error' => $throwable->getMessage(),
                ]);
            }

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'ENROLLMENT_APPLICATION_APPROVED',
                'description' => "Approved enrollment application and enrolled student {$student->first_name} {$student->last_name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify student
            if ($student->user) {
                $student->user->notify(new AppNotification(
                    'ENROLLMENT',
                    'Enrollment Application Approved!',
                    "Your enrollment application to {$institution->name} has been approved. You are now enrolled!",
                    '/student/my-university'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Application approved and student enrolled successfully',
                'enrollment' => [
                    'id' => $enrollment->id,
                    'enrollment_number' => $enrollment->enrollment_number,
                    'student_name' => $student->first_name . ' ' . $student->last_name,
                    'program' => $enrollment->program,
                    'batch' => $enrollment->batch,
                    'status' => $enrollment->status,
                ]
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is already enrolled in your institution',
                ], 409);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve application',
                'error' => $e->getMessage()
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an enrollment application with a required response reason.
     */
    public function rejectApplication(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'university_response' => 'required|string|min:10|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $institution = $user->institution;

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institution not found'
                ], 404);
            }

            $application = \App\Models\EnrollmentApplication::where('id', $id)
                ->where('institution_id', $institution->id)
                ->where('status', 'pending')
                ->with(['student.user'])
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found or already processed'
                ], 404);
            }

            $application->update([
                'status' => 'rejected',
                'university_response' => $request->university_response,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'ENROLLMENT_APPLICATION_REJECTED',
                'description' => "Rejected enrollment application from {$application->student->first_name} {$application->student->last_name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify student
            if ($application->student?->user) {
                $application->student->user->notify(new AppNotification(
                    'ENROLLMENT',
                    'Enrollment Application Rejected',
                    "Your enrollment application to {$institution->name} has been rejected.",
                    '/student/my-university'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Application rejected',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function programChangeRequests(Request $request)
    {
        $user = $request->user();
        $institution = $user->institution;

        $requests = \App\Models\ProgramChangeRequest::with([
            'student.user', 
            'enrollment.department', 
            'enrollment.major', 
            'requestedDepartment', 
            'requestedMajor'
        ])
            ->where('institution_id', $institution->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'student_name' => $req->student?->user?->name,
                    'roll_number' => $req->enrollment?->roll_number, // displayed as "Student ID" in UI
                    'current_department' => $req->enrollment?->department?->name,
                    'current_major' => $req->enrollment?->major?->name,
                    'requested_department' => $req->requestedDepartment?->name,
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

    public function approveProgramChange(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $programRequest = \App\Models\ProgramChangeRequest::with(['enrollment', 'student.user', 'requestedDepartment', 'requestedMajor'])
            ->where('id', $id)
            ->where('institution_id', $institution->id)
            ->first();

        if (!$programRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found or unauthorized'], 404);
        }

        if ($programRequest->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be approved'], 400);
        }

        DB::beginTransaction();
        try {
            // Update the enrollment
            $enrollment = $programRequest->enrollment;
            $programStr = $programRequest->requestedMajor ? $programRequest->requestedMajor->name . ' in ' . $programRequest->requestedDepartment->name : $programRequest->requestedDepartment->name;
            
            $enrollment->update([
                'department_id' => $programRequest->requested_department_id,
                'major_id' => $programRequest->requested_major_id,
                'program' => $programStr
            ]);

            // Mark request as approved
            $programRequest->update([
                'status' => 'approved',
                'admin_note' => $request->admin_note
            ]);

            // Notify student
            if ($programRequest->student && $programRequest->student->user) {
                $programRequest->student->user->notify(new \App\Notifications\AppNotification(
                    'PROGRAM_CHANGE_APPROVED',
                    'Program Change Approved',
                    "Your request to change your program to {$programStr} has been approved.",
                    '/student/my-university'
                ));
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Program change request approved successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function rejectProgramChange(Request $request, $id)
    {
        $user = $request->user();
        $institution = $user->institution;

        $programRequest = \App\Models\ProgramChangeRequest::with(['student.user'])
            ->where('id', $id)
            ->where('institution_id', $institution->id)
            ->first();

        if (!$programRequest) {
            return response()->json(['success' => false, 'message' => 'Request not found or unauthorized'], 404);
        }

        if ($programRequest->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending requests can be rejected'], 400);
        }

        $request->validate([
            'admin_note' => 'required|string|max:1000'
        ]);

        $programRequest->update([
            'status' => 'rejected',
            'admin_note' => $request->admin_note
        ]);

        // Notify student
        if ($programRequest->student && $programRequest->student->user) {
            $programRequest->student->user->notify(new \App\Notifications\AppNotification(
                'PROGRAM_CHANGE_REJECTED',
                'Program Change Rejected',
                "Your request to change your program has been rejected. Reason: {$request->admin_note}",
                '/student/my-university'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Program change request rejected'
        ]);
    }
}
