<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\CertificateLevel;
use App\Models\CertificateSequence;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Services\SerialGeneratorService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CertificateSerialTest extends TestCase
{
    use DatabaseTransactions;

    public function test_serial_generation_uses_short_code()
    {
        $serialBsc = SerialGeneratorService::generate('BSc');
        $this->assertStringStartsWith('BSc-26-', $serialBsc);
        $this->assertTrue(SerialGeneratorService::validateChecksum($serialBsc));

        $serialMba = SerialGeneratorService::generate('MBA');
        $this->assertStringStartsWith('MBA-26-', $serialMba);
        $this->assertTrue(SerialGeneratorService::validateChecksum($serialMba));

        $seqBsc = CertificateSequence::where('prefix', 'BSc')->first();
        $seqMba = CertificateSequence::where('prefix', 'MBA')->first();

        $this->assertNotNull($seqBsc);
        $this->assertNotNull($seqMba);

        $serialBsc2 = SerialGeneratorService::generate('BSc');
        $this->assertNotEquals($serialBsc, $serialBsc2);
        
        $seqBsc2 = CertificateSequence::where('prefix', 'BSc')->first();
        $this->assertEquals($seqBsc->current_sequence + 1, $seqBsc2->current_sequence);
        $this->assertEquals($seqMba->current_sequence, CertificateSequence::where('prefix', 'MBA')->first()->current_sequence);
    }

    public function test_certificate_store_requires_short_code_and_returns_422()
    {
        $user = new User();
        $user->forceFill([
            'email' => 'uni_' . rand(1000, 9999) . '@test.com',
            'password' => bcrypt('password'),
            'role' => 'university',
            'is_approved' => true,
        ]);
        $user->save();

        $institution = Institution::create([
            'user_id' => $user->id,
            'name' => 'Test University',
            'registration_number' => 'TU-' . rand(1000, 9999),
            'address' => '123 Uni St',
            'city' => 'Dhaka',
            'phone' => '1234567890',
        ]);

        $dept = Department::create([
            'institution_id' => $institution->id,
            'name' => 'Computer Science',
            'is_active' => true,
        ]);

        $studentUser = new User();
        $studentUser->forceFill([
            'email' => 'stu_' . rand(1000, 9999) . '@test.com',
            'password' => bcrypt('password'),
            'role' => 'student',
            'is_approved' => true,
        ]);
        $studentUser->save();

        $student = new Student();
        $student->forceFill([
            'user_id' => $studentUser->id,
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'nid_hash' => hash('sha256', 'nid_' . rand(1000, 9999)),
            'date_of_birth' => '2000-01-01',
            'student_id' => 'STU-' . rand(1000, 9999),
        ]);
        $student->save();

        $enrollment = Enrollment::create([
            'student_id' => $student->id,
            'institution_id' => $institution->id,
            'enrollment_number' => 'ENR-' . rand(10000, 99999),
            'program' => 'BSc in Computer Science',
            'batch' => 'Spring 2026',
            'status' => 'active',
            'enrollment_date' => '2026-01-01',
            'enrolled_by' => $user->id,
        ]);

        $levelNoShortCode = CertificateLevel::create([
            'institution_id' => $institution->id,
            'name' => 'Bachelor of Science (Legacy)',
            'short_code' => '',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/university/certificates', [
                'student_id' => $student->id,
                'certificate_level_id' => $levelNoShortCode->id,
                'department_id' => $dept->id,
                'cgpa' => 3.8,
                'degree_class' => 'First Class',
                'issue_date' => '10/06/2026',
                'authority_name' => 'Vice Chancellor',
                'authority_title' => 'VC',
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'success' => false,
            'message' => 'The selected certificate level has no short code set.',
        ]);
    }

    public function test_enrollment_number_generation()
    {
        $user = new User();
        $user->forceFill([
            'email' => 'uni_' . rand(1000, 9999) . '@test.com',
            'password' => bcrypt('password'),
            'role' => 'university',
            'is_approved' => true,
        ]);
        $user->save();

        $institution = Institution::create([
            'user_id' => $user->id,
            'name' => 'Alpha University',
            'registration_number' => 'TU-' . rand(1000, 9999),
            'address' => '123 Uni St',
            'city' => 'Dhaka',
            'phone' => '1234567890',
        ]);

        $dept = Department::create([
            'institution_id' => $institution->id,
            'name' => 'Computer Science',
            'is_active' => true,
        ]);

        $major = \App\Models\Major::create([
            'department_id' => $dept->id,
            'name' => 'Software Engineering',
            'is_active' => true,
        ]);

        $studentUser = new User();
        $studentUser->forceFill([
            'email' => 'stu_' . rand(1000, 9999) . '@test.com',
            'password' => bcrypt('password'),
            'role' => 'student',
            'is_approved' => true,
        ]);
        $studentUser->save();

        $student = new Student();
        $student->forceFill([
            'user_id' => $studentUser->id,
            'first_name' => 'Bob',
            'last_name' => 'Smith',
            'nid_hash' => hash('sha256', 'nid_' . rand(1000, 9999)),
            'date_of_birth' => '2000-01-01',
            'student_id' => 'STU-' . rand(1000, 9999),
        ]);
        $student->save();

        $certLevel = CertificateLevel::create([
            'institution_id' => $institution->id,
            'name' => 'Bachelor of Science',
            'short_code' => 'BSc',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/university/enrollments', [
                'student_email' => $studentUser->email,
                'program' => 'BSc in Computer Science',
                'department_id' => $dept->id,
                'major_id' => $major->id,
                'certificate_level_id' => $certLevel->id,
                'batch' => 'Spring 2026',
                'enrollment_date' => '2026-01-01',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        
        $enrollmentNumber = $response->json('enrollment.enrollment_number');
        $this->assertStringStartsWith('ALP-26-', $enrollmentNumber);

        // Verify tracking record created in CertificateSequence
        $seq = CertificateSequence::where('prefix', 'ALP_' . $institution->id)->first();
        $this->assertNotNull($seq);
        $this->assertEquals(1, $seq->current_sequence);
        $this->assertEquals(date('y'), $seq->year_suffix);
    }
}
