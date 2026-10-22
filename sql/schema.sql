-- =====================================================================
-- LIN E-Learning — complete MySQL 8.0+ schema
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- users
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  matric        VARCHAR(50)  NULL DEFAULT NULL,
  role          ENUM('student','lecturer','admin') NOT NULL DEFAULT 'student',
  tenant_name   VARCHAR(100) NOT NULL DEFAULT 'SAHARCO',
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email  (email),
  UNIQUE KEY uq_users_matric (matric),
  KEY idx_users_role   (role),
  KEY idx_users_tenant (tenant_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- refresh_tokens (MUST have column `id` — required for login)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         CHAR(36)     NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  token_hash CHAR(64)     NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_hash (token_hash),
  KEY idx_refresh_user (user_id),
  KEY idx_refresh_expires (expires_at),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- courses
CREATE TABLE IF NOT EXISTS courses (
  id              CHAR(36)     NOT NULL,
  code            VARCHAR(50)  NOT NULL,
  title           VARCHAR(255) NOT NULL,
  lecturer_id     CHAR(36)     NULL DEFAULT NULL,
  lecturer_name   VARCHAR(150) NOT NULL DEFAULT '',
  units           INT          NOT NULL DEFAULT 0,
  duration        VARCHAR(50)  NOT NULL DEFAULT '12 Weeks',
  certification   VARCHAR(150) NOT NULL DEFAULT 'Certificate of Completion',
  status          ENUM('Active','Draft') NOT NULL DEFAULT 'Active',
  description     TEXT         NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (code),
  KEY idx_courses_status (status),
  KEY idx_courses_lecturer (lecturer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- lessons
CREATE TABLE IF NOT EXISTS lessons (
  id         CHAR(36)     NOT NULL,
  course_id  CHAR(36)     NOT NULL,
  title      VARCHAR(255) NOT NULL,
  duration   VARCHAR(50)  NOT NULL DEFAULT '10 min',
  sort_order INT          NOT NULL DEFAULT 1,
  content    TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lessons_course (course_id),
  CONSTRAINT fk_lessons_course
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id                 CHAR(36)  NOT NULL,
  user_id            CHAR(36)  NOT NULL,
  course_id          CHAR(36)  NOT NULL,
  progress           INT       NOT NULL DEFAULT 0,
  lessons_completed  INT       NOT NULL DEFAULT 0,
  enrolled_at        DATE      NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollment_user_course (user_id, course_id),
  KEY idx_enrollments_user (user_id),
  KEY idx_enrollments_course (course_id),
  CONSTRAINT fk_enrollments_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- questions
CREATE TABLE IF NOT EXISTS questions (
  id             CHAR(36)     NOT NULL,
  course_id      CHAR(36)     NOT NULL,
  type           ENUM('MCQ','True/False') NOT NULL DEFAULT 'MCQ',
  text           TEXT         NOT NULL,
  options_json   JSON         NOT NULL,
  correct_index  INT          NOT NULL DEFAULT 0,
  points         INT          NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_questions_course (course_id),
  CONSTRAINT fk_questions_course
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- exams
CREATE TABLE IF NOT EXISTS exams (
  id                CHAR(36)     NOT NULL,
  title             VARCHAR(255) NOT NULL,
  course_id         CHAR(36)     NOT NULL,
  duration_minutes  INT          NOT NULL DEFAULT 60,
  start_date        DATETIME     NOT NULL,
  status            ENUM('Scheduled','Active','Closed') NOT NULL DEFAULT 'Scheduled',
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_exams_course (course_id),
  KEY idx_exams_status (status),
  CONSTRAINT fk_exams_course
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- exam_questions
CREATE TABLE IF NOT EXISTS exam_questions (
  exam_id     CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  sort_order  INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_id, question_id),
  KEY idx_eq_question (question_id),
  CONSTRAINT fk_eq_exam
    FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT fk_eq_question
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- results
CREATE TABLE IF NOT EXISTS results (
  id           CHAR(36)  NOT NULL,
  user_id      CHAR(36)  NOT NULL,
  exam_id      CHAR(36)  NOT NULL,
  course_id    CHAR(36)  NOT NULL,
  score        INT       NOT NULL DEFAULT 0,
  total        INT       NOT NULL DEFAULT 0,
  submitted_at DATETIME  NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_results_user (user_id),
  KEY idx_results_exam (exam_id),
  KEY idx_results_course (course_id),
  CONSTRAINT fk_results_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_results_exam
    FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT fk_results_course
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;