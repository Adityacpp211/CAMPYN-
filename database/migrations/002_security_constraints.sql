-- Migration: 002_security_constraints.sql
-- Description: Schema migration tracking, session revocation, soft-deletes, and performance indexing

-- 1. Migration History Tracking
CREATE TABLE IF NOT EXISTS _schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Session Revocation Column
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- 3. Soft Delete Columns for Data Integrity
ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Direct Institutional Tenant Isolation References
ALTER TABLE students ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;

-- Backfill institution_id from user relationships if null
UPDATE students s
SET institution_id = u.institution_id
FROM users u
WHERE s.user_id = u.id AND s.institution_id IS NULL;

UPDATE faculty f
SET institution_id = u.institution_id
FROM users u
WHERE f.user_id = u.id AND f.institution_id IS NULL;

UPDATE courses c
SET institution_id = d.institution_id
FROM departments d
WHERE c.department_id = d.id AND c.institution_id IS NULL;

-- 5. High-Performance Relational Indexes
CREATE INDEX IF NOT EXISTS idx_users_institution_email ON users(institution_id, email);
CREATE INDEX IF NOT EXISTS idx_students_institution_roll ON students(institution_id, roll_number);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_institution ON faculty(institution_id);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON faculty(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_lookup ON attendance_records(session_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(section_course_id, session_date);
CREATE INDEX IF NOT EXISTS idx_marks_student_exam ON marks_entries(examination_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fee_transactions_due ON fee_transactions(student_fee_due_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_chain ON audit_logs(institution_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs(hash);
CREATE INDEX IF NOT EXISTS idx_approval_requests_inst_status ON approval_requests(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
