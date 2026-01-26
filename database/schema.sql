-- Create database if not exists
CREATE DATABASE IF NOT EXISTS eduauth_registry
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Use the database
USE eduauth_registry;

SET FOREIGN_KEY_CHECKS=0;

-- Drop existing views
DROP VIEW IF EXISTS vw_system_stats;
DROP VIEW IF EXISTS vw_active_enrollments;
DROP VIEW IF EXISTS vw_verification_stats;
DROP VIEW IF EXISTS vw_university_dashboard;
DROP VIEW IF EXISTS vw_student_dashboard;
DROP VIEW IF EXISTS vw_certificates_full;

-- Drop existing tables
DROP TABLE IF EXISTS ActivityLog;
DROP TABLE IF EXISTS VerificationLog;
DROP TABLE IF EXISTS EmailChangeRequests;
DROP TABLE IF EXISTS PasswordResetTokens;
DROP TABLE IF EXISTS EmailVerificationCodes;
DROP TABLE IF EXISTS Certificate;
DROP TABLE IF EXISTS CertificateSequence;
DROP TABLE IF EXISTS Enrollment;
DROP TABLE IF EXISTS Institution;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Admins;

SET FOREIGN_KEY_CHECKS=1;

-- Table: Admins
CREATE TABLE Admins (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email)
);

-- Insert default admin (email: eduauthregistry@gmail.com, password: admin123)
INSERT INTO Admins (id, email, password, name) VALUES (
    UUID(),
    'eduauthregistry@gmail.com',
    '$2b$12$yqSQAkFYrLQenf3p0B7v6OadpgX1mfwyc06tDMdI1Ehn.XZoUbvry',
    'System Administrator'
) ON DUPLICATE KEY UPDATE email=email;

-- Table: Users
CREATE TABLE Users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'UNIVERSITY', 'VERIFIER') NOT NULL,
    emailVerified BOOLEAN DEFAULT FALSE,
    deletedAt DATETIME DEFAULT NULL,
    deletedBy CHAR(36) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_deleted (deletedAt),
    FOREIGN KEY (deletedBy) REFERENCES Admins(id) ON DELETE SET NULL
);

