<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\EnrollmentApplication;
use App\Models\Enrollment;
use App\Models\Institution;
use App\Models\Student;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EnrollmentApplicationController extends Controller
{
    /**
     * University directory — list all approved institutions for students to browse.
     */
    public function institutions(Request $request)
    {
        try {
            $search = $request->query('search', '');

            $query = Institution::whereHas('user', function ($q) {
                $q->where('is_approved', true);
            });

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('city', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            }

            $institutions = $query->orderBy('name', 'asc')->paginate(12);

            $mapped = $institutions->getCollection()->map(function ($inst) {
                return [
                    'id' => $inst->id,
                    'name' => $inst->name,
                    'address' => $inst->address,
                    'city' => $inst->city,
                    'website' => $inst->website,
                    'registration_number' => $inst->registration_number,
                ];
            });

            return response()->json([
                'success' => true,
                'institutions' => $mapped,
                'pagination' => [
                    'current_page' => $institutions->currentPage(),
                    'last_page' => $institutions->lastPage(),
                    'per_page' => $institutions->perPage(),
                    'total' => $institutions->total(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch institutions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all enrollment applications for the authenticated student.
     */
    public function index(Request $request)
    {
        try {
            $student = Student::where('user_id', $request->user()->id)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found',
                ], 404);
            }

            $applications = EnrollmentApplication::with('institution')
                ->where('student_id', $student->id)
                ->orderByRaw("FIELD(status, 'more_info_requested', 'pending', 'approved', 'rejected')")
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'institution_id' => $app->institution_id,
                        'institution_name' => $app->institution->name ?? 'N/A',
                        'institution_city' => $app->institution->city ?? '',
                        'program' => $app->program,
                        'batch' => $app->batch,
                        'reason' => $app->reason,
                        'document_path' => $app->document_path,
                        'status' => $app->status,
                        'university_response' => $app->university_response,
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
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit a new enrollment application.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'institution_id' => 'required|integer|exists:institutions,id',
                'program' => 'nullable|string|max:255',
                'batch' => 'nullable|string|max:100',
                'reason' => 'nullable|string|max:2000',
                'document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $student = Student::where('user_id', $request->user()->id)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found',
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
                    'message' => "You are currently enrolled at {$activeEnrollment->institution->name}. You cannot apply to another university while actively enrolled.",
                ], 409);
            }

            // Check for existing pending application to the same institution
            $existingApplication = EnrollmentApplication::where('student_id', $student->id)
                ->where('institution_id', $request->institution_id)
                ->whereIn('status', ['pending', 'more_info_requested'])
                ->first();

            if ($existingApplication) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending application to this university.',
                ], 409);
            }

            // Verify the institution is approved
            $institution = Institution::where('id', $request->institution_id)
                ->whereHas('user', function ($q) {
                    $q->where('is_approved', true);
                })
                ->first();

            if (!$institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'University not found or not approved',
                ], 404);
            }

            // Handle document upload
            $documentPath = null;
            if ($request->hasFile('document')) {
                $documentPath = $request->file('document')->store('enrollment_applications', 'local');
            }

            $application = EnrollmentApplication::create([
                'student_id' => $student->id,
                'institution_id' => $institution->id,
                'program' => $request->program,
                'batch' => $request->batch,
                'reason' => $request->reason,
                'document_path' => $documentPath,
                'status' => 'pending',
            ]);

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'ENROLLMENT_APPLICATION_SUBMITTED',
                'description' => "Submitted enrollment application to {$institution->name}",
                'ip_address' => $request->ip(),
            ]);

            // Notify the university
            if ($institution->user) {
                $institution->user->notify(new AppNotification(
                    'ENROLLMENT',
                    'New Enrollment Application',
                    "Student {$student->first_name} {$student->last_name} has submitted an enrollment application.",
                    '/university/enrollments?tab=applications'
                ));
            }

            return response()->json([
                'success' => true,
                'message' => 'Application submitted successfully',
                'application' => [
                    'id' => $application->id,
                    'institution_name' => $institution->name,
                    'status' => $application->status,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit application',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Withdraw (cancel) a pending or more-info-requested application.
     */
    public function destroy(Request $request, $id)
    {
        try {
            $student = Student::where('user_id', $request->user()->id)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found',
                ], 404);
            }

            $application = EnrollmentApplication::where('id', $id)
                ->where('student_id', $student->id)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found',
                ], 404);
            }

            if (!in_array($application->status, ['pending', 'more_info_requested'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending or more-info-requested applications can be withdrawn',
                ], 422);
            }

            $institutionName = $application->institution->name ?? 'Unknown';
            $application->delete();

            // Log activity
            \App\Models\ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'ENROLLMENT_APPLICATION_WITHDRAWN',
                'description' => "Withdrew enrollment application to {$institutionName}",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Application withdrawn successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to withdraw application',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
