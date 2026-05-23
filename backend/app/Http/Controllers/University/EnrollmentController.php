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

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_email' => 'required|email|exists:users,email',
                'program' => 'required|string|max:255',
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

                // Create enrollment
                return Enrollment::create([
                    'student_id' => $student->id,
                    'institution_id' => $institution->id,
                    'enrollment_number' => $enrollmentNumber,
                    'program' => $request->program,
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
                    'id' => $enrollment->student_id,
                    'name' => trim($enrollment->student->first_name . ' ' . $enrollment->student->last_name),
                    'enrollment_id' => $enrollment->id,
                    'program' => $enrollment->program,
                    'batch' => $enrollment->batch,
                ];
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
}
