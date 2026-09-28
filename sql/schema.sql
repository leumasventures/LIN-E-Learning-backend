-- Run once in phpMyAdmin / MySQL for database: u156099858_lin

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  matric VARCHAR(100) NULL,
  role ENUM('student', 'admin', 'lecturer') NOT NULL DEFAULT 'student',
  tenant_name VARCHAR(100) NOT NULL DEFAULT 'SAHARCO',
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_matric (matric)
);

-- Optional demo users (password for all: Password123!)
-- Generate a fresh bcrypt hash if needed, then:
-- INSERT INTO users (id, name, email, matric, role, tenant_name, password_hash, is_active) VALUES
-- ('1', 'Chinedu Okafor', 'chinedu.okafor@student.edu', 'CSC/2023/041', 'student', 'SAHARCO', '$2a$10$REPLACE_WITH_BCRYPT_HASH', 1),
-- ('2', 'Admin User', 'admin@school.edu', NULL, 'admin', 'SAHARCO', '$2a$10$REPLACE_WITH_BCRYPT_HASH', 1),
-- ('3', 'Dr. A. Obi', 'a.obi@school.edu', NULL, 'lecturer', 'SAHARCO', '$2a$10$REPLACE_WITH_BCRYPT_HASH', 1);