-- Table: Student
CREATE TABLE Student (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) UNIQUE NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    middleName VARCHAR(255),
    lastName VARCHAR(255) NOT NULL,
    dateOfBirth DATE NOT NULL,
    nid VARCHAR(20),
    fatherName VARCHAR(255) NOT NULL,
    motherName VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    presentAddress TEXT NOT NULL,
    studentId VARCHAR(64) UNIQUE NOT NULL,
    isApproved BOOLEAN DEFAULT FALSE,
    approvedAt DATETIME,
    approvedBy CHAR(36),
    rejectionReason TEXT,
    deletedAt DATETIME DEFAULT NULL,
    deletedBy CHAR(36) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_student_user FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_student_approved_by FOREIGN KEY (approvedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    CONSTRAINT fk_student_deleted_by FOREIGN KEY (deletedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    
    INDEX idx_nid (nid),
    INDEX idx_student_id (studentId),
    INDEX idx_approved (isApproved),
    INDEX idx_deleted (deletedAt)
);

-- Table: Institution
CREATE TABLE Institution (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    registrationNumber VARCHAR(100) UNIQUE NOT NULL,
    establishedYear INT,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    website VARCHAR(255),
    authorityName VARCHAR(255) NOT NULL,
    authorityTitle VARCHAR(100) DEFAULT 'Vice Chancellor',
    isApproved BOOLEAN DEFAULT FALSE,
    approvedAt DATETIME,
    approvedBy CHAR(36),
    rejectionReason TEXT,
    deletedAt DATETIME DEFAULT NULL,
    deletedBy CHAR(36) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_institution_user FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_institution_approved_by FOREIGN KEY (approvedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    CONSTRAINT fk_institution_deleted_by FOREIGN KEY (deletedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    
    INDEX idx_reg_number (registrationNumber),
    INDEX idx_approved (isApproved),
    INDEX idx_deleted (deletedAt)
);

-- Table: Verifiers
CREATE TABLE Verifiers (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) UNIQUE NOT NULL,
    companyName VARCHAR(255) NOT NULL,
    companyRegistration VARCHAR(100),
    website VARCHAR(255),
    purpose VARCHAR(100) NOT NULL,
    contactPhone VARCHAR(20) NOT NULL,
    isApproved BOOLEAN DEFAULT FALSE,
    approvedAt DATETIME,
    approvedBy CHAR(36),
    rejectionReason TEXT,
    deletedAt DATETIME DEFAULT NULL,
    deletedBy CHAR(36) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_verifier_user FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_verifier_admin FOREIGN KEY (approvedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    CONSTRAINT fk_verifier_deleted_by FOREIGN KEY (deletedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    
    INDEX idx_company (companyName),
    INDEX idx_approved (isApproved),
    INDEX idx_deleted (deletedAt)
);

-- Table: EmailVerificationCodes
CREATE TABLE EmailVerificationCodes (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    code CHAR(6) NOT NULL,
    expiresAt DATETIME NOT NULL,
    isUsed BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_code (userId, code),
    INDEX idx_expires (expiresAt)
);

-- Table: PasswordResetTokens
CREATE TABLE PasswordResetTokens (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    token CHAR(64) NOT NULL,
    expiresAt DATETIME NOT NULL,
    isUsed BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expiresAt)
);

-- Table: EmailChangeRequests
CREATE TABLE EmailChangeRequests (
    id CHAR(36) PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    newEmail VARCHAR(255) NOT NULL,
    verificationCode CHAR(6) NOT NULL,
    expiresAt DATETIME NOT NULL,
    isUsed BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_expires (expiresAt)
);

-- Table: Enrollment
CREATE TABLE Enrollment (
    id CHAR(36) PRIMARY KEY,
    studentId CHAR(36) NOT NULL,
    institutionId CHAR(36) NOT NULL,
    studentInstitutionId VARCHAR(100) NOT NULL,
    enrollmentDate DATE NOT NULL,
    department VARCHAR(255) NOT NULL,
    session VARCHAR(50),
    IDNumber VARCHAR(100),
    deletedAt DATETIME DEFAULT NULL,
    deletedBy CHAR(36) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_enrollment_student FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_institution FOREIGN KEY (institutionId) REFERENCES Institution(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_deleted_by FOREIGN KEY (deletedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    CONSTRAINT uq_enrollment UNIQUE (studentId, institutionId),
    
    INDEX idx_institution (institutionId),
    INDEX idx_student (studentId),
    INDEX idx_deleted (deletedAt)
);

-- Table: CertificateSequence
CREATE TABLE CertificateSequence (
    id INT PRIMARY KEY,
    lastSequence BIGINT DEFAULT 0,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_sequence_id CHECK (id = 1)
);

-- Table: Certificate
CREATE TABLE Certificate (
    id CHAR(36) PRIMARY KEY,
    serial VARCHAR(20) UNIQUE NOT NULL,
    sequenceNumber BIGINT NOT NULL,
    certificateLevel ENUM('BACHELOR', 'MASTER', 'DOCTORATE') NOT NULL,
    certificateName VARCHAR(255) NOT NULL,
    studentId CHAR(36) NOT NULL,
    institutionId CHAR(36) NOT NULL,
    department VARCHAR(255) NOT NULL,
    major VARCHAR(255),
    session VARCHAR(50),
    IDNumber VARCHAR(100),
    cgpa DECIMAL(3,2),
    degreeClass VARCHAR(100),
    issueDate DATE NOT NULL,
    convocationDate DATE,
    authorityName VARCHAR(255) NOT NULL,
    authorityTitle VARCHAR(100) NOT NULL,
    isPubliclyShareable BOOLEAN DEFAULT TRUE,
    deletedAt DATETIME DEFAULT NULL,
    deletedBy CHAR(36) DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_certificate_student FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE RESTRICT,
    CONSTRAINT fk_certificate_institution FOREIGN KEY (institutionId) REFERENCES Institution(id) ON DELETE RESTRICT,
    CONSTRAINT fk_certificate_deleted_by FOREIGN KEY (deletedBy) REFERENCES Admins(id) ON DELETE SET NULL,
    CONSTRAINT chk_cgpa CHECK (cgpa >= 0 AND cgpa <= 4.0),
    
    UNIQUE INDEX idx_serial (serial),
    INDEX idx_student (studentId),
    INDEX idx_institution_date (institutionId, issueDate DESC),
    INDEX idx_deleted (deletedAt)
);

-- Table: CertificateRequests
CREATE TABLE CertificateRequests (
    id CHAR(36) PRIMARY KEY,
    requestType ENUM('ALL_CERTIFICATES', 'SINGLE_CERTIFICATE') NOT NULL,
    verifierId CHAR(36) NOT NULL,
    studentId CHAR(36) NOT NULL,
    certificateId CHAR(36),
    purpose VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
    expiresAt DATETIME NOT NULL,
    approvedAt DATETIME,
    rejectedAt DATETIME,
    rejectionReason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_request_verifier FOREIGN KEY (verifierId) REFERENCES Verifiers(id) ON DELETE CASCADE,
    CONSTRAINT fk_request_student FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
    CONSTRAINT fk_request_certificate FOREIGN KEY (certificateId) REFERENCES Certificate(id) ON DELETE CASCADE,
    
    INDEX idx_verifier (verifierId),
    INDEX idx_student (studentId),
    INDEX idx_status (status),
    INDEX idx_expires (expiresAt)
);

-- Table: VerifierAccess
CREATE TABLE VerifierAccess (
    id CHAR(36) PRIMARY KEY,
    requestId CHAR(36) NOT NULL,
    verifierId CHAR(36) NOT NULL,
    studentId CHAR(36) NOT NULL,
    certificateId CHAR(36),
    grantedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    revokedAt DATETIME,
    revokedReason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_access_request FOREIGN KEY (requestId) REFERENCES CertificateRequests(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_verifier FOREIGN KEY (verifierId) REFERENCES Verifiers(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_student FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_certificate FOREIGN KEY (certificateId) REFERENCES Certificate(id) ON DELETE CASCADE,
    
    INDEX idx_verifier_active (verifierId, expiresAt),
    INDEX idx_student (studentId)
);

-- Table: VerifierVerificationHistory
CREATE TABLE VerifierVerificationHistory (
    id CHAR(36) PRIMARY KEY,
    verifierId CHAR(36) NOT NULL,
    certificateId CHAR(36) NOT NULL,
    verifiedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (verifierId) REFERENCES Verifiers(id) ON DELETE CASCADE,
    FOREIGN KEY (certificateId) REFERENCES Certificate(id) ON DELETE CASCADE,
    
    INDEX idx_verifier_date (verifierId, verifiedAt DESC),
    INDEX idx_certificate (certificateId)
);

-- Table: VerificationLog
CREATE TABLE VerificationLog (
    id CHAR(36) PRIMARY KEY,
    certificateId CHAR(36) NOT NULL,
    verifierIP VARCHAR(64),
    verifierCountry VARCHAR(100),
    verifierUserAgent TEXT,
    verifiedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_verification_certificate FOREIGN KEY (certificateId) REFERENCES Certificate(id) ON DELETE CASCADE,
    
    INDEX idx_certificate (certificateId),
    INDEX idx_verified_at (verifiedAt)
);

-- Table: ActivityLog
CREATE TABLE ActivityLog (
    id CHAR(36) PRIMARY KEY,
    actorId CHAR(36),
    actorType ENUM('STUDENT', 'UNIVERSITY', 'ADMIN', 'SYSTEM') NOT NULL,
    action VARCHAR(100) NOT NULL,
    targetType VARCHAR(50),
    targetId CHAR(36),
    details TEXT,
    ipAddress VARCHAR(64),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_actor (actorId),
    INDEX idx_action (action),
    INDEX idx_created_at (createdAt)
);

-- View: vw_certificates_full

DROP VIEW IF EXISTS vw_certificates_full;

CREATE VIEW vw_certificates_full AS
SELECT 
    c.id,
    c.serial,
    c.certificateLevel,
    c.certificateName,
    c.department,
    c.major,
    c.session,
    c.IDNumber,
    c.cgpa,
    c.degreeClass,
    c.issueDate,
    c.convocationDate,
    c.authorityName,
    c.authorityTitle,
    c.isPubliclyShareable,
    
    s.id AS studentId,
    CONCAT(s.firstName, ' ', IFNULL(CONCAT(s.middleName, ' '), ''), s.lastName) AS studentFullName,
    s.dateOfBirth AS studentDOB,
    s.studentId AS studentSystemId,
    
    i.id AS institutionId,
    i.name AS institutionName,
    i.registrationNumber AS institutionRegistration,
    
    e.studentInstitutionId AS rollNumber,
    
    c.createdAt,
    c.updatedAt
FROM Certificate c
INNER JOIN Student s ON c.studentId = s.id
INNER JOIN Institution i ON c.institutionId = i.id
LEFT JOIN Enrollment e ON e.studentId = s.id AND e.institutionId = i.id AND e.deletedAt IS NULL
WHERE c.deletedAt IS NULL 
  AND s.deletedAt IS NULL 
  AND i.deletedAt IS NULL;

-- View: vw_student_dashboard

DROP VIEW IF EXISTS vw_student_dashboard;

CREATE VIEW vw_student_dashboard AS
SELECT 
    s.id AS studentId,
    s.userId,
    CONCAT(s.firstName, ' ', s.lastName) AS studentName,
    
    (SELECT COUNT(*) 
     FROM Enrollment e 
     WHERE e.studentId = s.id AND e.deletedAt IS NULL) AS totalEnrollments,
    
    (SELECT COUNT(*) 
     FROM Certificate c 
     WHERE c.studentId = s.id AND c.deletedAt IS NULL) AS totalCertificates,
    
    (SELECT COUNT(*) 
     FROM CertificateRequests cr 
     WHERE cr.studentId = s.id AND cr.status = 'PENDING') AS pendingRequests
FROM Student s
WHERE s.deletedAt IS NULL;

-- View: vw_university_dashboard

DROP VIEW IF EXISTS vw_university_dashboard;

CREATE VIEW vw_university_dashboard AS
SELECT 
    i.id AS institutionId,
    i.userId,
    i.name AS universityName,
    
    (SELECT COUNT(*) 
     FROM Enrollment e 
     WHERE e.institutionId = i.id AND e.deletedAt IS NULL) AS totalStudents,
    
    (SELECT COUNT(*) 
     FROM Certificate c 
     WHERE c.institutionId = i.id AND c.deletedAt IS NULL) AS totalCertificates,
    
    (SELECT COUNT(*) 
     FROM Certificate c 
     WHERE c.institutionId = i.id 
       AND c.deletedAt IS NULL 
       AND DATE(c.issueDate) = CURDATE()) AS todayCertificates
FROM Institution i
WHERE i.deletedAt IS NULL;

-- View: vw_verification_stats

DROP VIEW IF EXISTS vw_verification_stats;

CREATE VIEW vw_verification_stats AS
SELECT 
    c.id AS certificateId,
    c.serial,
    c.certificateName,
    c.certificateLevel,
    i.name AS institutionName,
    
    COUNT(v.id) AS totalVerifications,
    COUNT(DISTINCT v.verifierCountry) AS uniqueCountries,
    MAX(v.verifiedAt) AS lastVerifiedAt,
    
    SUM(CASE WHEN DATE(v.verifiedAt) = CURDATE() THEN 1 ELSE 0 END) AS todayVerifications
FROM Certificate c
LEFT JOIN VerificationLog v ON c.id = v.certificateId
INNER JOIN Institution i ON c.institutionId = i.id
WHERE c.deletedAt IS NULL AND i.deletedAt IS NULL
GROUP BY c.id, c.serial, c.certificateName, c.certificateLevel, i.name;

-- View: vw_active_enrollments

DROP VIEW IF EXISTS vw_active_enrollments;

CREATE VIEW vw_active_enrollments AS
SELECT 
    e.id AS enrollmentId,
    e.studentInstitutionId,
    e.enrollmentDate,
    e.department,
    e.session,
    
    s.id AS studentId,
    CONCAT(s.firstName, ' ', s.lastName) AS studentName,
    s.studentId AS studentSystemId,
    
    u.email AS studentEmail,
    
    i.id AS institutionId,
    i.name AS institutionName,
    
    (SELECT COUNT(*) 
     FROM Certificate c 
     WHERE c.studentId = s.id 
       AND c.institutionId = i.id 
       AND c.deletedAt IS NULL) AS certificatesIssued
FROM Enrollment e
INNER JOIN Student s ON e.studentId = s.id
INNER JOIN Users u ON s.userId = u.id
INNER JOIN Institution i ON e.institutionId = i.id
WHERE s.deletedAt IS NULL AND i.deletedAt IS NULL;

-- View: vw_system_stats

DROP VIEW IF EXISTS vw_system_stats;

CREATE VIEW vw_system_stats AS
SELECT 
    (SELECT COUNT(*) FROM Users WHERE role = 'STUDENT' AND deletedAt IS NULL) AS totalStudents,
    (SELECT COUNT(*) FROM Users WHERE role = 'UNIVERSITY' AND deletedAt IS NULL) AS totalUniversities,
    (SELECT COUNT(*) FROM Users WHERE role = 'VERIFIER' AND deletedAt IS NULL) AS totalVerifiers,
    
    (SELECT COUNT(*) FROM Certificate WHERE deletedAt IS NULL) AS totalCertificates,
    (SELECT COUNT(*) FROM Certificate WHERE deletedAt IS NULL AND DATE(issueDate) = CURDATE()) AS todayCertificates,
    
    (SELECT COUNT(*) FROM VerificationLog WHERE DATE(verifiedAt) = CURDATE()) AS todayVerifications,
    (SELECT COUNT(*) FROM VerificationLog) AS totalVerifications,
    
    (SELECT COUNT(*) FROM CertificateRequests WHERE status = 'PENDING') AS pendingCertRequests,
    (SELECT COUNT(*) FROM Verifiers WHERE isApproved = FALSE AND rejectionReason IS NULL) AS pendingVerifiers,
    (
      (SELECT COUNT(*) FROM Student s
       JOIN Users u ON s.userId = u.id
       WHERE s.isApproved = FALSE AND s.deletedAt IS NULL AND u.emailVerified = TRUE AND u.deletedAt IS NULL)
      +
      (SELECT COUNT(*) FROM Institution i
       JOIN Users u ON i.userId = u.id
       WHERE i.isApproved = FALSE AND i.deletedAt IS NULL AND u.emailVerified = TRUE AND u.deletedAt IS NULL)
      +
      (SELECT COUNT(*) FROM Verifiers v
       JOIN Users u ON v.userId = u.id
       WHERE v.isApproved = FALSE AND v.deletedAt IS NULL AND u.emailVerified = TRUE AND u.deletedAt IS NULL)
    ) AS pendingApprovals,
    
    (SELECT COUNT(*) FROM Users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS newUsersThisWeek;

