-- Migration: 004_academic_core.sql
-- Description: Real academic core hierarchy, course offerings, section transfers, timetable conflict detection, and attendance lifecycle state machine

-- 1. Departments enhancements
ALTER TABLE departments ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Programs enhancements
ALTER TABLE programs ADD COLUMN IF NOT EXISTS degree VARCHAR(64);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));

-- 3. Academic Years enhancements
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));

-- 4. Semesters enhancements
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE CASCADE;

-- 5. Courses enhancements
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE RESTRICT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE RESTRICT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;

-- 6. Sections enhancements
ALTER TABLE sections ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(id) ON DELETE RESTRICT;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));

-- 7. Section Transfers (Auditable student transfer history)
CREATE TABLE IF NOT EXISTS section_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_section_id UUID NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
    to_section_id UUID NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_section_transfers_student ON section_transfers(student_id);
CREATE INDEX IF NOT EXISTS idx_section_transfers_sections ON section_transfers(from_section_id, to_section_id);

-- 8. Timetable Slots with Conflict Detection Support
CREATE TABLE IF NOT EXISTS timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    section_course_id UUID NOT NULL REFERENCES section_courses(id) ON DELETE CASCADE,
    day_of_week VARCHAR(16) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(64) NOT NULL,
    slot_type VARCHAR(32) DEFAULT 'lecture' CHECK (slot_type IN ('lecture', 'lab', 'tutorial', 'seminar', 'break')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timetable_inst ON timetable_slots(institution_id);
CREATE INDEX IF NOT EXISTS idx_timetable_sec_course ON timetable_slots(section_course_id);
CREATE INDEX IF NOT EXISTS idx_timetable_room_time ON timetable_slots(room_number, day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_slots(day_of_week);

-- 9. Attendance Sessions Lifecycle & Locking
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'OPEN', 'SUBMITTED', 'LOCKED', 'CORRECTION_REQUESTED', 'CORRECTED'));
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id);

-- 10. High-Performance Query Indexes for Academic Analytics
CREATE INDEX IF NOT EXISTS idx_courses_dept_status ON courses(department_id, status);
CREATE INDEX IF NOT EXISTS idx_sections_prog_sem ON sections(program_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_status ON attendance_records(student_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_sec_status ON attendance_sessions(section_course_id, status);
