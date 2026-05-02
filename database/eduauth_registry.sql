CREATE DATABASE IF NOT EXISTS eduauth_registry;
USE eduauth_registry;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','university','verifier','admin') NOT NULL,
  email_verified_at TIMESTAMP NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  approved_by BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_users_role_approved (role, is_approved),
  INDEX idx_users_is_approved (is_approved),
  CONSTRAINT fk_users_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255) NULL,
  last_name VARCHAR(255) NOT NULL,
  nid_hash VARCHAR(64) NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  phone VARCHAR(30) NULL,
  address TEXT NULL,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_students_name (first_name, last_name),
  CONSTRAINT fk_students_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE institutions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(255) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_institutions_name_city (name, city),
  CONSTRAINT fk_institutions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE verifiers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  purpose TEXT NOT NULL,
  address TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_verifiers_company_contact (company_name, contact_person),
  CONSTRAINT fk_verifiers_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE personal_access_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  token CHAR(64) NOT NULL UNIQUE,
  abilities TEXT NULL,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_personal_access_tokens_tokenable (tokenable_type, tokenable_id)
);

CREATE TABLE certificate_sequences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sequence_key VARCHAR(255) NOT NULL UNIQUE,
  prefix VARCHAR(20) NOT NULL DEFAULT 'BSC',
  year_suffix VARCHAR(2) NOT NULL,
  current_sequence BIGINT UNSIGNED NOT NULL DEFAULT 0,
  last_generated_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_sequence_prefix_year (prefix, year_suffix)
);

CREATE TABLE certificates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  institution_id BIGINT UNSIGNED NOT NULL,
  issued_by BIGINT UNSIGNED NOT NULL,
  revoked_by BIGINT UNSIGNED NULL,
  restored_by BIGINT UNSIGNED NULL,
  serial VARCHAR(255) NOT NULL UNIQUE,
  degree_title VARCHAR(255) NOT NULL,
  program_name VARCHAR(255) NULL,
  major VARCHAR(255) NULL,
  registration_no VARCHAR(100) NULL,
  cgpa DECIMAL(4,2) NULL,
  issue_date DATE NOT NULL,
  completion_date DATE NULL,
  pdf_path VARCHAR(255) NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  revoked_at TIMESTAMP NULL,
  revocation_reason TEXT NULL,
  restored_at TIMESTAMP NULL,
  restoration_reason TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_certificates_student_institution (student_id, institution_id),
  INDEX idx_certificates_degree_issue (degree_title, issue_date),
  INDEX idx_certificates_is_public (is_public),
  INDEX idx_certificates_revoked_at (revoked_at),
  CONSTRAINT fk_certificates_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_issued_by FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_revoked_by FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_certificates_restored_by FOREIGN KEY (restored_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE email_verification_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_email_verification_email_expires (email, expires_at),
  CONSTRAINT fk_email_verification_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE pending_registrations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  user_name VARCHAR(255) NOT NULL,
  registration_role VARCHAR(50) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  registration_data JSON NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_pending_registrations_email_expires (email, expires_at)
);

