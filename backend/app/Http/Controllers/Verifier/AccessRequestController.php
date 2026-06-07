<?php

namespace App\Http\Controllers\Verifier;

use App\Http\Controllers\Controller;
use App\Models\CertificateAccessRequest;
use App\Models\Student;
use App\Models\UserSetting;
use App\Models\Verifier;
use App\Models\VerifierAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Notifications\AppNotification;

class AccessRequestController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => ['required', Rule::exists('students', 'id')->whereNull('deleted_at')],
            'purpose' => 'required|string|min:20|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $verifier = Verifier::where('user_id', $request->user()->id)->first();
            $student = Student::find($request->student_id);

            // wrap in a transaction so two rapid clicks can't both slip past the duplicate check
            $result = DB::transaction(function () use ($verifier, $student, $request) {
                $hasActiveAccess = VerifierAccess::where('verifier_id', $verifier->id)
                    ->where('student_id', $student->id)
                    ->active()
                    ->exists();

                if ($hasActiveAccess) {
                    return ['conflict' => 'You already have active access to this student\'s certificates.'];
                }

                // lock the row so concurrent requests can't both pass this check
                $hasPendingRequest = CertificateAccessRequest::where('verifier_id', $verifier->id)
                    ->where('student_id', $student->id)
                    ->pending()
                    ->lockForUpdate()
                    ->exists();

                if ($hasPendingRequest) {
                    return ['conflict' => 'You already have a pending access request for this student.'];
                }

                $accessRequest = CertificateAccessRequest::create([
                    'verifier_id' => $verifier->id,
                    'student_id' => $student->id,
                    'purpose' => $request->purpose,
                ]);

                return ['success' => true, 'request' => $accessRequest];
            });

            if (isset($result['conflict'])) {
                return response()->json(['success' => false, 'message' => $result['conflict']], 409);
            }

            // Notify Student
            if ($student && $student->user) {
                $student->user->notify(new AppNotification(
                    'ACCESS_REQUEST',
                    'New Access Request',
                    "{$verifier->company_name} has requested access to your certificates.",
                    '/student/access-requests'
                ));
            }

            return response()->json(['success' => true, 'message' => 'Access request sent successfully.'], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send access request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $verifier = Verifier::where('user_id', $request->user()->id)->first();
            $requests = CertificateAccessRequest::with('student.user')
                ->where('verifier_id', $verifier->id)
                ->latest()
                ->get();

            return response()->json(['success' => true, 'requests' => $requests]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch access requests.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancel(Request $request, $id)
    {
        try {
            $verifier = Verifier::where('user_id', $request->user()->id)->first();
            $accessRequest = CertificateAccessRequest::where('verifier_id', $verifier->id)
                ->where('id', $id)
                ->pending()
                ->first();

            if (!$accessRequest) {
                return response()->json(['success' => false, 'message' => 'Pending request not found or cannot be cancelled.'], 404);
            }

            $accessRequest->delete();

            return response()->json(['success' => true, 'message' => 'Access request cancelled.']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel access request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function searchStudents(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter at least 3 characters.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $query = trim($request->query('query'));
            $student = null;

            // Detect search type and perform exact match
            if (str_contains($query, '@')) {
                // Email Search
                if (!filter_var($query, FILTER_VALIDATE_EMAIL)) {
                    return response()->json(['success' => false, 'message' => 'Invalid email format.'], 400);
                }

                $student = Student::with('user', 'institution')
                    ->whereHas('user', function ($q) use ($query) {
                        $q->where('email', $query)->where('role', 'student');
                    })
                    ->first();
            } elseif (preg_match('/^\d{10,17}$/', $query)) {
                // NID Search
                $nidHash = hash('sha256', $query);
                $student = Student::with('user', 'institution')
                    ->where('nid_hash', $nidHash)
                    ->first();
            } else {
                // Student ID Search
                $student = Student::with('user', 'institution')
                    ->where('student_id', $query)
                    ->first();
            }

            if (!$student || ($student->user && !$student->user->is_approved)) {
                return response()->json([
                    'success'  => true,
                    'students' => [],
                    'message'  => 'No student found with this identifier.',
                ]);
            }

            // ── Check allow_verifier_search preference ──────────────────────────
            $studentSettings = UserSetting::where('user_id', $student->user_id)->first();

            $allowSearch     = $studentSettings ? ($studentSettings->allow_verifier_search ?? true) : true;
            $showEmail       = $studentSettings ? ($studentSettings->show_email_to_verifiers ?? false) : false;

            if (!$allowSearch) {
                // Student has opted out of verifier search — return nothing
                return response()->json([
                    'success'  => true,
                    'students' => [],
                    'message'  => 'No student found with this identifier.',
                ]);
            }

            // Check for existing requests to disable button on frontend
            $verifier = Verifier::where('user_id', $request->user()->id)->first();

            $hasActiveAccess   = false;
            $hasPendingRequest = false;

            if ($verifier) {
                $hasActiveAccess = VerifierAccess::where('verifier_id', $verifier->id)
                    ->where('student_id', $student->id)
                    ->active()
                    ->exists();

                $hasPendingRequest = CertificateAccessRequest::where('verifier_id', $verifier->id)
                    ->where('student_id', $student->id)
                    ->pending()
                    ->exists();
            }

            // ── Build result — conditionally include email ───────────────────────
            $result = [
                'id'                  => $student->id,
                'student_id'          => $student->student_id,
                'name'                => $student->full_name ?: $student->user?->name,
                'institution'         => $student->institution ? $student->institution->name : null,
                'has_active_request'  => $hasActiveAccess,
                'has_pending_request' => $hasPendingRequest,
            ];

            // Only include email if the student has opted in
            if ($showEmail) {
                $result['email'] = $student->user?->email;
            }

            return response()->json(['success' => true, 'students' => [$result]]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search students.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Return a student's profile for a verifier.
     * Enforces profile_visibility: private => 403, verifiers_only => allowed,
     * public => allowed. Admins and the student's own universities bypass this.
     */
    public function showStudentProfile(Request $request, $studentId)
    {
        try {
            $student = Student::with('user', 'institution')->find($studentId);

            if (!$student || !$student->user || !$student->user->is_approved) {
                return response()->json(['success' => false, 'message' => 'Student not found.'], 404);
            }

            // Load the student's privacy preferences
            $studentSettings = UserSetting::where('user_id', $student->user_id)->first();

            $profileVisibility = $studentSettings ? ($studentSettings->profile_visibility ?? 'verifiers_only') : 'verifiers_only';
            $showEmail         = $studentSettings ? ($studentSettings->show_email_to_verifiers ?? false) : false;
            $showInstitution   = $studentSettings ? ($studentSettings->show_institution_to_public ?? true) : true;

            // Verifiers may not see private profiles
            if ($profileVisibility === 'private') {
                return response()->json([
                    'success' => false,
                    'message' => 'This student has set their profile to private. You cannot view their profile details.',
                ], 403);
            }

            $verifier = Verifier::where('user_id', $request->user()->id)->first();

            $hasActiveAccess = $verifier
                ? VerifierAccess::where('verifier_id', $verifier->id)
                    ->where('student_id', $student->id)
                    ->active()
                    ->exists()
                : false;

            $hasPendingRequest = $verifier
                ? CertificateAccessRequest::where('verifier_id', $verifier->id)
                    ->where('student_id', $student->id)
                    ->pending()
                    ->exists()
                : false;

            $profile = [
                'id'                  => $student->id,
                'student_id'          => $student->student_id,
                'name'                => $student->full_name ?: $student->user?->name,
                'institution'         => $showInstitution && $student->institution
                    ? $student->institution->name
                    : null,
                'has_active_access'   => $hasActiveAccess,
                'has_pending_request' => $hasPendingRequest,
                'profile_visibility'  => $profileVisibility,
            ];

            // Only include email if the student has opted in
            if ($showEmail) {
                $profile['email'] = $student->user?->email;
            }

            return response()->json(['success' => true, 'student' => $profile]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch student profile.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function accessibleStudents(Request $request)
    {
        try {
            $verifier = Verifier::where('user_id', $request->user()->id)->first();
            $accesses = VerifierAccess::with('student.user', 'student.certificates')
                ->where('verifier_id', $verifier->id)
                ->notRevoked()
                ->get();

            return response()->json([
                'success' => true,
                'accesses' => $accesses->map(function ($access) {
                    return [
                        'id' => $access->id,
                        'verifier_id' => $access->verifier_id,
                        'student_id' => $access->student_id,
                        'student_name' => $access->student?->full_name ?: $access->student?->user?->name,
                        'student_email' => $access->student?->user?->email,
                        'student_identifier' => $access->student?->student_id,
                        'granted_at' => $access->granted_at,
                        'expires_at' => $access->expires_at,
                        'revoked_at' => $access->revoked_at,
                        'is_active' => $access->isActive(),
                        'certificates' => $access->student?->certificates?->map(function ($certificate) {
                            return [
                                'id' => $certificate->id,
                                'serial' => $certificate->serial,
                                'certificate_name' => $certificate->certificate_name,
                                'degree_title' => $certificate->degree_title,
                                'program_name' => $certificate->program_name,
                                'issue_date' => $certificate->issue_date,
                                'revoked_at' => $certificate->revoked_at,
                                'is_public' => $certificate->is_publicly_shareable,
                            ];
                        }) ?? [],
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch accessible students.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
