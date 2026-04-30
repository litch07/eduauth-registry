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
