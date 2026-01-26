-- Demo data for EduAuth Registry
-- Run this after schema.sql to populate test data.
-- Admin account is created in schema.sql.

USE eduauth_registry;

SET FOREIGN_KEY_CHECKS=0;
DELETE FROM ActivityLog;
DELETE FROM VerificationLog;
DELETE FROM VerifierVerificationHistory;
DELETE FROM VerifierAccess;
DELETE FROM CertificateRequests;
DELETE FROM Certificate;
DELETE FROM Enrollment;
DELETE FROM Verifiers;
DELETE FROM Institution;
DELETE FROM Student;
DELETE FROM Users;
DELETE FROM CertificateSequence;
SET FOREIGN_KEY_CHECKS=1;

-- Password for all demo users: password123
SET @password_hash = '$2b$12$k1kaBxaPoqp4Ha3CpjZzWehZGhj4mrW6Lp2DQb81FjajK1eO0ULh6';

-- Admin id created by schema.sql (password: admin123)
SET @admin_id = (SELECT id FROM Admins WHERE email = 'eduauthregistry@gmail.com' LIMIT 1);

-- 1) Demo student accounts
SET @student1_user_id = UUID();
SET @student1_id = UUID();
SET @student2_user_id = UUID();
SET @student2_id = UUID();
SET @student3_user_id = UUID();
SET @student3_id = UUID();

INSERT INTO Users (id, email, password, role, emailVerified) VALUES
(@student1_user_id, 'ssadidahmed01@gmail.com', @password_hash, 'STUDENT', 1),
(@student2_user_id, 'sayem23cse@gmail.com', @password_hash, 'STUDENT', 1),
(@student3_user_id, 'mhossain2330996@bscse.uiu.ac.bd', @password_hash, 'STUDENT', 1);

INSERT INTO Student (
    id, userId, firstName, middleName, lastName, dateOfBirth,
    nid, fatherName, motherName, phone, presentAddress, studentId, isApproved,
    approvedAt, approvedBy, rejectionReason
) VALUES
(
    @student1_id, @student1_user_id, 'Sadid', NULL, 'Ahmed', '2001-01-15',
    '1000000001', 'Default Father', 'Default Mother', '01700000001',
    'Dhaka, Bangladesh', '0112330154', 1, NOW(), @admin_id, NULL
),
(
    @student2_id, @student2_user_id, 'M. M.', 'Sayem', 'Prodhan', '2001-02-10',
    '1000000002', 'Default Father', 'Default Mother', '01700000002',
    'Dhaka, Bangladesh', '0112330411', 1, NOW(), @admin_id, NULL
),
(
    @student3_id, @student3_user_id, 'Rayhan', NULL, 'Hossain', '2001-03-20',
    '1000000003', 'Default Father', 'Default Mother', '01700000003',
    'Dhaka, Bangladesh', '0112330996', 1, NOW(), @admin_id, NULL
);

-- 2) Demo university accounts
SET @uni1_user_id = UUID();
SET @uni1_id = UUID();
SET @uni2_user_id = UUID();
SET @uni2_id = UUID();

INSERT INTO Users (id, email, password, role, emailVerified) VALUES
(@uni1_user_id, 'demo@uiu.ac.bd', @password_hash, 'UNIVERSITY', 1),
(@uni2_user_id, 'registry@green.edu.bd', @password_hash, 'UNIVERSITY', 1);

INSERT INTO Institution (
    id, userId, name, registrationNumber, establishedYear, phone, address,
    website, authorityName, authorityTitle, isApproved, approvedAt, approvedBy, rejectionReason
) VALUES
(
    @uni1_id, @uni1_user_id, 'United International University', 'UIU-2003-REG',
    2003, '09604 848848', 'United City, Madani Ave, Dhaka 1212',
    'https://www.uiu.ac.bd/', 'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, NOW(), @admin_id, NULL
),
(
    @uni2_id, @uni2_user_id, 'Green University of Bangladesh', 'GUB-2003-REG',
    2003, '02-55000000', '220/D Begum Rokeya Sarani, Dhaka 1207',
    'https://green.edu.bd', 'Prof. Dr. Abdul Mannan', 'Vice Chancellor', 1, NOW(), @admin_id, NULL
);

