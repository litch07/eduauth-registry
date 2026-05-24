-- EduAuth Registry — Seed Data

USE eduauth_registry;

-- Users (pre-verified and admin-approved)
-- Password hashes:
--   admin123   → $2y$12$fRnWpk9tA2pRmFk6rttX0.yJtAK84wmlvkcTJKnmNTbWA5/IxSKSi
--   password123→ $2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm
INSERT INTO users (id, email, password, role, email_verified_at, is_approved, approved_by, approved_at, created_at, updated_at) VALUES
(1,  'eduauthregistry@gmail.com',   '$2y$12$fRnWpk9tA2pRmFk6rttX0.yJtAK84wmlvkcTJKnmNTbWA5/IxSKSi', 'admin',      NOW(), 1, NULL, NOW(), NOW(), NOW()),
(2,  'admin@uiu.ac.bd',             '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'university', NOW(), 1,    1,    NOW(), NOW(), NOW()),
(3,  'ssadidahmed01@gmail.com',     '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NOW(), NOW()),
(4,  'sayem23cse@gmail.com',        '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NOW(), NOW()),
(5,  'mnur223442@bscse.uiu.ac.bd',  '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NOW(), NOW()),
(6,  'demo@enosis.com',             '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'verifier',   NOW(), 1,    1,    NOW(), NOW(), NOW()),
(7,  'demo@brainstation-23.com',    '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'verifier',   NOW(), 1,    1,    NOW(), NOW(), NOW()),
(8,  'ssadidahmed07@gmail.com',     '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'verifier',   NOW(), 1,    1,    NOW(), NOW(), NOW()),
(9,  'rahela.khatun@gmail.com',     '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NOW(), NOW()),
(10, 'tanvir.hossain@gmail.com',    '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 1,    1,    NOW(), NOW(), NOW()),
(11, 'pending.student@gmail.com',   '$2y$12$KQuyd8vLPSkE4EiTxkw/DuS316qiKBbNx80i/mwuRPmOEaKhXxiEm', 'student',    NOW(), 0,    NULL, NULL,  NOW(), NOW());

-- Institution
INSERT INTO institutions (id, user_id, name, registration_number, address, city, phone, website, created_at, updated_at) VALUES
(1, 2, 'United International University', 'UIU-REG-2024-001', 'United City, Madani Avenue, Badda', 'Dhaka', '+8801712345678', 'https://www.uiu.ac.bd', NOW(), NOW());

-- Students
INSERT INTO students (id, user_id, first_name, last_name, nid_hash, date_of_birth, phone, address, student_id, created_at, updated_at) VALUES
(1, 3,  'Sadid',      'Ahmed',   SHA2('NID-010101-001', 256), '2002-01-01', '+8801700001001', 'Mirpur, Dhaka',     '0112330154', NOW(), NOW()),
(2, 4,  'M.M. Sayem', 'Prodhan', SHA2('NID-010101-002', 256), '2002-01-01', '+8801700001002', 'Mohammadpur, Dhaka','0112330411', NOW(), NOW()),
(3, 5,  'Assaduzzaman','Nur',    SHA2('NID-010101-003', 256), '2002-01-01', '+8801700001003', 'Uttara, Dhaka',     '0112230442', NOW(), NOW()),
(4, 9,  'Rahela',     'Khatun',  SHA2('NID-010101-004', 256), '2001-06-15', '+8801700001004', 'Gulshan, Dhaka',    '0112230501', NOW(), NOW()),
(5, 10, 'Tanvir',     'Hossain', SHA2('NID-010101-005', 256), '2000-11-20', '+8801700001005', 'Dhanmondi, Dhaka',  '0112230502', NOW(), NOW()),
(6, 11, 'Pending',    'Student', SHA2('NID-010101-006', 256), '2003-03-10', '+8801700001006', 'Banani, Dhaka',     '0112230999', NOW(), NOW());

-- Verifiers
INSERT INTO verifiers (id, user_id, company_name, contact_person, designation, email, phone, purpose, address, website, created_at, updated_at) VALUES
(1, 6, 'Enosis Solutions',   'HR Department',    'Senior HR Manager', 'demo@enosis.com',          '+8801900000001', 'Background check for software engineering candidates', 'Dhaka, Bangladesh', 'https://enosis.com',          NOW(), NOW()),
(2, 7, 'Brain Station 23',   'Recruitment Team', 'HR Lead',           'demo@brainstation-23.com', '+8801900000002', 'Academic credential verification for new hires',       'Dhaka, Bangladesh', 'https://brainstation-23.com', NOW(), NOW()),
(3, 8, 'PhaseShift Limited', 'Sadid Ahmed',      'Project Manager',   'ssadidahmed07@gmail.com',  '+8801900000003', 'Project audit and team credential verification',       'Dhaka, Bangladesh', NULL,                          NOW(), NOW());

-- Enrollments
INSERT INTO enrollments (id, enrollment_number, student_id, institution_id, program, batch, status, enrollment_date, expected_graduation_date, actual_graduation_date, enrolled_by, created_at, updated_at) VALUES
(1, 'UIU-26-000001', 1, 1, 'Bachelor of Science in Computer Science and Engineering', 'Spring 2026', 'graduated', '2022-01-15', '2026-05-30', '2026-05-15', 2, NOW(), NOW()),
(2, 'UIU-26-000002', 2, 1, 'Bachelor of Science in Computer Science and Engineering', 'Spring 2026', 'graduated', '2022-01-15', '2026-05-30', '2026-05-15', 2, NOW(), NOW()),
(3, 'UIU-26-000003', 3, 1, 'Bachelor of Science in Computer Science and Engineering', 'Spring 2026', 'graduated', '2022-01-15', '2026-05-30', '2026-05-15', 2, NOW(), NOW()),
(4, 'UIU-26-000004', 1, 1, 'Master of Science in Computer Science', 'Fall 2026', 'active', '2026-06-01', '2028-06-01', NULL, 2, NOW(), NOW()),
(5, 'UIU-24-000005', 4, 1, 'Bachelor of Business Administration', 'Fall 2024', 'withdrawn', '2021-08-15', '2025-08-15', NULL, 2, NOW(), NOW()),
(6, 'UIU-24-000006', 5, 1, 'Bachelor of Science in Electrical and Electronic Engineering', 'Spring 2024', 'suspended', '2020-01-15', '2024-05-30', NULL, 2, NOW(), NOW());

-- Certificate Sequences
INSERT INTO certificate_sequences (id, sequence_key, prefix, year_suffix, current_sequence, last_generated_at, created_at, updated_at) VALUES
(1, 'BSC-26', 'BSC', '26', 6, NOW(), NOW(), NOW());

-- Certificates
INSERT INTO certificates (id, student_id, institution_id, enrollment_id, issued_by, serial, certificate_level, certificate_name, department, major, session, cgpa, degree_class, issue_date, convocation_date, authority_name, authority_title, is_publicly_shareable, revoked_at, revoked_by, revocation_reason, created_at, updated_at) VALUES
(1, 1, 1, 1, 2, 'BSC-26-000001B', 'undergraduate', 'Bachelor of Science in Computer Science and Engineering', 'Computer Science and Engineering', 'Software Engineering',  'Spring 2026', 3.85, 'First Class',   '2026-05-15', '2026-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, NULL, NULL, NULL, NOW(), NOW()),
(2, 2, 1, 2, 2, 'BSC-26-000002C', 'undergraduate', 'Bachelor of Science in Computer Science and Engineering', 'Computer Science and Engineering', 'Data Science',          'Spring 2026', 3.92, 'First Class',   '2026-05-15', '2026-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, NULL, NULL, NULL, NOW(), NOW()),
(3, 3, 1, 3, 2, 'BSC-26-000003D', 'undergraduate', 'Bachelor of Science in Computer Science and Engineering', 'Computer Science and Engineering', 'Artificial Intelligence','Spring 2026', 3.74, 'First Class',   '2026-05-15', '2026-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, NULL, NULL, NULL, NOW(), NOW()),
(4, 1, 1, 1, 2, 'BSC-26-000004E', 'undergraduate', 'Diploma in Advanced Web Development',                    'Computer Science and Engineering', 'Full-Stack Development','Fall 2025',   3.90, 'Distinction',   '2025-12-20', '2026-01-15', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 0, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(5, 5, 1, 6, 2, 'BSC-26-000005F', 'undergraduate', 'Bachelor of Science in Electrical and Electronic Engineering', 'Electrical and Electronic Engineering', 'Power Systems','Spring 2024', 2.85, 'Second Class',  '2024-05-15', '2024-05-30', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, NOW(),            1, 'Certificate revoked due to administrative grading error. A corrected certificate will be issued.', NOW(), NOW()),
(6, 1, 1, 4, 2, 'BSC-26-000006G', 'postgraduate',  'Master of Science in Computer Science',                  'Computer Science and Engineering', 'Machine Learning',      'Fall 2028',   NULL, NULL,            '2026-05-15', NULL,         'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, NULL, NULL, NULL, NOW(), NOW());

-- Access Requests
INSERT INTO certificate_access_requests (id, verifier_id, student_id, purpose, status, responded_at, rejection_reason, access_duration_days, created_at, updated_at) VALUES
(1, 1, 3, 'Background academic screening for a Junior Software Engineer position at Enosis Solutions. Please approve so we can verify the submitted credentials.',            'pending',  NULL,                              NULL,                                                    30, NOW(),                            NOW()),
(2, 2, 1, 'Onboarding credential verification for a new hire at Brain Station 23. Verification of academic qualifications is required before contract issuance.',             'approved', DATE_SUB(NOW(), INTERVAL 2 DAY),   NULL,                                                    15, DATE_SUB(NOW(), INTERVAL 3 DAY),   DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 3, 2, 'Academic history verification for a project proposal submission that requires certified academic credentials from all listed team members.',                        'rejected', DATE_SUB(NOW(), INTERVAL 1 DAY),   'Incorrect student ID was specified in the application. Please resubmit with the correct details.', 10, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 1, 1, 'Secondary verification request for a senior role. Required by compliance team before finalizing the offer letter.',                                                 'pending',  NULL,                              NULL,                                                    30, DATE_SUB(NOW(), INTERVAL 1 DAY),   DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Active access grant (from approved request #2)
INSERT INTO verifier_access (id, verifier_id, student_id, request_id, granted_at, expires_at, revoked_at, revoked_by, created_at, updated_at) VALUES
(1, 2, 1, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 13 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Withdrawal Requests
INSERT INTO withdrawal_requests (id, enrollment_id, student_id, reason, status, reviewed_by, reviewed_at, rejection_note, created_at, updated_at) VALUES
(1, 5, 4, 'I am relocating abroad for personal reasons and can no longer continue my studies at this institution.', 'approved', 2, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY));

-- Profile Change Requests
INSERT INTO profile_change_requests (id, user_id, field_name, current_value, requested_value, status, reviewed_by, reviewed_at, review_notes, supporting_documents, created_at, updated_at) VALUES
(1, 3, 'phone',    '+8801700001001', '+8801811112222', 'pending',  NULL, NULL, NULL, NULL, NOW(), NOW()),
(2, 4, 'address',  'Mohammadpur, Dhaka', 'Mirpur-10, Dhaka-1216', 'approved', 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 5, 'phone',    '+8801700001003', '+8801922334455', 'rejected', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'The provided phone number appears to be invalid. Please verify and resubmit.', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Verification Logs
INSERT INTO verification_logs (id, certificate_id, verifier_user_id, serial, entered_date_of_birth, matched_by_dob, verification_result, verified_at, ip_address, user_agent, details, created_at, updated_at) VALUES
(1, 1, 6, 'BSC-26-000001B', '2002-01-01', 1, 'verified', DATE_SUB(NOW(), INTERVAL 2 DAY), '127.0.0.1', 'Mozilla/5.0', 'Certificate verified successfully.', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 2, 6, 'BSC-26-000002C', '2002-01-01', 1, 'verified', DATE_SUB(NOW(), INTERVAL 1 DAY), '127.0.0.1', 'Mozilla/5.0', 'Certificate verified successfully.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 5, 7, 'BSC-26-000005F', '2000-11-20', 1, 'revoked',  NOW(),                            '192.168.1.1', 'Mozilla/5.0', 'Verification failed: Certificate has been revoked.', NOW(), NOW()),
(4, 3, 7, 'BSC-26-000003D', '2002-01-01', 1, 'verified', DATE_SUB(NOW(), INTERVAL 3 DAY), '192.168.1.1', 'Mozilla/5.0', 'Certificate verified successfully.', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 1, 8, 'BSC-26-000001B', '1999-01-01', 0, 'dob_mismatch', DATE_SUB(NOW(), INTERVAL 1 DAY), '10.0.0.1', 'Mozilla/5.0', 'Verification failed: Date of birth does not match.', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Activity Logs
INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, description, metadata, ip_address, created_at, updated_at) VALUES
(1,  1, 'user_approved',         'App\\Models\\User',        2, 'Approved university account: United International University.',          '{"role":"university","email":"admin@uiu.ac.bd"}',        '127.0.0.1', DATE_SUB(NOW(), INTERVAL 7 DAY),  DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2,  1, 'user_approved',         'App\\Models\\User',        3, 'Approved student account: Sadid Ahmed.',                                 '{"role":"student","email":"ssadidahmed01@gmail.com"}',   '127.0.0.1', DATE_SUB(NOW(), INTERVAL 6 DAY),  DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3,  2, 'enrollment_created',    'App\\Models\\Enrollment',  1, 'Enrolled student Sadid Ahmed in BSc CSE — Spring 2026.',                 '{"enrollment_number":"UIU-26-000001"}',                  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4,  2, 'enrollment_created',    'App\\Models\\Enrollment',  2, 'Enrolled student M.M. Sayem Prodhan in BSc CSE — Spring 2026.',          '{"enrollment_number":"UIU-26-000002"}',                  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5,  2, 'enrollment_created',    'App\\Models\\Enrollment',  3, 'Enrolled student Assaduzzaman Nur in BSc CSE — Spring 2026.',            '{"enrollment_number":"UIU-26-000003"}',                  '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6,  2, 'certificate_issued',    'App\\Models\\Certificate', 1, 'Issued certificate BSC-26-000001B to Sadid Ahmed.',                       '{"serial":"BSC-26-000001B","level":"undergraduate"}',     '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7,  2, 'certificate_issued',    'App\\Models\\Certificate', 2, 'Issued certificate BSC-26-000002C to M.M. Sayem Prodhan.',                '{"serial":"BSC-26-000002C","level":"undergraduate"}',     '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(8,  2, 'certificate_issued',    'App\\Models\\Certificate', 3, 'Issued certificate BSC-26-000003D to Assaduzzaman Nur.',                  '{"serial":"BSC-26-000003D","level":"undergraduate"}',     '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(9,  1, 'certificate_revoked',   'App\\Models\\Certificate', 5, 'Revoked certificate BSC-26-000005F for Tanvir Hossain.',                  '{"serial":"BSC-26-000005F","reason":"Administrative grading error."}', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 3, 'profile_updated',       'App\\Models\\User',        3, 'Student Sadid Ahmed updated their profile.',                             '{"role":"student"}',                                     '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(11, 6, 'access_request_sent',   'App\\Models\\CertificateAccessRequest', 1, 'Enosis Solutions sent an access request to Assaduzzaman Nur.',  '{"verifier":"Enosis Solutions"}',                  '127.0.0.1', NOW(),                            NOW()),
(12, 3, 'certificate_downloaded','App\\Models\\Certificate', 1, 'Student Sadid Ahmed downloaded certificate BSC-26-000001B.',              '{"serial":"BSC-26-000001B"}',                             '127.0.0.1', NOW(),                            NOW());

-- User Settings (defaults for all approved users)
INSERT INTO user_settings (user_id, preferences, created_at, updated_at) VALUES
(2,  '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(3,  '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(4,  '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(5,  '{"default_certificate_visibility": "private", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(6,  '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(7,  '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(8,  '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(9,  '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW()),
(10, '{"default_certificate_visibility": "public", "notify_access_request": true, "notify_certificate_issued": true, "notify_access_approved": true, "notify_access_rejected": true, "notify_profile_change": true}', NOW(), NOW());
