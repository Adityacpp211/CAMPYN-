import React from 'react';
import { User, Student } from '../../types';
import { db } from '../../services/db';
import {
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  GraduationCap,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigate }) => {
  // Check if role is Student
  if (currentUser.role === 'STUDENT') {
    const student = db.students[0]; // Maya Chen
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-white)' }}>
            Good morning, {currentUser.firstName}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
            Roll No: {student.rollNumber} • Semester 5 ({student.programName})
          </p>
        </div>

        {/* Shortage or fee banner if any */}
        {student.pendingFees > 0 && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} color="var(--color-warning)" />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#FFB74D' }}>
                  Fee Payment Outstanding: ${student.pendingFees}
                </span>
                <p style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
                  Semester 5 tuition installment deadline approaches.
                </p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('fees')}>
              View Due
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="text-secondary" style={{ fontSize: '12px' }}>ATTENDANCE RATE</span>
              <Badge variant={student.attendancePercentage >= 75 ? 'success' : 'danger'}>
                {student.attendancePercentage >= 75 ? 'Optimal' : 'Shortage Warning'}
              </Badge>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              {student.attendancePercentage}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Target: 75.0% required for exam hall ticket
            </div>
          </div>

          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="text-secondary" style={{ fontSize: '12px' }}>CUMULATIVE CGPA</span>
              <Badge variant="info">Scale 4.0</Badge>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              {student.cgpa}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Class Rank #1 in Section A
            </div>
          </div>

          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="text-secondary" style={{ fontSize: '12px' }}>ACTIVE ASSIGNMENTS</span>
              <Badge variant="default">Due Soon</Badge>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              2
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Next due in 6 days (CS301 B-Tree)
            </div>
          </div>
        </div>

        {/* Schedule & Pending Deadlines */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
                Today's Schedule (Monday)
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('timetable')}>
                Full Timetable
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {db.timetableSlots.slice(0, 3).map((slot) => (
                <div
                  key={slot.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-charcoal)',
                    border: '1px solid var(--color-border-gray)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-off-white)' }}>
                      {slot.courseCode}: {slot.courseName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '2px' }}>
                      {slot.facultyName} • {slot.roomNumber}
                    </div>
                  </div>
                  <Badge variant="default">{slot.timeSlot}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
                Pending Assignments
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('assignments')}>
                View All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {db.assignments.map((asg) => (
                <div
                  key={asg.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-charcoal)',
                    border: '1px solid var(--color-border-gray)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-off-white)' }}>
                    {asg.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-light-gray)' }}>
                      {asg.courseCode} • Max: {asg.maxMarks} marks
                    </span>
                    <Badge variant="warning">Due {asg.dueDate.split(' ')[0]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if role is Faculty
  if (currentUser.role === 'FACULTY') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-white)' }}>
            Faculty Overview • {currentUser.firstName} {currentUser.lastName}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
            Department of Computer Science & Engineering • Courses Handled: CS301, CS303
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="surface-card">
            <span className="text-secondary" style={{ fontSize: '12px' }}>TODAY'S CLASSES</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              2 Sessions
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Next: 09:00 AM (CS301 Data Structures)
            </div>
          </div>

          <div className="surface-card">
            <span className="text-secondary" style={{ fontSize: '12px' }}>ATTENDANCE TO FINALIZE</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-warning)', marginTop: '8px' }}>
              1 Pending
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              CS301 Section A requires submission
            </div>
          </div>

          <div className="surface-card">
            <span className="text-secondary" style={{ fontSize: '12px' }}>PENDING EVALUATIONS</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              2 Submissions
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Assignment: B-Tree Implementation
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
              Quick Attendance Action
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
              Open today's active session for CS301 Section A to mark presents, absents, or review student justification requests.
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>
              Take Attendance Now <ArrowRight size={14} />
            </button>
          </div>

          <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
              Grade Pending Assignments
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
              Review student uploaded C++ code submissions, valgrind memory leak logs, and award marks.
            </p>
            <button className="btn btn-secondary" onClick={() => onNavigate('assignments')}>
              Open Grading Drawer <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: HOD & Administrator Dashboard
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-white)' }}>
            Institution Overview Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
            Role Context: {currentUser.role.replace('_', ' ')} • Academic Year 2026-2027
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('audit')}>
            Audit Logs
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('approvals')}>
            Pending Approvals ({db.approvalRequests.filter((r) => r.status === 'pending').length})
          </button>
        </div>
      </div>

      {/* Institutional Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>TOTAL ENROLLED STUDENTS</span>
            <GraduationCap size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
            1,330
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
            Across 4 Engineering Departments
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>FACULTY STRENGTH</span>
            <Users size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
            92
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
            1:14.4 Faculty-to-Student Ratio
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>FEE COLLECTION RATE</span>
            <DollarSign size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#81C784', marginTop: '8px' }}>
            91.4%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
            $21,750 collected of $23,800 dues
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>ATTENDANCE HEALTH</span>
            <CheckCircle2 size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
            82.7%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '4px' }}>
            2 students below 75% threshold
          </div>
        </div>
      </div>

      {/* Departments Performance & Recent Audit Streams */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Departments List */}
        <div className="surface-card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)', marginBottom: '14px' }}>
            Departmental Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {db.departments.map((dept) => (
              <div
                key={dept.id}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border-gray)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-white)' }}>
                    {dept.name} ({dept.code})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
                    HOD: {dept.hodName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-off-white)' }}>
                    {dept.studentCount} Students
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                    {dept.facultyCount} Faculty
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Immutable Audit Stream */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
              Recent Audit Log Activity
            </h3>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('audit')}>
              Audit Stream
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {db.auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border-gray)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-off-white)' }}>
                    {log.action} • {log.entity}
                  </span>
                  <span style={{ color: 'var(--color-medium-gray)', fontSize: '11px' }}>
                    {log.timestamp}
                  </span>
                </div>
                <div style={{ color: 'var(--color-light-gray)', marginTop: '4px' }}>
                  By: {log.actorEmail} ({log.role})
                </div>
                {log.reason && (
                  <div style={{ color: 'var(--color-medium-gray)', fontSize: '11px', marginTop: '2px', fontStyle: 'italic' }}>
                    "{log.reason}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
