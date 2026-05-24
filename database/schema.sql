-- EduAuth Registry — Database Schema

CREATE DATABASE IF NOT EXISTS eduauth_registry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE eduauth_registry;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'university', 'verifier', 'admin') NOT NULL,
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
  CONSTRAINT fk_users_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE
  SET
    NULL
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

CREATE TABLE pending_registrations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  user_name VARCHAR(255) NOT NULL,
  registration_role VARCHAR(50) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  registration_data JSON NOT NULL,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  verified_at TIMESTAMP NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_pending_registrations_email_expires (email, expires_at)
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
  website VARCHAR(255) NULL,
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
  website VARCHAR(255) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_verifiers_company_contact (company_name, contact_person),
  CONSTRAINT fk_verifiers_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE enrollments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_number VARCHAR(255) NOT NULL UNIQUE,
  student_id BIGINT UNSIGNED NOT NULL,
  institution_id BIGINT UNSIGNED NOT NULL,
  program VARCHAR(255) NOT NULL,
  batch VARCHAR(255) NOT NULL,
  status ENUM('active', 'graduated', 'suspended', 'withdrawn') NOT NULL DEFAULT 'active',
  enrollment_date DATE NOT NULL,
  expected_graduation_date DATE NULL,
  actual_graduation_date DATE NULL,
  enrolled_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_enrollments_student_institution (student_id, institution_id),
  INDEX idx_enrollments_status (status),
  INDEX idx_enrollments_enrollment_date (enrollment_date),
  UNIQUE KEY uq_enrollment_active (student_id, institution_id, status),
  CONSTRAINT fk_enrollments_student_id FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_enrolled_by FOREIGN KEY (enrolled_by) REFERENCES users(id) ON DELETE CASCADE
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
  enrollment_id BIGINT UNSIGNED NULL,
  issued_by BIGINT UNSIGNED NOT NULL,
  serial VARCHAR(255) NOT NULL UNIQUE,
  certificate_level VARCHAR(50) NOT NULL,
  certificate_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  major VARCHAR(255) NULL,
  session VARCHAR(100) NOT NULL,
  cgpa DECIMAL(4, 2) NULL,
  degree_class VARCHAR(100) NULL,
  issue_date DATE NOT NULL,
  convocation_date DATE NULL,
  authority_name VARCHAR(255) NOT NULL,
  authority_title VARCHAR(255) NOT NULL,
  pdf_path VARCHAR(255) NULL,
  is_publicly_shareable TINYINT(1) NOT NULL DEFAULT 1,
  revoked_at TIMESTAMP NULL,
  revoked_by BIGINT UNSIGNED NULL,
  revocation_reason TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_certificates_student_institution (student_id, institution_id),
  INDEX idx_certificates_enrollment_id (enrollment_id),
  INDEX idx_certificates_serial (serial),
  INDEX idx_certificates_is_publicly_shareable (is_publicly_shareable),
  INDEX idx_certificates_revoked_at (revoked_at),
  CONSTRAINT fk_certificates_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificates_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE
  SET
    NULL,
    CONSTRAINT fk_certificates_issued_by FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_certificates_revoked_by FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE
  SET
    NULL
);

CREATE TABLE certificate_access_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  verifier_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  purpose TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  access_duration_days INT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_access_requests_verifier_student_status (verifier_id, student_id, status),
  CONSTRAINT fk_access_requests_verifier FOREIGN KEY (verifier_id) REFERENCES verifiers(id),
  CONSTRAINT fk_access_requests_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE verifier_access (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  verifier_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  request_id BIGINT UNSIGNED NULL,
  granted_at TIMESTAMP NULL DEFAULT NULL,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  revoked_at TIMESTAMP NULL,
  revoked_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX idx_verifier_access_verifier_student_expires (verifier_id, student_id, expires_at),
  CONSTRAINT fk_verifier_access_verifier FOREIGN KEY (verifier_id) REFERENCES verifiers(id),
  CONSTRAINT fk_verifier_access_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_verifier_access_request FOREIGN KEY (request_id) REFERENCES certificate_access_requests(id),
  CONSTRAINT fk_verifier_access_revoked_by FOREIGN KEY (revoked_by) REFERENCES users(id)
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
  INDEX idx_verification_logs_serial_verified (serial, verified_at),
  INDEX idx_verification_logs_verifier_verified (verifier_user_id, verified_at),
  CONSTRAINT fk_verification_logs_certificate FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE
  SET
    NULL,
    CONSTRAINT fk_verification_logs_verifier FOREIGN KEY (verifier_user_id) REFERENCES users(id) ON DELETE
  SET
    NULL
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
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
  SET
    NULL
);

CREATE TABLE jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  queue VARCHAR(255) NOT NULL,
  payload LONGTEXT NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  reserved_at INT UNSIGNED NULL,
  available_at INT UNSIGNED NOT NULL,
  created_at INT UNSIGNED NOT NULL,
  INDEX idx_jobs_queue_reserved_available (queue, reserved_at, available_at)
);

CREATE TABLE failed_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(255) NOT NULL UNIQUE,
  connection TEXT NOT NULL,
  queue TEXT NOT NULL,
  payload LONGTEXT NOT NULL,
  exception LONGTEXT NOT NULL,
  failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE withdrawal_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enrollment_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  rejection_note TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_withdrawal_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawal_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_withdrawal_reviewed FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE
  SET
    NULL
);

CREATE TABLE profile_change_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  current_value TEXT NULL,
  requested_value TEXT NOT NULL,
  reason TEXT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT NULL,
  supporting_documents JSON NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_profile_change_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_profile_change_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE
  SET
    NULL
);

CREATE TABLE notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  notifiable_type VARCHAR(255) NOT NULL,
  notifiable_id BIGINT UNSIGNED NOT NULL,
  data TEXT NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_notifications_notifiable (notifiable_type, notifiable_id)
);

CREATE TABLE user_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  preferences JSON NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);