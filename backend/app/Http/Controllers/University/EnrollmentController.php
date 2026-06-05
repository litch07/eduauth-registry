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

            $query = Enrollment::with(['student.user'])
                ->where('institution_id', $institution->id);

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            if ($search) {
                $query->where(function ($mainQuery) use ($search) {
                    $mainQuery->whereHas('student', function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                          ->orWhere('last_name', 'like', "%{$search}%")
                          ->orWhere('student_id', 'like', "%{$search}%");
                    })->orWhere('enrollment_number', 'like', "%{$search}%");
                });
            }

            $stats = [
                'total' => Enrollment::where('institution_id', $institution->id)->count(),
                'active' => Enrollment::where('institution_id', $institution->id)->where('status', 'active')->count(),
                'graduated' => Enrollment::where('institution_id', $institution->id)->where('status', 'graduated')->count(),
            ];

            $paginator = $query->orderBy('created_at', 'desc')->paginate(15);

            $enrollments = $paginator->getCollection()->map(function ($enrollment) {
                return [
                    'id' => $enrollment->id,
                    'enrollment_number' => $enrollment->enrollment_number,
                    'student_name' => $enrollment->student
                        ? trim($enrollment->student->first_name . ' ' . $enrollment->student->last_name)
                        : 'N/A',
                    'student_id' => $enrollment->student?->student_id,
                    'student_email' => $enrollment->student?->user?->email,
                    'program' => $enrollment->program,
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
                    'student_id' => $enrollment->student?->student_id,
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
                'department_id' => 'nullable|integer|exists:departments,id',
                'program_level' => 'nullable|string|max:255',
                'batch' => 'required|string|max:100',
                'student_id' => ['required', 'string', 'min:5', 'max:50', 'regex:/^[a-zA-Z0-9\-]+$/'],
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

            $student = $studentUser->student;

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            // CRITICAL: Check for active enrollment in ANY university
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

            // Check for existing enrollment in THIS university (any non-withdrawn status)
            $existingInThisUni = Enrollment::where('student_id', $student->id)
                ->where('institution_id', $institution->id)
                ->whereIn('status', ['active', 'graduated', 'suspended', 'withdrawal_requested'])
                ->first();

            if ($existingInThisUni) {
                return response()->json([
                    'success' => false,
                    'message' => "Student already has an enrollment record in your institution with status: {$existingInThisUni->status}"
                ], 409);
            }

            // Check if the provided student_id is already assigned to another student in this university
            $duplicateStudent = User::where('role', 'student')
                ->whereHas('student', function ($q) use ($request) {
                    $q->where('student_id', $request->student_id);
                })
                ->whereHas('student.enrollments', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                })
                ->where('email', '!=', $request->student_email)
                ->first();

            if ($duplicateStudent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student ID already assigned to another student in your university'
                ], 422);
            }

            $enrollment = DB::transaction(function () use ($student, $institution, $request, $user) {
                // Generate enrollment number inside transaction to utilize lock
                $enrollmentNumber = $this->generateEnrollmentNumber($institution);

                // Assign the new student ID
                $student->update(['student_id' => $request->student_id]);

                // Resolve program name from department if provided
                $programName = $request->program;
                if ($request->filled('department_id')) {
                    $department = \App\Models\Department::find($request->department_id);
                    if ($department && $department->institution_id === $institution->id) {
                        $programName = $request->filled('program_level') ? $request->program_level . ' in ' . $department->name : $department->name;
                    }
                }

                // Create enrollment
                return Enrollment::create([
                    'student_id' => $student->id,
                    'institution_id' => $institution->id,
                    'enrollment_number' => $enrollmentNumber,
                    'program' => $programName,
                    'batch' => $request->batch,
                    'status' => 'active',
                    'enrollment_date' => $request->enrollment_date,
                    'expected_graduation_date' => $request->expected_graduation_date,
                    'enrolled_by' => $user->id,
                ]);
            });

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
            \App\Models\ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'STUDENT_ENROLLED',
                'description' => "Enrolled student {$student->first_name} {$student->last_name} in {$request->program}",
                'ip_address' => $request->ip(),
            ]);

            if ($student->user) {
                $student->user->notify(new AppNotification(
                    'ENROLLMENT',
                    'You have been enrolled',
                    "You have been enrolled in {$request->program} at {$institution->name}.",
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
                'program' => 'nullable|string|max:255',
                'department_id' => 'nullable|integer|exists:departments,id',
                'program_level' => 'nullable|string|max:255',
                'batch' => 'nullable|string|max:100',
                'expected_graduation_date' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->expected_graduation_date) {
                $enrollmentDate = \Carbon\Carbon::parse($enrollment->enrollment_date);
                $expectedDate = \Carbon\Carbon::parse($request->expected_graduation_date);
                if ($expectedDate->lte($enrollmentDate)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Expected graduation date must be after enrollment date'
                    ], 422);
                }
            }

            $oldValues = $enrollment->only(['program', 'batch', 'expected_graduation_date']);
            
            $updateData = $request->only(['batch', 'expected_graduation_date']);
            
            if ($request->filled('department_id')) {
                $department = \App\Models\Department::find($request->department_id);
                if ($department && $department->institution_id === $institution->id) {
                    $updateData['program'] = $request->filled('program_level') ? $request->program_level . ' in ' . $department->name : $department->name;
                }
            } elseif ($request->has('program')) {
                $updateData['program'] = $request->program;
            }

            $enrollment->update($updateData);

            $newValues = $enrollment->only(['program', 'batch', 'expected_graduation_date']);

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
                    'batch' => $enrollment->batch,
                    'expected_graduation_date' => $enrollment->expected_graduation_date,
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
                        'status' => $request->status === 'withdrawn' ? 'approved' : 'rejected',
                        'responded_at' => now(),
                        'responded_by' => $user->id,
                        'response_message' => $request->status === 'withdrawn' 
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
        $prefix = strtoupper(substr($institution->name, 0, 3));
        $year = date('y');
        $sequenceKey = 'enrollment_serial_' . $institution->id;

        // same lockForUpdate pattern as certificate serials — keeps numbers unique under concurrency
        $sequence = \App\Models\CertificateSequence::where('sequence_key', $sequenceKey)->lockForUpdate()->first();

        if (!$sequence) {
            $sequence = \App\Models\CertificateSequence::create([
                'sequence_key' => $sequenceKey,
                'prefix' => $prefix,
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
        
        return $prefix . '-' . $year . '-' . $serialNumber;
    }

    /**
     * Search students to enroll (not yet enrolled)
     */
    public function searchStudents(Request $request)
    {
        try {
            $search = $request->query('search', '');
            $enrolled = $request->query('enrolled', 'false') === 'true';
            $user = $request->user();
            $institution = $user->institution;

            if (strlen($search) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Search query must be at least 2 characters'
                ], 400);
            }

            $query = Student::with('user')
                ->whereHas('user', function ($q) {
                    $q->where('role', 'student')
                      ->where('is_approved', true);
                })
                ->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('email', 'like', "%{$search}%");
                      });
                });

            if ($enrolled) {
                // Return ONLY enrolled students for this institution
                $query->whereHas('enrollments', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id)
                      ->whereIn('status', ['active', 'graduated']);
                });
                // We also need the enrollment data to return program/batch
                $query->with(['enrollments' => function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                }]);
            } else {
                // Return students NOT enrolled or having blocking statuses in this institution
                $query->whereDoesntHave('enrollments', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id)
                      ->whereIn('status', ['active', 'graduated', 'suspended', 'withdrawal_requested']);
                });
            }

            $students = $query->limit(20)->get()->map(function ($student) use ($enrolled) {
                $data = [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_id' => $student->student_id,
                    'email' => $student->user->email,
                    'phone' => $student->phone,
                ];

                if ($enrolled && $student->enrollments->isNotEmpty()) {
                    $enrollment = $student->enrollments->first();
                    $data['program'] = $enrollment->program ?? 'N/A';
                    $data['batch'] = $enrollment->batch ?? 'N/A';
                    $data['enrollment_status'] = $enrollment->status ?? 'N/A';
                }

                return $data;
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
                ->get()
                ->map(function ($req) {
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
                'requests' => $requests,
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

            $applications = \App\Models\EnrollmentApplication::with(['student.user', 'reviewer'])
                ->where('institution_id', $institution->id)
                ->orderByRaw("FIELD(status, 'pending', 'more_info_requested', 'approved', 'rejected')")
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'student_id' => $app->student_id,
                        'student_name' => $app->student
                            ? trim($app->student->first_name . ' ' . $app->student->last_name)
                            : 'N/A',
                        'student_email' => $app->student?->user?->email,
                        'student_current_id' => $app->student?->student_id,
                        'program' => $app->program,
                        'batch' => $app->batch,
                        'reason' => $app->reason,
                        'document_path' => $app->document_path,
                        'status' => $app->status,
                        'university_response' => $app->university_response,
                        'reviewed_by' => $app->reviewer?->email,
                        'reviewed_at' => $app->reviewed_at,
                        'created_at' => $app->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'applications' => $applications,
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
                'student_id' => ['required', 'string', 'min:5', 'max:50', 'regex:/^[a-zA-Z0-9\-]+$/'],
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
                ->whereIn('status', ['active', 'graduated', 'suspended', 'withdrawal_requested'])
                ->first();

            if ($existingInThisUni) {
                return response()->json([
                    'success' => false,
                    'message' => "Student already has an enrollment record in your institution with status: {$existingInThisUni->status}"
                ], 409);
            }

            // Check if the provided student_id is already assigned to another student (same as store())
            $duplicateStudent = User::where('role', 'student')
                ->whereHas('student', function ($q) use ($request) {
                    $q->where('student_id', $request->student_id);
                })
                ->whereHas('student.enrollments', function ($q) use ($institution) {
                    $q->where('institution_id', $institution->id);
                })
                ->where('id', '!=', $student->user_id)
                ->first();

            if ($duplicateStudent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student ID already assigned to another student in your university'
                ], 422);
            }

            $enrollment = DB::transaction(function () use ($student, $institution, $request, $user, $application) {
                // Generate enrollment number inside transaction (same as store())
                $enrollmentNumber = $this->generateEnrollmentNumber($institution);

                // Assign the new student ID
                $student->update(['student_id' => $request->student_id]);

                // Resolve program name from department if provided (same as store())
                $programName = $application->program ?? $request->program;
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
                ->whereIn('status', ['pending', 'more_info_requested'])
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

    /**
     * Request more information from the student regarding their application.
     */
    public function requestMoreInfo(Request $request, $id)
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
                    'message' => 'Application not found or not in pending status'
                ], 404);
            }

            $application->update([
                'status' => 'more_info_requested',
                'university_response' => $request->university_response,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'ENROLLMENT_APPLICATION_MORE_INFO',
                'description' => "Requested more info on enrollment application from {$application->student->first_name} {$application->student->last_name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify student
            if ($application->student?->user) {
                $application->student->user->notify(new AppNotification(
                    'ENROLLMENT',
                    'More Information Requested',
                    "The university {$institution->name} needs additional information regarding your enrollment application.",
                    '/student/my-university'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'More information request sent to student',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to request more information',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

