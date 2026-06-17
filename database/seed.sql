-- EduAuth Registry — Seed Data (Updated for current schema)

USE eduauth_registry;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE failed_jobs;
TRUNCATE TABLE jobs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE user_settings;
TRUNCATE TABLE program_change_requests;
TRUNCATE TABLE extension_requests;
TRUNCATE TABLE enrollment_applications;
TRUNCATE TABLE profile_change_requests;
TRUNCATE TABLE withdrawal_requests;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE verification_logs;
TRUNCATE TABLE verifier_access;
TRUNCATE TABLE certificate_access_requests;
TRUNCATE TABLE certificates;
TRUNCATE TABLE certificate_sequences;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE certificate_levels;
TRUNCATE TABLE majors;
TRUNCATE TABLE departments;
TRUNCATE TABLE verifiers;
TRUNCATE TABLE institutions;
TRUNCATE TABLE students;
TRUNCATE TABLE pending_registrations;
TRUNCATE TABLE personal_access_tokens;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════
-- USERS
-- Password for all non-admin = password123
-- ══════════════════════════════════════════
INSERT INTO users (id, email, password, role, email_verified_at, is_approved, approved_by, approved_at, suspended_at, suspension_reason, created_at, updated_at) VALUES
(1,  'eduauthregistry@gmail.com',   '$2y$12$fRnWpk9tA2pRmFk6rttX0.yJtAK84wmlvkcTJKnmNTbWA5/IxSKSi', 'admin',      NOW(), 1, NULL, NOW(), NULL, NULL, NOW(), NOW()),
(2,  'admin@uiu.ac.bd',             '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'university', NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(3,  'ssadidahmed01@gmail.com',     '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(4,  'sayem23cse@gmail.com',        '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(5,  'mnur223442@bscse.uiu.ac.bd',  '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(6,  'demo@enosis.com',             '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'verifier',   NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(7,  'demo@brainstation-23.com',    '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'verifier',   NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(8,  'ssadidahmed07@gmail.com',     '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'verifier',   NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(9,  'kanij.fatema@gmail.com',      '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(10, 'safwan.al.sajid@gmail.com',   '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(11, 'pending.student@gmail.com',   '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 0,    NULL, NULL,  NULL, NULL, NOW(), NOW()),
(12, 'admin@nsu.edu.bd',            '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'university', NOW(), 1,    1,    NOW(), NULL, NULL, NOW(), NOW()),
(13, 'suspended.student@gmail.com', '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NOW(), 'Violated terms of service.', NOW(), NOW()),
(14, 'suspended.university@brac.bd','$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'university', NOW(), 1,    1,    NOW(), NOW(), 'Fraudulent activities reported.', NOW(), NOW()),
(15, 'pending.university@aiub.edu', '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'university', NOW(), 0,    NULL, NULL,  NULL, NULL, NOW(), NOW()),
(16, 'pending.verifier@bdjobs.com', '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'verifier',   NOW(), 0,    NULL, NULL,  NULL, NULL, NOW(), NOW());

-- ══════════════════════════════════════════
-- INSTITUTIONS
-- ══════════════════════════════════════════
INSERT INTO institutions (id, user_id, name, registration_number, address, city, phone, website, default_authority_name, default_authority_title, created_at, updated_at) VALUES
(1, 2,  'United International University', 'UIU-REG-2024-001', 'United City, Madani Avenue, Badda', 'Dhaka', '+8801712345678', 'https://www.uiu.ac.bd',    'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', NOW(), NOW()),
(2, 12, 'North South University',          'NSU-REG-1992-001', 'Bashundhara, Dhaka',                'Dhaka', '+880255668200',  'http://www.northsouth.edu', 'Prof. Dr. Atiqul Islam',        'Vice Chancellor', NOW(), NOW()),
(3, 14, 'BRAC University',                 'BRAC-REG-2001-001','Mohakhali, Dhaka',                  'Dhaka', '+88029844051',   'https://www.bracu.ac.bd',   'Prof. Syed Mahfuzul Aziz',      'Acting Vice Chancellor', NOW(), NOW()),
(4, 15, 'American International University','AIUB-REG-1994-01', 'Kuril, Dhaka',                      'Dhaka', '+88028414046',   'https://www.aiub.edu',      'Dr. Carmen Z. Lamagna',         'Vice Chancellor', NOW(), NOW());

-- ══════════════════════════════════════════
-- STUDENTS
-- ══════════════════════════════════════════
INSERT INTO students (id, user_id, first_name, middle_name, last_name, nid_hash, nid_encrypted, date_of_birth, gender, phone, address, created_at, updated_at) VALUES
(1, 3,  'Sadid',        NULL,   'Ahmed',    SHA2('NID-010101-001', 256), NULL, '2002-01-01', 'Male',   '+8801700001001', 'Mirpur, Dhaka',      NOW(), NOW()),
(2, 4,  'M.M. Sayem',   NULL,   'Prodhan',  SHA2('NID-010101-002', 256), NULL, '2002-01-01', 'Male',   '+8801700001002', 'Mohammadpur, Dhaka', NOW(), NOW()),
(3, 5,  'Md. Assaduzzaman', NULL,   'Nur',      SHA2('NID-010101-003', 256), NULL, '2002-01-01', 'Male',   '+8801700001003', 'Uttara, Dhaka',      NOW(), NOW()),
(4, 9,  'Kanij',        NULL,   'Fatema',   SHA2('NID-010101-004', 256), NULL, '2001-06-15', 'Female', '+8801700001004', 'Gulshan, Dhaka',     NOW(), NOW()),
(5, 10, 'Safwan Al',    NULL,   'Sajid',    SHA2('NID-010101-005', 256), NULL, '2000-11-20', 'Male',   '+8801700001005', 'Dhanmondi, Dhaka',   NOW(), NOW()),
(6, 11, 'Pending',      NULL,   'Student',  SHA2('NID-010101-006', 256), NULL, '2003-03-10', 'Other',  '+8801700001006', 'Banani, Dhaka',      NOW(), NOW()),
(7, 13, 'Suspended',    NULL,   'User',     SHA2('NID-010101-007', 256), NULL, '2001-01-01', 'Male',   '+8801700001007', 'Mohakhali, Dhaka',   NOW(), NOW());

-- ══════════════════════════════════════════
-- VERIFIERS
-- ══════════════════════════════════════════
INSERT INTO verifiers (id, user_id, company_name, contact_person, designation, email, phone, purpose, address, website, created_at, updated_at) VALUES
(1, 6, 'Enosis Solutions',   'HR Department',    'Senior HR Manager', 'demo@enosis.com',          '+8801900000001', 'Background check for software engineering candidates', 'Dhaka, Bangladesh', 'https://enosis.com',          NOW(), NOW()),
(2, 7, 'Brain Station 23',   'Recruitment Team', 'HR Lead',           'demo@brainstation-23.com', '+8801900000002', 'Academic credential verification for new hires',       'Dhaka, Bangladesh', 'https://brainstation-23.com', NOW(), NOW()),
(3, 8, 'PhaseShift Limited', 'Sadid Ahmed',      'Project Manager',   'ssadidahmed07@gmail.com',  '+8801900000003', 'Project audit and team credential verification',       'Dhaka, Bangladesh', NULL,                          NOW(), NOW()),
(4, 16, 'BDJobs',            'Verification Dept','Compliance Officer','pending.verifier@bdjobs.com','+8801900000004', 'Platform credential validation',                     'Dhaka, Bangladesh', 'https://bdjobs.com',          NOW(), NOW());

-- ══════════════════════════════════════════
-- CERTIFICATE LEVELS
-- ══════════════════════════════════════════
INSERT INTO certificate_levels (id, institution_id, name, short_code, is_active, created_at, updated_at) VALUES
(1, 1, 'Bachelor of Science',                   'BSc',   1, NOW(), NOW()),
(2, 1, 'Bachelor of Commerce',                  'BCom',  1, NOW(), NOW()),
(3, 1, 'Bachelor of Arts',                      'BA',    1, NOW(), NOW()),
(4, 1, 'Master of Business Administration',     'MBA',   1, NOW(), NOW()),
(5, 1, 'Master of Science',                     'MSc',   1, NOW(), NOW()),
(6, 1, 'Doctor of Philosophy',                  'PhD',   1, NOW(), NOW()),
(7, 2, 'Bachelor of Science',                   'BSc',   1, NOW(), NOW()),
(8, 2, 'Bachelor of Architecture',              'BArch', 1, NOW(), NOW()),
(9, 2, 'Bachelor of Business Administration',   'BBA',   1, NOW(), NOW()),
(10,3, 'Bachelor of Science',                   'BSc',   1, NOW(), NOW()),
(11,4, 'Bachelor of Arts',                      'BA',    1, NOW(), NOW());

-- ══════════════════════════════════════════
-- DEPARTMENTS
-- ══════════════════════════════════════════
INSERT INTO departments (id, institution_id, certificate_level_id, name, short_code, is_active, created_at, updated_at) VALUES
(1, 1, 1, 'Computer Science and Engineering',        'CSE', 1, NOW(), NOW()),
(2, 1, 1, 'Electrical and Electronic Engineering',   'EEE', 1, NOW(), NOW()),
(3, 1, 4, 'Business Administration',                 'BBA', 1, NOW(), NOW()),
(4, 2, 7, 'Electrical and Computer Engineering',     'ECE', 1, NOW(), NOW()),
(5, 2, 8, 'Architecture',                            'ARCH',1, NOW(), NOW()),
(6, 2, 9, 'Business Administration',                 'BBA', 1, NOW(), NOW()),
(7, 3, 10,'Computer Science',                        'CS',  1, NOW(), NOW()),
(8, 4, 11,'English',                                 'ENG', 1, NOW(), NOW());

-- ══════════════════════════════════════════
-- MAJORS
-- ══════════════════════════════════════════
INSERT INTO majors (id, department_id, name, is_active, created_at, updated_at) VALUES
(1,  1, 'Software Engineering',    1, NOW(), NOW()),
(2,  1, 'Data Science',            1, NOW(), NOW()),
(3,  1, 'Artificial Intelligence', 1, NOW(), NOW()),
(4,  1, 'Full-Stack Development',  1, NOW(), NOW()),
(5,  1, 'Machine Learning',        1, NOW(), NOW()),
(6,  2, 'Power Systems',           1, NOW(), NOW()),
(7,  3, 'Marketing',               1, NOW(), NOW()),
(8,  3, 'Finance',                 1, NOW(), NOW()),
(9,  4, 'Computer Science',        1, NOW(), NOW()),
(10, 4, 'Computer Engineering',    1, NOW(), NOW()),
(11, 5, 'Architecture',            1, NOW(), NOW()),
(12, 6, 'Accounting',              1, NOW(), NOW()),
(13, 7, 'Computer Science',        1, NOW(), NOW()),
(14, 8, 'English Literature',      1, NOW(), NOW());

-- ══════════════════════════════════════════
-- ENROLLMENTS
-- ══════════════════════════════════════════
INSERT INTO enrollments (id, enrollment_number, student_id, institution_id, roll_number, department_id, major_id, program, batch, status, suspension_reason, enrollment_date, expected_graduation_date, actual_graduation_date, enrolled_by, certificate_level_id, created_at, updated_at) VALUES
(1, 'UIU-22-000001', 1, 1, '011233-0154', 1, 1, 'Bachelor of Science in Computer Science and Engineering', 'Spring 2022', 'graduated', NULL, '2022-01-15', '2026-05-30', '2026-05-15', 2, 1, NOW(), NOW()),
(2, 'UIU-22-000002', 2, 1, '011233-0411', 1, 2, 'Bachelor of Science in Computer Science and Engineering', 'Spring 2022', 'graduated', NULL, '2022-01-15', '2026-05-30', '2026-05-15', 2, 1, NOW(), NOW()),
(3, 'UIU-22-000003', 3, 1, '011223-0442', 1, 3, 'Bachelor of Science in Computer Science and Engineering', 'Spring 2022', 'graduated', NULL, '2022-01-15', '2026-05-30', '2026-05-15', 2, 1, NOW(), NOW()),
(4, 'UIU-26-000004', 1, 1, '011233-0154', 1, 5, 'Master of Science in Computer Science',                  'Fall 2026',   'active',    NULL, '2026-06-01', '2028-06-01', NULL,         2, 5, NOW(), NOW()),
(5, 'UIU-21-000005', 4, 1, '111223-0501', 3, 7, 'Bachelor of Business Administration',                    'Fall 2021',   'withdrawn', NULL, '2021-08-15', '2025-08-15', NULL,         2, 2, NOW(), NOW()),
(6, 'UIU-20-000006', 5, 1, '021223-0502', 2, 6, 'Bachelor of Science in Electrical and Electronic Engineering', 'Spring 2020', 'suspended', 'Academic misconduct investigation pending.', '2020-01-15', '2024-05-30', NULL, 2, 1, NOW(), NOW()),
(7, 'NSU-24-000007', 7, 2, '2410001',     4, 9, 'Bachelor of Science in Computer Science',                'Spring 2024', 'suspended', 'Disciplinary action.', '2024-01-15', '2028-01-15', NULL, 12, 7, NOW(), NOW()),
(8, 'BRAC-23-00001', 3, 3, '2310001',     7, 13,'Bachelor of Science in Computer Science',                'Summer 2023', 'active',    NULL, '2023-05-15', '2027-05-15', NULL,         14,10, NOW(), NOW());

-- ══════════════════════════════════════════
-- CERTIFICATE SEQUENCES
-- ══════════════════════════════════════════
INSERT INTO certificate_sequences (id, sequence_key, prefix, year_suffix, current_sequence, last_generated_at, created_at, updated_at) VALUES
(1, 'BSc-26', 'BSc', '26', 6, NOW(), NOW(), NOW()),
(2, 'MSc-26', 'MSc', '26', 1, NOW(), NOW(), NOW()),
(3, 'BBA-25', 'BBA', '25', 1, NOW(), NOW(), NOW());

-- ══════════════════════════════════════════
-- CERTIFICATES
-- ══════════════════════════════════════════
INSERT INTO certificates (id, student_id, institution_id, enrollment_id, issued_by, serial, certificate_level_id, certificate_level, certificate_name, department_id, department, major_id, major, session, cgpa, degree_class, issue_date, convocation_date, authority_name, authority_title, pdf_path, is_publicly_shareable, revoked_at, revoked_by, revoked_by_role, revocation_reason, revocation_history, issued_name, created_at, updated_at) VALUES
(1, 1, 1, 1, 2, 'BSc-26-000001B', 1, 'Bachelor of Science', 'Bachelor of Science in Computer Science and Engineering', 1, 'Computer Science and Engineering', 1, 'Software Engineering',    'Spring 2022', 3.85, 'First Class',  '2026-05-15', '2026-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', NULL, 1, NULL, NULL, NULL, NULL, NULL, 'Sadid Ahmed',          NOW(), NOW()),
(2, 2, 1, 2, 2, 'BSc-26-000002C', 1, 'Bachelor of Science', 'Bachelor of Science in Computer Science and Engineering', 1, 'Computer Science and Engineering', 2, 'Data Science',             'Spring 2022', 3.92, 'First Class',  '2026-05-15', '2026-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', NULL, 1, NULL, NULL, NULL, NULL, NULL, 'M.M. Sayem Prodhan',   NOW(), NOW()),
(3, 3, 1, 3, 2, 'BSc-26-000003D', 1, 'Bachelor of Science', 'Bachelor of Science in Computer Science and Engineering', 1, 'Computer Science and Engineering', 3, 'Artificial Intelligence',  'Spring 2022', 3.74, 'First Class',  '2026-05-15', '2026-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', NULL, 1, NULL, NULL, NULL, NULL, NULL, 'Assaduzzaman Nur',     NOW(), NOW()),
(4, 1, 1, 1, 2, 'BSc-26-000004E', 1, 'Bachelor of Science', 'Diploma in Advanced Web Development',                    1, 'Computer Science and Engineering', 4, 'Full-Stack Development',  'Fall 2025',   3.90, 'Distinction',  '2025-12-20', '2026-01-15', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', NULL, 0, DATE_SUB(NOW(), INTERVAL 30 DAY), 2, 'university', 'Issued by mistake.', '[{"revoked_at":"2026-05-12","reason":"Issued by mistake."}]', 'Sadid Ahmed',          DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(5, 5, 1, 6, 2, 'BSc-26-000005F', 1, 'Bachelor of Science', 'Bachelor of Science in Electrical and Electronic Engineering', 2, 'Electrical and Electronic Engineering', 6, 'Power Systems', 'Spring 2020', 2.85, 'Second Class', '2024-05-15', '2024-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', NULL, 1, NOW(), 1, 'admin', 'Certificate revoked due to administrative grading error. A corrected certificate will be issued.', NULL, 'Safwan Al Sajid', NOW(), NOW()),
(6, 1, 1, 4, 2, 'MSc-26-000001A', 5, 'Master of Science',   'Master of Science in Computer Science',                  1, 'Computer Science and Engineering', 5, 'Machine Learning',        'Fall 2026',   NULL, NULL,           '2026-05-15', NULL,         'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', NULL, 1, NULL, NULL, NULL, NULL, NULL, 'Sadid Ahmed',          NOW(), NOW());

-- ══════════════════════════════════════════
-- ACCESS REQUESTS
-- ══════════════════════════════════════════
INSERT INTO certificate_access_requests (id, verifier_id, student_id, purpose, status, responded_at, rejection_reason, access_duration_days, created_at, updated_at) VALUES
(1, 1, 3, 'Background academic screening for a Junior Software Engineer position at Enosis Solutions.', 'pending',  NULL, NULL, 30, NOW(), NOW()),
(2, 2, 1, 'Onboarding credential verification for a new hire at Brain Station 23.',                     'approved', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 15, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 3, 2, 'Academic history verification for a project proposal submission.',                           'rejected', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Incorrect student ID was specified in the application. Please resubmit with the correct details.', 10, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 1, 1, 'Secondary verification request for a senior role. Required by compliance team.',             'pending',  NULL, NULL, 30, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 3, 1, 'Verification for external scholarship.',                                                     'approved', DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, 5, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- ══════════════════════════════════════════
-- VERIFIER ACCESS GRANTS
-- ══════════════════════════════════════════
INSERT INTO verifier_access (id, verifier_id, student_id, request_id, granted_at, expires_at, revoked_at, revoked_by, created_at, updated_at) VALUES
(1, 2, 1, 2, DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 13 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 3, 1, 5, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY),  NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)), -- expired
(3, 1, 2, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 4, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)); -- revoked by user 4

-- ══════════════════════════════════════════
-- WITHDRAWAL REQUESTS
-- ══════════════════════════════════════════
INSERT INTO withdrawal_requests (id, enrollment_id, student_id, reason, status, reviewed_by, reviewed_at, rejection_note, created_at, updated_at) VALUES
(1, 5, 4, 'I am relocating abroad for personal reasons and can no longer continue my studies.', 'approved', 2, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 6, 5, 'Financial issues.', 'rejected', 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Please contact financial aid office first.', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 8, 3, 'Transferring to another university.', 'pending', NULL, NULL, NULL, NOW(), NOW());

-- ══════════════════════════════════════════
-- PROFILE CHANGE REQUESTS
-- ══════════════════════════════════════════
INSERT INTO profile_change_requests (id, user_id, field_name, current_value, requested_value, reason, status, reviewed_by, reviewed_at, review_notes, supporting_documents, created_at, updated_at) VALUES
(1, 3, 'phone',   '+8801700001001',   '+8801811112222',    'Switched to a new mobile carrier.', 'pending',  NULL, NULL, NULL, NULL, NOW(), NOW()),
(2, 4, 'address', 'Mohammadpur, Dhaka', 'Mirpur-10, Dhaka', 'Moved to a new apartment.',      'approved', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 5, 'phone',   '+8801700001003',   '+8801922334455',    'Lost my previous SIM card.',       'rejected', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'The provided phone number appears to be invalid. Please verify and resubmit.', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ══════════════════════════════════════════
-- VERIFICATION LOGS
-- ══════════════════════════════════════════
INSERT INTO verification_logs (id, certificate_id, verifier_user_id, serial, entered_date_of_birth, matched_by_dob, verification_result, verified_at, ip_address, user_agent, details, created_at, updated_at) VALUES
(1, 1, 6, 'BSc-26-000001B', '2002-01-01', 1, 'verified',     DATE_SUB(NOW(), INTERVAL 2 DAY),  '127.0.0.1',   'Mozilla/5.0', 'Certificate verified successfully.',              DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 2, 6, 'BSc-26-000002C', '2002-01-01', 1, 'verified',     DATE_SUB(NOW(), INTERVAL 1 DAY),  '127.0.0.1',   'Mozilla/5.0', 'Certificate verified successfully.',              DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 5, 7, 'BSc-26-000005F', '2000-11-20', 1, 'revoked',      NOW(),                             '192.168.1.1', 'Mozilla/5.0', 'Verification failed: Certificate has been revoked.', NOW(), NOW()),
(4, 3, 7, 'BSc-26-000003D', '2002-01-01', 1, 'verified',     DATE_SUB(NOW(), INTERVAL 3 DAY),  '192.168.1.1', 'Mozilla/5.0', 'Certificate verified successfully.',              DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 1, 8, 'BSc-26-000001B', '1999-01-01', 0, 'dob_mismatch', DATE_SUB(NOW(), INTERVAL 1 DAY),  '10.0.0.1',    'Mozilla/5.0', 'Verification failed: Date of birth does not match.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, NULL, NULL, 'BSc-99-INVALID', NULL,   0, 'not_found',    DATE_SUB(NOW(), INTERVAL 1 HOUR), '10.0.0.2',    'Mozilla/5.0', 'Verification failed: Certificate not found.',     DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- ══════════════════════════════════════════
-- ACTIVITY LOGS
-- ══════════════════════════════════════════
INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, description, metadata, ip_address, created_at, updated_at) VALUES
(1,  1, 'user_approved',          'App\\Models\\User',        2,  'Approved university account: United International University.',     '{"role":"university","email":"admin@uiu.ac.bd"}',           '127.0.0.1', DATE_SUB(NOW(), INTERVAL 7 DAY),  DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2,  1, 'user_approved',          'App\\Models\\User',        3,  'Approved student account: Sadid Ahmed.',                            '{"role":"student","email":"ssadidahmed01@gmail.com"}',       '127.0.0.1', DATE_SUB(NOW(), INTERVAL 6 DAY),  DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3,  2, 'enrollment_created',     'App\\Models\\Enrollment',  1,  'Enrolled student Sadid Ahmed in BSc CSE.',                          '{"enrollment_number":"UIU-22-000001"}',                      '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4,  2, 'enrollment_created',     'App\\Models\\Enrollment',  2,  'Enrolled student M.M. Sayem Prodhan in BSc CSE.',                   '{"enrollment_number":"UIU-22-000002"}',                      '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5,  2, 'enrollment_created',     'App\\Models\\Enrollment',  3,  'Enrolled student Assaduzzaman Nur in BSc CSE.',                     '{"enrollment_number":"UIU-22-000003"}',                      '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6,  2, 'certificate_issued',     'App\\Models\\Certificate', 1,  'Issued certificate BSc-26-000001B to Sadid Ahmed.',                 '{"serial":"BSc-26-000001B","level":"Bachelor of Science"}',  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7,  2, 'certificate_issued',     'App\\Models\\Certificate', 2,  'Issued certificate BSc-26-000002C to M.M. Sayem Prodhan.',          '{"serial":"BSc-26-000002C","level":"Bachelor of Science"}',  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(8,  2, 'certificate_issued',     'App\\Models\\Certificate', 3,  'Issued certificate BSc-26-000003D to Assaduzzaman Nur.',            '{"serial":"BSc-26-000003D","level":"Bachelor of Science"}',  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(9,  1, 'certificate_revoked',    'App\\Models\\Certificate', 5,  'Revoked certificate BSc-26-000005F for Safwan Al Sajid.',           '{"serial":"BSc-26-000005F","reason":"Administrative grading error."}', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 3, 'profile_updated',        'App\\Models\\User',        3,  'Student Sadid Ahmed updated their profile.',                        '{"role":"student"}',                                         '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(11, 6, 'access_request_sent',    'App\\Models\\CertificateAccessRequest', 1, 'Enosis Solutions sent an access request to Assaduzzaman Nur.', '{"verifier":"Enosis Solutions"}', '127.0.0.1', NOW(), NOW()),
(12, 3, 'certificate_downloaded', 'App\\Models\\Certificate', 1,  'Student Sadid Ahmed downloaded certificate BSc-26-000001B.',        '{"serial":"BSc-26-000001B"}',                                '127.0.0.1', NOW(),                            NOW()),
(13, 2, 'enrollment_graduated',   'App\\Models\\Enrollment',  1,  'Marked enrollment UIU-22-000001 as graduated.',                     '{"enrollment_number":"UIU-22-000001"}',                      '127.0.0.1', DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(14, 1, 'user_approved',          'App\\Models\\User',        6,  'Approved verifier account: Enosis Solutions.',                      '{"role":"verifier","email":"demo@enosis.com"}',              '127.0.0.1', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(15, 1, 'user_suspended',         'App\\Models\\User',        13, 'Suspended user: suspended.student@gmail.com.',                      '{"reason":"Violated terms of service."}',                    '127.0.0.1', NOW(), NOW());

-- ══════════════════════════════════════════
-- USER SETTINGS
-- ══════════════════════════════════════════
INSERT INTO user_settings (user_id, preferences, profile_visibility, allow_verifier_search, show_email_to_verifiers, show_institution_to_public, created_at, updated_at) VALUES
(1,  '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW()),
(2,  '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW()),
(3,  '{"theme":"light","certificate_default_visibility":"public"}',   'public',         1, 1, 1, NOW(), NOW()),
(4,  '{"theme":"dark","certificate_default_visibility":"private"}',   'private',        0, 0, 0, NOW(), NOW()),
(5,  '{"theme":"light","certificate_default_visibility":"private"}',  'verifiers_only', 1, 0, 1, NOW(), NOW()),
(6,  '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW()),
(7,  '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW()),
(8,  '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW()),
(9,  '{"theme":"light","certificate_default_visibility":"public"}',   'public',         1, 1, 1, NOW(), NOW()),
(10, '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW()),
(12, '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW()),
(13, '{"theme":"light","certificate_default_visibility":"private"}',  'private',        0, 0, 0, NOW(), NOW()),
(14, '{"theme":"light","certificate_default_visibility":"public"}',   'verifiers_only', 1, 0, 1, NOW(), NOW());

-- ══════════════════════════════════════════
-- ENROLLMENT APPLICATIONS
-- ══════════════════════════════════════════
INSERT INTO enrollment_applications (id, student_id, institution_id, certificate_level_id, department_id, batch, reason, document_path, consent_provided, status, university_response, reviewed_by, reviewed_at, created_at, updated_at) VALUES
(1, 6, 1, 1, 1, 'Spring 2026', 'I have always wanted to study at UIU and pursue software engineering.', NULL, 1, 'pending',  NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 4, 1, 4, 3, 'Fall 2026',   'I wish to pursue my MBA here after completing my undergraduate studies.', NULL, 1, 'pending', NULL, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 5, 1, 5, 2, 'Spring 2026', 'I want to continue my higher studies in EEE here.', NULL, 1, 'rejected', 'We regret to inform you that we are not taking new students for this batch.', 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 7, 2, 7, 4, 'Fall 2026',   'Applying to NSU.', NULL, 1, 'approved', 'Welcome to NSU.', 12, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ══════════════════════════════════════════
-- EXTENSION REQUESTS
-- ══════════════════════════════════════════
INSERT INTO extension_requests (id, enrollment_id, student_id, requested_graduation_date, reason, supporting_document_path, status, university_response, counter_offered_date, reviewed_by, reviewed_at, created_at, updated_at) VALUES
(1, 4, 1, '2029-06-01', 'I need an extra semester to complete my thesis research.', NULL, 'pending', NULL, NULL, NULL, NULL, NOW(), NOW()),
(2, 6, 5, '2025-05-30', 'Medical reasons delayed my coursework significantly.', NULL, 'approved', 'Medical documents verified and extension approved.', NULL, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 2, 2, '2027-01-15', 'I have a job offer that requires me to work full-time.', NULL, 'rejected', 'We do not offer extensions for employment reasons.', NULL, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 3, 3, '2027-05-30', 'Taking a gap semester.', NULL, 'counter_offered', 'We can offer an extension until 2026-12-30.', '2026-12-30', 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ══════════════════════════════════════════
-- PROGRAM CHANGE REQUESTS
-- ══════════════════════════════════════════
INSERT INTO program_change_requests (id, enrollment_id, student_id, institution_id, requested_department_id, requested_major_id, reason, status, admin_note, created_at, updated_at) VALUES
(1, 4, 1, 1, 1, 2, 'I realized I am more interested in Data Science than my current major.', 'pending',  NULL, NOW(), NOW()),
(2, 4, 1, 1, 1, 1, 'I want to shift to Software Engineering as it aligns better with my career goals.', 'rejected', 'Your current grades do not meet the criteria for SE major transfer.', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 5, 4, 1, 1, 4, 'Shifting from BBA to Full-Stack Development.', 'approved', 'Change approved.', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 8, 3, 3, 7, 13,'Reverting change.', 'cancelled', 'Student cancelled the request.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ══════════════════════════════════════════
-- NOTIFICATIONS (Laravel standard format)
-- ══════════════════════════════════════════
INSERT INTO notifications (id, type, notifiable_type, notifiable_id, data, read_at, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'App\\Notifications\\CertificateIssued',     'App\\Models\\User', 3, '{"title":"Certificate Issued","message":"Your certificate BSc-26-000001B has been issued by United International University.","serial":"BSc-26-000001B"}', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'App\\Notifications\\AccessRequestApproved', 'App\\Models\\User', 7, '{"title":"Access Request Approved","message":"Brain Station 23 has been granted access to your certificates."}', NOW(), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'App\\Notifications\\AccessRequestReceived', 'App\\Models\\User', 3, '{"title":"New Access Request","message":"Enosis Solutions has requested access to your certificates.","verifier":"Enosis Solutions"}', NULL, NOW(), NOW()),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'App\\Notifications\\CertificateIssued',     'App\\Models\\User', 4, '{"title":"Certificate Issued","message":"Your certificate BSc-26-000002C has been issued by United International University.","serial":"BSc-26-000002C"}', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('e5f6a7b8-c9d0-1234-efab-345678901234', 'App\\Notifications\\UserApproved',          'App\\Models\\User', 2, '{"title":"Account Approved","message":"Your university account has been approved. You can now issue certificates."}', NOW(), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY));

-- ══════════════════════════════════════════
-- PENDING REGISTRATIONS (sample)
-- ══════════════════════════════════════════
INSERT INTO pending_registrations (id, email, user_name, registration_role, code_hash, registration_data, expires_at, verified_at, attempts, created_at, updated_at) VALUES
(1, 'new.applicant@gmail.com', 'New Applicant', 'student', SHA2('verify-code-123', 256), '{"phone":"+8801700002001","first_name":"New","last_name":"Applicant"}', DATE_ADD(NOW(), INTERVAL 1 DAY), NULL, 0, NOW(), NOW());