CREATE TABLE verification_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  certificate_id BIGINT UNSIGNED NULL,
  verifier_user_id BIGINT UNSIGNED NULL,
  serial VARCHAR(255) NOT NULL,
  entered_date_of_birth DATE NULL,
  matched_by_dob TINYINT(1) NOT NULL DEFAULT 0,
  verification_result VARCHAR(40) NOT NULL,
  verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  details TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_verification_logs_serial_result (serial, verification_result),
  INDEX idx_verification_logs_verifier_verified (verifier_user_id, verified_at),
  CONSTRAINT fk_verification_logs_certificate_id FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE SET NULL,
  CONSTRAINT fk_verification_logs_verifier_user_id FOREIGN KEY (verifier_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NULL,
  entity_id BIGINT UNSIGNED NULL,
  description TEXT NOT NULL,
  metadata JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_activity_logs_action_entity (action, entity_type),
  INDEX idx_activity_logs_user_created (user_id, created_at),
  CONSTRAINT fk_activity_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- All Users
INSERT INTO users (id, email, password, role, email_verified_at, is_approved, approved_by, approved_at, created_at, updated_at) VALUES
(1, 'eduauthregistry@gmail.com', '$2y$12$qsbFzh9ntiSnow8vI0y4DudEaHYR0bI0HzQWjxFjF4pCUIn68P/Sm', 'admin', NOW(), 1, NULL, NOW(), NOW(), NOW()),
(2, 'admin@uiu.ac.bd', '$2y$12$2FuT1dyahVHEn4Tbtwz.A.bYHhj7vSDWN54deIHBZV8Zm5OkaS3xC', 'university', NOW(), 1, 1, NOW(), NOW(), NOW()),
(3, 'ssadidahmed01@gmail.com', '$2y$12$2FuT1dyahVHEn4Tbtwz.A.bYHhj7vSDWN54deIHBZV8Zm5OkaS3xC', 'student', NOW(), 1, 1, NOW(), NOW(), NOW()),
(4, 'sayem23cse@gmail.com', '$2y$12$2FuT1dyahVHEn4Tbtwz.A.bYHhj7vSDWN54deIHBZV8Zm5OkaS3xC', 'student', NOW(), 1, 1, NOW(), NOW(), NOW()),
(5, 'mnur223442@bscse.uiu.ac.bd', '$2y$12$2FuT1dyahVHEn4Tbtwz.A.bYHhj7vSDWN54deIHBZV8Zm5OkaS3xC', 'student', NOW(), 1, 1, NOW(), NOW(), NOW()),
(6, 'demo@enosis.com', '$2y$12$2FuT1dyahVHEn4Tbtwz.A.bYHhj7vSDWN54deIHBZV8Zm5OkaS3xC', 'verifier', NOW(), 1, 1, NOW(), NOW(), NOW()),
(7, 'demo@brainstation-23.com', '$2y$12$2FuT1dyahVHEn4Tbtwz.A.bYHhj7vSDWN54deIHBZV8Zm5OkaS3xC', 'verifier', NOW(), 1, 1, NOW(), NOW(), NOW()),
(8, 'ssadidahmed07@gmail.com', '$2y$12$2FuT1dyahVHEn4Tbtwz.A.bYHhj7vSDWN54deIHBZV8Zm5OkaS3xC', 'verifier', NOW(), 1, 1, NOW(), NOW(), NOW());

-- University
INSERT INTO institutions (id, user_id, name, registration_number, address, city, phone, created_at, updated_at) VALUES
(1, 2, 'United International University', 'UIU-2024-001', 'United City, Madani Avenue', 'Dhaka', '+880123456789', NOW(), NOW());

-- Students
INSERT INTO students (id, user_id, first_name, last_name, nid_hash, date_of_birth, student_id, created_at, updated_at) VALUES
(1, 3, 'Sadid', 'Ahmed', SHA2('NID1', 256), '2002-01-01', '0112330154', NOW(), NOW()),
(2, 4, 'M.M. Sayem', 'Prodhan', SHA2('NID2', 256), '2002-01-01', '0112330411', NOW(), NOW()),
(3, 5, 'Md. Assaduzzaman', 'Nur', SHA2('NID3', 256), '2002-01-01', '0112230442', NOW(), NOW());

-- Verifiers
INSERT INTO verifiers (id, user_id, company_name, contact_person, email, phone, purpose, created_at, updated_at) VALUES
(1, 6, 'Enosis Solutions', 'HR Dept', 'demo@enosis.com', '+8801700000001', 'Background Check', NOW(), NOW()),
(2, 7, 'Brain Station 23', 'Recruitment', 'demo@brainstation-23.com', '+8801700000002', 'Credential Verification', NOW(), NOW()),
(3, 8, 'PhaseShift', 'Sadid Ahmed', 'ssadidahmed07@gmail.com', '+8801700000003', 'Project Audit', NOW(), NOW());

-- Certificate Sequence
INSERT INTO certificate_sequences (id, sequence_key, prefix, year_suffix, current_sequence, created_at, updated_at) VALUES
(1, 'certificate_serial', 'BSC', '26', 3, NOW(), NOW());

-- Certificates
INSERT INTO certificates (id, student_id, institution_id, issued_by, serial, degree_title, program_name, major, registration_no, cgpa, issue_date, completion_date, is_public, created_at, updated_at) VALUES
-- Certificate for Sadid (Major: Cybersecurity)
(1, 1, 1, 2, 'BSC-26-0001', 'Bachelor of Science', 'Computer Science and Engineering', 'Cybersecurity', '0112330154', 3.85, '2026-02-15', '2026-01-10', 1, NOW(), NOW()),

-- Certificate for Sayem (Major: Data Science)
(2, 2, 1, 2, 'BSC-26-0002', 'Bachelor of Science', 'Computer Science and Engineering', 'Data Science', '0112330411', 3.90, '2026-02-15', '2026-01-10', 1, NOW(), NOW()),

-- Certificate for Junel (Major: Software Engineering)
(3, 3, 1, 2, 'BSC-26-0003', 'Bachelor of Science', 'Computer Science and Engineering', 'Software Engineering', '0112230442', 3.80, '2026-02-15', '2026-01-10', 1, NOW(), NOW());
