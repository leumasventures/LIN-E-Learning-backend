-- =====================================================================
-- LIN E-Learning: database schema (MySQL 8.0+)
-- Covers the tables the auth code touches: users, refresh_tokens.
-- Column names match src/data/users.ts exactly (tenant_name,
-- password_hash, is_active), so the existing queries keep working.
--
-- Run this in the Railway MySQL console (Data tab or Connect details).
-- No CREATE DATABASE here: Railway already gives you one.
-- Every statement is CREATE TABLE IF NOT EXISTS, so it is safe to re-run.
-- If a `users` table already exists, see the UPGRADE section at the end.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL,                      -- UUID from randomUUID()
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL,                      -- stored lowercase by the app
  matric        VARCHAR(50)  NULL DEFAULT NULL,             -- optional student number
  role          ENUM('student','lecturer','admin') NOT NULL DEFAULT 'student',
  tenant_name   VARCHAR(100) NOT NULL DEFAULT 'SAHARCO',
  password_hash VARCHAR(255) NOT NULL,                      -- bcrypt hash, never plain text
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  -- Unique keys give ER_DUP_ENTRY on duplicates, which register() already
  -- turns into a 409. The utf8mb4_0900_ai_ci collation is case-insensitive,
  -- so "A@x.com" and "a@x.com" count as the same email. Multiple NULL
  -- matrics are allowed.
  UNIQUE KEY uq_users_email  (email),
  UNIQUE KEY uq_users_matric (matric),
  KEY idx_users_role   (role),
  KEY idx_users_tenant (tenant_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- refresh_tokens
-- Replaces the in-memory refreshStore Map, so users stay logged in across
-- Railway redeploys. Stores a SHA-256 hash of the token, never the token.
-- NOTE: the table is safe to create now, but it is not used until the
-- controller is changed to read and write it.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_hash CHAR(64)  NOT NULL,                            -- SHA-256 hex of the token
  user_id    CHAR(36)  NOT NULL,
  expires_at DATETIME  NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (token_hash),
  KEY idx_refresh_user    (user_id),
  KEY idx_refresh_expires (expires_at),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- =====================================================================
-- USEFUL STATEMENTS (copy and run one at a time; replace the emails)
-- =====================================================================

-- See who exists (never select password_hash into chats or logs):
--   SELECT id, email, matric, role, is_active, created_at FROM users;

-- Promote a user (public signup only creates students):
--   UPDATE users SET role = 'admin' WHERE email = 'your-real@email.com';

-- Re-activate a user:
--   UPDATE users SET is_active = 1 WHERE email = 'someone@example.com';

-- Remove test accounts (refresh tokens are removed automatically):
--   DELETE FROM users WHERE email IN ('you@yourmail.com');

-- Periodic cleanup of expired refresh tokens:
--   DELETE FROM refresh_tokens WHERE expires_at < NOW();


-- =====================================================================
-- UPGRADE: only if a `users` table ALREADY EXISTS
-- 1) Look at what you have:      SHOW CREATE TABLE users;
-- 2) Run ONLY the statements for things that are missing. MySQL has no
--    "ADD COLUMN IF NOT EXISTS", so a statement for something that
--    already exists will just error. That is harmless but noisy.
-- =====================================================================

-- Timestamps:
--   ALTER TABLE users
--     ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
--                           ON UPDATE CURRENT_TIMESTAMP;

-- Unique keys. First make sure there are no duplicates, or ALTER fails:
--   SELECT email,  COUNT(*) c FROM users GROUP BY email  HAVING c > 1;
--   SELECT matric, COUNT(*) c FROM users WHERE matric IS NOT NULL
--                             GROUP BY matric HAVING c > 1;
--   ALTER TABLE users ADD UNIQUE KEY uq_users_email  (email);
--   ALTER TABLE users ADD UNIQUE KEY uq_users_matric (matric);

-- Lock the role column to valid values:
--   ALTER TABLE users
--     MODIFY role ENUM('student','lecturer','admin') NOT NULL DEFAULT 'student';

-- If creating refresh_tokens fails with a foreign key error (errno 3780 or
-- 1215), your existing users table uses a different charset or collation.
-- Check it in SHOW CREATE TABLE users and match it in refresh_tokens.