-- 3) Demo verifier accounts
SET @verifier1_user_id = UUID();
SET @verifier1_id = UUID();
SET @verifier2_user_id = UUID();
SET @verifier2_id = UUID();

INSERT INTO Users (id, email, password, role, emailVerified) VALUES
(@verifier1_user_id, 'ssadidahmed07@gmail.com', @password_hash, 'VERIFIER', 1),
(@verifier2_user_id, 'ssadidahmed03@gmai.com', @password_hash, 'VERIFIER', 1);

INSERT INTO Verifiers (
    id, userId, companyName, companyRegistration, website, contactPhone,
    purpose, isApproved, approvedAt, approvedBy
) VALUES
(
    @verifier1_id, @verifier1_user_id, 'Enoisis', 'ENO-REG-2024-01',
    'https://enoisis.example.com', '01711112222', 'Employment', 1,
    DATE_SUB(NOW(), INTERVAL 5 DAY), @admin_id
),
(
    @verifier2_id, @verifier2_user_id, 'Tesla', 'TESLA-REG-2024-02',
    'https://www.tesla.com', '01733334444', 'Background Check', 1,
    DATE_SUB(NOW(), INTERVAL 3 DAY), @admin_id
);

-- 4) Demo enrollments
SET @enrollment1_id = UUID();
SET @enrollment2_id = UUID();
SET @enrollment3_id = UUID();

INSERT INTO Enrollment (
    id, studentId, institutionId, studentInstitutionId, enrollmentDate,
    department, session, IDNumber
) VALUES
(
    @enrollment1_id, @student1_id, @uni1_id, '0112330154', '2020-02-01',
    'Computer Science and Engineering', '2020-2024', 'CSE-2020-0154'
),
(
    @enrollment2_id, @student2_id, @uni1_id, '0112330411', '2020-02-01',
    'Computer Science and Engineering', '2020-2024', 'CSE-2020-0411'
),
(
    @enrollment3_id, @student3_id, @uni2_id, '0112330996', '2020-02-10',
    'Business Administration', '2020-2024', 'BBA-2020-0996'
);

-- 5) Certificate sequence
INSERT INTO CertificateSequence (id, lastSequence) VALUES (1, 3)
ON DUPLICATE KEY UPDATE lastSequence = VALUES(lastSequence);

-- 6) Demo certificates (one per student)
SET @cert1_id = UUID();
SET @cert2_id = UUID();
SET @cert3_id = UUID();

INSERT INTO Certificate (
    id, serial, sequenceNumber, certificateLevel, certificateName,
    studentId, institutionId, department, major, session, IDNumber,
    cgpa, degreeClass, issueDate, convocationDate, authorityName, authorityTitle,
    isPubliclyShareable, createdAt
) VALUES
(
    @cert1_id, 'BSC-25-0000011', 1, 'BACHELOR', 'Bachelor of Science in Computer Science',
    @student1_id, @uni1_id, 'Computer Science and Engineering', 'Software Engineering',
    '2020-2024', 'CSE-2020-0154', 3.75, 'First Class', '2024-06-15', '2024-07-20',
    'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, NOW()
),
(
    @cert2_id, 'BSC-25-0000022', 2, 'BACHELOR', 'Bachelor of Science in Computer Science',
    @student2_id, @uni1_id, 'Computer Science and Engineering', 'Artificial Intelligence',
    '2020-2024', 'CSE-2020-0411', 3.68, 'First Class', CURDATE(), '2024-07-20',
    'Prof. Dr. Md. Abul Kashem Mia', 'Vice Chancellor', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)
),
(
    @cert3_id, 'MSC-25-0000033', 3, 'MASTER', 'Master of Business Administration',
    @student3_id, @uni2_id, 'Business Administration', 'Finance',
    '2020-2024', 'BBA-2020-0996', 3.55, 'First Class', '2024-07-10', '2024-08-20',
    'Prof. Dr. Abdul Mannan', 'Vice Chancellor', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)
);

