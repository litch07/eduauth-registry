<?php

namespace App\Http\Controllers\Admin;

use App\Mail\SendRejectionNotification;
use App\Mail\SendApprovalRequest;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Certificate;
use App\Models\CertificateAccessRequest;
use App\Models\Enrollment;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Models\Verifier;
use App\Models\VerificationLog;
use App\Models\VerifierAccess;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function dashboard()
    {
        $totalUsers = User::whereNull('deleted_at')->count();
        $pendingApprovals = User::where('is_approved', false)
            ->whereNull('deleted_at')
            ->whereIn('role', ['student', 'university', 'verifier'])
            ->count();
        $totalCertificates = \App\Models\Certificate::whereNull('deleted_at')->count();
        $totalActivity = ActivityLog::count();
        $pendingProfileChanges = \App\Models\ProfileChangeRequest::where('status', 'pending')->count();
        $totalUniversities = User::where('role', 'university')->whereNull('deleted_at')->count();
        $totalStudents = User::where('role', 'student')->whereNull('deleted_at')->count();
        $activityToday = ActivityLog::whereDate('created_at', today())->count();
        $recentVerifications = \App\Models\VerificationLog::where('verified_at', '>=', now()->subDays(7))->count();

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'pending_approvals' => $pendingApprovals,
                'total_certificates' => $totalCertificates,
                'total_activity' => $totalActivity,
                'pending_profile_changes' => $pendingProfileChanges,
                'total_universities' => $totalUniversities,
                'total_students' => $totalStudents,
                'activity_today' => $activityToday,
                'recent_verifications' => $recentVerifications,
            ],
        ]);
    }

    public function pendingUsers()
    {
        $users = User::with(['student', 'institution', 'verifier'])
            ->where('is_approved', false)
            ->whereNull('deleted_at')
            ->whereIn('role', ['student', 'university', 'verifier'])
            ->latest()
            ->get();

        return response()->json([
            'pending_users' => $users,
        ]);
    }

    public function approveUser(Request $request, $id)
    {
        $user = User::with(['student', 'institution', 'verifier'])->find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if ($user->is_approved) {
            return response()->json(['error' => 'User is already approved.'], 422);
        }

        $user->forceFill([
            'is_approved' => true,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ])->save();

        // Send approval notification email
        try {
            Mail::to($user->email)->queue(new SendApprovalRequest($user->fresh(['student', 'institution', 'verifier'])));
        } catch (\Throwable $throwable) {
            \Log::error('Failed to queue approval notification', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $throwable->getMessage(),
            ]);
        }

        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'action'      => 'user_approved',
            'entity_type' => User::class,
            'entity_id'   => $user->id,
            'description' => 'User approved by administrator.',
            'metadata'    => [
                'approved_user_email' => $user->email,
                'role'                => $user->role,
            ],
            'ip_address'  => $request->ip(),
        ]);

        // Notify the approved user
        try {
            $user->notify(new AppNotification(
                'APPROVAL',
                'Account Approved',
                'Your account has been approved. You can now access all features of EduAuth Registry.',
                '/' . $user->role . '/dashboard'
            ));
        } catch (\Throwable $throwable) {
            \Log::error('Failed to send approval notification', [
                'user_id' => $user->id,
                'error'   => $throwable->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'User approved successfully.',
            'user'    => $user->fresh(['student', 'institution', 'verifier']),
        ]);
    }

    public function rejectUser(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::with(['student', 'institution', 'verifier'])->find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        try {
            Mail::to($user->email)->queue(new SendRejectionNotification($user->fresh(['student', 'institution', 'verifier']), $request->reason));
        } catch (\Throwable $throwable) {
            \Log::error('Failed to queue rejection notification', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $throwable->getMessage(),
            ]);
        }

        DB::transaction(function () use ($request, $user) {
            if ($user->student) {
                $user->student->delete();
            }

            if ($user->institution) {
                $user->institution->delete();
            }

            if ($user->verifier) {
                $user->verifier->delete();
            }

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_rejected',
                'entity_type' => User::class,
                'entity_id' => $user->id,
                'description' => 'User rejected by administrator.',
                'metadata' => [
                    'reason' => $request->reason,
                    'rejected_user_email' => $user->email,
                    'role' => $user->role,
                ],
                'ip_address' => $request->ip(),
            ]);

            $user->delete();
        });

        return response()->json([
            'message' => 'User rejected successfully.',
        ]);
    }

    public function search(Request $request)
    {
        $search = $request->search;
        $perPage = $request->input('per_page', 5);

        $users = User::with(['student', 'institution', 'verifier'])
            ->where('email', 'like', "%{$search}%")
            ->orWhere('role', 'like', "%{$search}%")
            ->orWhereHas('student', function ($sq) use ($search) {
                $sq->where('first_name', 'like', "%{$search}%")
                   ->orWhere('last_name', 'like', "%{$search}%");
            })
            ->orWhereHas('institution', function ($iq) use ($search) {
                $iq->where('name', 'like', "%{$search}%");
            })
            ->orWhereHas('verifier', function ($vq) use ($search) {
                $vq->where('company_name', 'like', "%{$search}%");
            })
            ->paginate($perPage);

        $certificates = Certificate::with(['student.user', 'institution'])
            ->where('serial', 'like', "%{$search}%")
            ->orWhere('certificate_name', 'like', "%{$search}%")
            ->orWhereHas('student', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            })
            ->paginate($perPage);

        $activities = ActivityLog::with('user')
            ->where('action', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%")
            ->orWhereHas('user', function($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhereHas('student', function ($sq) use ($search) {
                      $sq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('institution', function ($iq) use ($search) {
                      $iq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('verifier', function ($vq) use ($search) {
                      $vq->where('company_name', 'like', "%{$search}%");
                  });
            })
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'results' => [
                'users' => $users,
                'certificates' => $certificates,
                'activities' => $activities,
            ]
        ]);
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 25), 100);

        $query = User::with(['student', 'institution', 'verifier'])
            ->whereNull('deleted_at');

        // Status filter
        if ($request->filled('status')) {
            if ($request->status === 'pending') {
                $query->where('is_approved', false);
            } elseif ($request->status === 'approved') {
                $query->where('is_approved', true);
            }
        }

        // Role filter
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Search (name, email, student_id, institution name, company name)
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('email', 'like', "%{$s}%")
                  ->orWhereHas('student', function ($sq) use ($s) {
                      $sq->where('first_name', 'like', "%{$s}%")
                         ->orWhere('last_name', 'like', "%{$s}%")
                         ->orWhere('student_id', 'like', "%{$s}%");
                  })
                  ->orWhereHas('institution', function ($iq) use ($s) {
                      $iq->where('name', 'like', "%{$s}%");
                  })
                  ->orWhereHas('verifier', function ($vq) use ($s) {
                      $vq->where('company_name', 'like', "%{$s}%");
                  });
            });
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $paginated = $query->latest()->paginate($perPage);

        $items = $paginated->getCollection()->map(function ($user) {
            $base = [
                'id'               => $user->id,
                'email'            => $user->email,
                'role'             => $user->role,
                'name'             => $user->name,
                'is_approved'      => $user->is_approved,
                'email_verified_at'=> $user->email_verified_at?->toIso8601String(),
                'created_at'       => $user->created_at?->toIso8601String(),
            ];

            if ($user->role === 'student' && $user->student) {
                $activeEnrollment = Enrollment::where('student_id', $user->student->id)
                    ->where('status', 'active')
                    ->with('institution')
                    ->first();
                $base['student_id'] = $user->student->student_id;
                $base['enrollment_institution'] = $activeEnrollment?->institution?->name;
                $base['certificates_count'] = Certificate::where('student_id', $user->student->id)->count();
            } elseif ($user->role === 'university' && $user->institution) {
                $base['institution_name'] = $user->institution->name;
                $base['enrolled_students_count'] = Enrollment::where('institution_id', $user->institution->id)->where('status', 'active')->count();
                $base['certificates_count'] = Certificate::where('institution_id', $user->institution->id)->count();
            } elseif ($user->role === 'verifier' && $user->verifier) {
                $base['company_name'] = $user->verifier->company_name;
                $base['verifications_count'] = VerificationLog::where('verifier_user_id', $user->id)->count();
                $base['active_access_count'] = VerifierAccess::where('verifier_id', $user->verifier->id)
                    ->active()
                    ->count();
            }

            return $base;
        });

        $pendingCount = User::where('is_approved', false)
            ->whereNull('deleted_at')
            ->whereIn('role', ['student', 'university', 'verifier'])
            ->count();

        return response()->json([
            'success'      => true,
            'data'         => $items,
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'pending_count'=> $pendingCount,
        ]);
    }

    public function show($id)
    {
        $user = User::with(['student', 'institution', 'verifier', 'approvedBy'])
            ->whereNull('deleted_at')
            ->findOrFail($id);

        $data = [
            'id'               => $user->id,
            'email'            => $user->email,
            'role'             => $user->role,
            'name'             => $user->name,
            'is_approved'      => $user->is_approved,
            'approved_at'      => $user->approved_at?->toIso8601String(),
            'approved_by_name' => $user->approvedBy?->name,
            'email_verified_at'=> $user->email_verified_at?->toIso8601String(),
            'created_at'       => $user->created_at?->toIso8601String(),
        ];

        if ($user->role === 'student' && $user->student) {
            $s = $user->student;
            $data['profile'] = [
                'first_name'    => $s->first_name,
                'middle_name'   => $s->middle_name,
                'last_name'     => $s->last_name,
                'date_of_birth' => $s->date_of_birth?->format('Y-m-d'),
                'student_id'    => $s->student_id,
                'phone'         => $s->phone,
                'address'       => $s->address,
                'nid_status'    => !empty($s->nid_hash) ? 'NID verified (hash only)' : 'Not Set',
            ];

            // Enrollment info
            $enrollments = Enrollment::where('student_id', $s->id)
                ->with('institution')
                ->latest('enrollment_date')
                ->get();

            $data['enrollments_summary'] = $enrollments->map(fn ($e) => [
                'id'              => $e->id,
                'institution'     => $e->institution?->name,
                'program'         => $e->program,
                'batch'           => $e->batch,
                'status'          => $e->status,
                'enrollment_date' => $e->enrollment_date?->format('Y-m-d'),
                'expected_grad'   => $e->expected_graduation_date?->format('Y-m-d'),
            ]);

            // Stats
            $totalCerts = Certificate::where('student_id', $s->id)->count();
            $publicCerts = Certificate::where('student_id', $s->id)->where('is_publicly_shareable', true)->count();
            $data['stats'] = [
                'total_certificates'  => $totalCerts,
                'public_certificates' => $publicCerts,
                'private_certificates'=> $totalCerts - $publicCerts,
                'total_enrollments'   => $enrollments->count(),
                'active_enrollments'  => $enrollments->where('status', 'active')->count(),
            ];
        } elseif ($user->role === 'university' && $user->institution) {
            $inst = $user->institution;
            $data['profile'] = [
                'name'                => $inst->name,
                'registration_number' => $inst->registration_number,
                'address'             => $inst->address,
                'city'                => $inst->city,
                'phone'               => $inst->phone,
                'website'             => $inst->website,
            ];

            $enrollmentCounts = Enrollment::where('institution_id', $inst->id)
                ->selectRaw("status, count(*) as cnt")
                ->groupBy('status')
                ->pluck('cnt', 'status');

            $totalCertsIssued = Certificate::where('institution_id', $inst->id)->count();
            $certsThisMonth = Certificate::where('institution_id', $inst->id)
                ->whereMonth('issue_date', now()->month)
                ->whereYear('issue_date', now()->year)
                ->count();

            $data['stats'] = [
                'total_enrolled'      => $enrollmentCounts->sum(),
                'active_enrolled'     => $enrollmentCounts->get('active', 0),
                'graduated'           => $enrollmentCounts->get('graduated', 0),
                'withdrawn'           => $enrollmentCounts->get('withdrawn', 0),
                'total_certificates'  => $totalCertsIssued,
                'certificates_month'  => $certsThisMonth,
            ];
        } elseif ($user->role === 'verifier' && $user->verifier) {
            $v = $user->verifier;
            $data['profile'] = [
                'company_name'   => $v->company_name,
                'contact_person' => $v->contact_person,
                'designation'    => $v->designation,
                'email'          => $v->email,
                'phone'          => $v->phone,
                'purpose'        => $v->purpose,
                'address'        => $v->address,
                'website'        => $v->website,
            ];

            $totalVerifications = VerificationLog::where('verifier_user_id', $user->id)->count();
            $successfulVerifications = VerificationLog::where('verifier_user_id', $user->id)
                ->where('verification_result', 'success')->count();
            $verificationsMonth = VerificationLog::where('verifier_user_id', $user->id)
                ->whereMonth('verified_at', now()->month)
                ->whereYear('verified_at', now()->year)
                ->count();
            $activeAccess = VerifierAccess::where('verifier_id', $v->id)
                ->active()
                ->count();
            $pendingRequests = CertificateAccessRequest::where('verifier_user_id', $user->id)
                ->where('status', 'pending')
                ->count();

            $data['stats'] = [
                'total_verifications' => $totalVerifications,
                'successful'          => $successfulVerifications,
                'success_rate'        => $totalVerifications > 0 ? round(($successfulVerifications / $totalVerifications) * 100, 1) : 0,
                'verifications_month' => $verificationsMonth,
                'active_access'       => $activeAccess,
                'pending_requests'    => $pendingRequests,
            ];
        }

        return response()->json(['success' => true, 'user' => $data]);
    }

    public function userCertificates(Request $request, $id)
    {
        $user = User::with(['student', 'institution'])->findOrFail($id);

        $query = null;
        if ($user->role === 'student' && $user->student) {
            $query = Certificate::where('student_id', $user->student->id);
        } elseif ($user->role === 'university' && $user->institution) {
            $query = Certificate::where('institution_id', $user->institution->id);
        } else {
            return response()->json(['success' => true, 'data' => [], 'total' => 0]);
        }

        $query->with(['student.user', 'institution', 'issuedBy']);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('serial', 'like', "%{$s}%")
                  ->orWhere('certificate_name', 'like', "%{$s}%");
            });
        }

        $paginated = $query->latest('issue_date')->paginate(25);

        $items = collect($paginated->items())->map(fn ($c) => [
            'id'               => $c->id,
            'serial'           => $c->serial,
            'certificate_name' => $c->certificate_name,
            'certificate_level'=> $c->certificate_level,
            'department'       => $c->department,
            'major'            => $c->major,
            'cgpa'             => $c->cgpa,
            'issue_date'       => $c->issue_date?->format('Y-m-d'),
            'revoked_at'       => $c->revoked_at?->toIso8601String(),
            'student_name'     => $c->student?->full_name,
            'institution_name' => $c->institution?->name,
        ]);

        return response()->json([
            'success'      => true,
            'data'         => $items,
            'total'        => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
        ]);
    }

    public function userEnrollments(Request $request, $id)
    {
        $user = User::with(['student', 'institution'])->findOrFail($id);

        $query = null;
        if ($user->role === 'student' && $user->student) {
            $query = Enrollment::where('student_id', $user->student->id);
        } elseif ($user->role === 'university' && $user->institution) {
            $query = Enrollment::where('institution_id', $user->institution->id);
        } else {
            return response()->json(['success' => true, 'data' => [], 'total' => 0]);
        }

        $query->with(['student.user', 'institution']);

        $paginated = $query->latest('enrollment_date')->paginate(25);

        $items = collect($paginated->items())->map(fn ($e) => [
            'id'                => $e->id,
            'student_name'      => $e->student?->full_name,
            'student_id_number' => $e->student?->student_id,
            'institution_name'  => $e->institution?->name,
            'enrollment_number' => $e->enrollment_number,
            'program'           => $e->program,
            'batch'             => $e->batch,
            'status'            => $e->status,
            'enrollment_date'   => $e->enrollment_date?->format('Y-m-d'),
            'expected_grad'     => $e->expected_graduation_date?->format('Y-m-d'),
            'actual_grad'       => $e->actual_graduation_date?->format('Y-m-d'),
        ]);

        return response()->json([
            'success'      => true,
            'data'         => $items,
            'total'        => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
        ]);
    }

    public function userActivity(Request $request, $id)
    {
        $query = ActivityLog::where('user_id', $id);

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $paginated = $query->latest()->paginate(50);

        $items = collect($paginated->items())->map(fn ($a) => [
            'id'          => $a->id,
            'action'      => $a->action,
            'description' => $a->description,
            'ip_address'  => $a->ip_address,
            'metadata'    => $a->metadata,
            'created_at'  => $a->created_at?->format('Y-m-d H:i:s'),
        ]);

        return response()->json([
            'success'      => true,
            'data'         => $items,
            'total'        => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
        ]);
    }

    public function certificateDetails($id)
    {
        $cert = Certificate::with(['student.user', 'institution', 'issuedBy', 'revokedBy', 'enrollment'])
            ->findOrFail($id);

        $verificationCount = VerificationLog::where('certificate_id', $cert->id)->count();
        $lastVerified = VerificationLog::where('certificate_id', $cert->id)
            ->latest('verified_at')
            ->first();

        return response()->json([
            'success' => true,
            'certificate' => [
                'id'                  => $cert->id,
                'serial'              => $cert->serial,
                'certificate_level'   => $cert->certificate_level,
                'certificate_name'    => $cert->certificate_name,
                'department'          => $cert->department,
                'major'               => $cert->major,
                'session'             => $cert->session,
                'cgpa'                => $cert->cgpa,
                'degree_class'        => $cert->degree_class,
                'issue_date'          => $cert->issue_date?->format('Y-m-d'),
                'convocation_date'    => $cert->convocation_date?->format('Y-m-d'),
                'authority_name'      => $cert->authority_name,
                'authority_title'     => $cert->authority_title,
                'is_publicly_shareable' => $cert->is_publicly_shareable,
                'revoked_at'          => $cert->revoked_at?->toIso8601String(),
                'revocation_reason'   => $cert->revocation_reason,
                'revoked_by_name'     => $cert->revokedBy?->name,
                'revocation_history'  => $cert->revocation_history ?? [],
                'student'             => $cert->student ? [
                    'id'        => $cert->student->id,
                    'user_id'   => $cert->student->user_id,
                    'full_name' => $cert->student->full_name,
                    'student_id'=> $cert->student->student_id,
                    'dob_masked'=> $cert->student->date_of_birth ? '••••-••-' . $cert->student->date_of_birth->format('d') : null,
                ] : null,
                'institution'         => $cert->institution ? [
                    'id'   => $cert->institution->id,
                    'name' => $cert->institution->name,
                    'user_id' => $cert->institution->user_id,
                ] : null,
                'enrollment' => $cert->enrollment ? [
                    'program' => $cert->enrollment->program,
                    'batch'   => $cert->enrollment->batch,
                    'status'  => $cert->enrollment->status,
                ] : null,
                'issued_by_name'      => $cert->issuedBy?->name,
                'verification_count'  => $verificationCount,
                'last_verified_at'    => $lastVerified?->verified_at?->toIso8601String(),
                'share_link'          => $cert->share_link,
            ],
        ]);
    }

    public function exportUsers(Request $request)
    {
        $query = User::with(['student', 'institution', 'verifier'])
            ->whereNull('deleted_at');

        if ($request->filled('status')) {
            if ($request->status === 'pending') $query->where('is_approved', false);
            elseif ($request->status === 'approved') $query->where('is_approved', true);
        }
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        $users = $query->latest()->get();

        $filename = 'users_export_' . now()->format('Y-m-d') . '.csv';
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($users) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Name', 'Email', 'Role', 'Approved', 'Email Verified', 'Registered']);
            foreach ($users as $user) {
                fputcsv($handle, [
                    $user->name,
                    $user->email,
                    $user->role,
                    $user->is_approved ? 'Yes' : 'No',
                    $user->email_verified_at ? 'Yes' : 'No',
                    $user->created_at?->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