-- 7) Demo certificate requests
SET @request1_id = UUID();
SET @request2_id = UUID();

INSERT INTO CertificateRequests (
    id, requestType, verifierId, studentId, certificateId,
    purpose, reason, status, expiresAt, approvedAt, createdAt
) VALUES
(
    @request1_id, 'ALL_CERTIFICATES', @verifier2_id, @student3_id, NULL,
    'Employment', 'Need access for background verification.',
    'PENDING', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, NOW()
),
(
    @request2_id, 'SINGLE_CERTIFICATE', @verifier1_id, @student2_id, @cert2_id,
    'Employment', 'Candidate background check for hiring.',
    'APPROVED', DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 7 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
);

-- 8) Demo verifier access
SET @access1_id = UUID();

INSERT INTO VerifierAccess (
    id, requestId, verifierId, studentId, certificateId,
    grantedAt, expiresAt, createdAt
) VALUES (
    @access1_id, @request2_id, @verifier1_id, @student2_id, @cert2_id,
    DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 29 DAY), NOW()
);

-- 9) Demo verifier verification history
SET @history1_id = UUID();
SET @history2_id = UUID();

INSERT INTO VerifierVerificationHistory (id, verifierId, certificateId, verifiedAt) VALUES
(@history1_id, @verifier1_id, @cert1_id, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@history2_id, @verifier2_id, @cert3_id, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 10) Demo verification log
SET @log1_id = UUID();
SET @log2_id = UUID();
SET @log3_id = UUID();

INSERT INTO VerificationLog (
    id, certificateId, verifierIP, verifierCountry, verifierUserAgent, verifiedAt
) VALUES
(
    @log1_id, @cert1_id, '203.0.113.10', 'Bangladesh',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 3 DAY)
),
(
    @log2_id, @cert2_id, '203.0.113.11', 'Bangladesh',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW()
),
(
    @log3_id, @cert3_id, '198.51.100.5', 'India',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', DATE_SUB(NOW(), INTERVAL 2 DAY)
);

-- 11) Demo activity log
SET @activity1_id = UUID();
SET @activity2_id = UUID();
SET @activity3_id = UUID();
SET @activity4_id = UUID();

INSERT INTO ActivityLog (
    id, actorId, actorType, action, targetType, targetId, details, ipAddress
) VALUES
(
    @activity1_id, @admin_id, 'ADMIN', 'VERIFIER_APPROVED', 'VERIFIER',
    @verifier1_id, '{"note":"Seed approval"}', '127.0.0.1'
),
(
    @activity2_id, @uni1_user_id, 'UNIVERSITY', 'CERTIFICATE_ISSUED', 'CERTIFICATE',
    @cert1_id, '{"note":"Issued for Sadid"}', '127.0.0.1'
),
(
    @activity3_id, @student2_user_id, 'STUDENT', 'REQUEST_APPROVED', 'CERTIFICATE_REQUEST',
    @request2_id, '{"note":"Approved verifier request"}', '127.0.0.1'
),
(
    @activity4_id, @uni2_user_id, 'UNIVERSITY', 'CERTIFICATE_ISSUED', 'CERTIFICATE',
    @cert3_id, '{"note":"Issued for Rayhan"}', '127.0.0.1'
);

SELECT 'Seed data inserted successfully.' AS status;
SELECT 'Admin: eduauthregistry@gmail.com / admin123' AS admin_credentials;
SELECT 'Student 1 (Sadid): ssadidahmed01@gmail.com / password123' AS student1_credentials;
SELECT 'Student 2 (Sayem): sayem23cse@gmail.com / password123' AS student2_credentials;
SELECT 'Student 3 (Rayhan): mhossain2330996@bscse.uiu.ac.bd / password123' AS student3_credentials;
SELECT 'University 1: demo@uiu.ac.bd / password123' AS university1_credentials;
SELECT 'University 2: registry@green.edu.bd / password123' AS university2_credentials;
SELECT 'Verifier 1 (Enoisis): ssadidahmed07@gmail.com / password123' AS verifier1_credentials;
SELECT 'Verifier 2 (Tesla): ssadidahmed03@gmai.com / password123' AS verifier2_credentials;
