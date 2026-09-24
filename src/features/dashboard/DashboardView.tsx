import React, { useState, useEffect } from 'react';
import { User, Student } from '../../types';
import { useDashboard } from '../../hooks/useDashboard';
import { useAcademics } from '../../hooks/useAcademics';
import { useTimetable } from '../../hooks/useTimetable';
import { useAssignments } from '../../hooks/useAssignments';
import { api } from '../../services/api';
import {
  AlertTriangle,
  DollarSign,
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigate }) => {
  const { data, loading: dashLoading, error: dashError, refetch: refetchDash } = useDashboard();
  const { departments, loading: deptsLoading } = useAcademics();
  const { slots: timetableSlots } = useTimetable();
  const { assignments } = useAssignments();

  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(currentUser.role === 'STUDENT');

  useEffect(() => {
    if (currentUser.role === 'STUDENT') {
      setProfileLoading(true);
      api.students
        .profile()
        .then((res) => {
          const profile = res?.data || res;
          setStudentProfile(profile);
        })
        .catch((err) => {
          console.warn('[Dashboard] Student profile load:', err.message);
        })
        .finally(() => {
          setProfileLoading(false);
        });
    }
  }, [currentUser.role]);

  if (dashLoading || profileLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--color-light-gray)', gap: '12px' }}>
        <Loader2 size={24} className="animate-spin" />
        <span style={{ fontSize: '13px' }}>Aggregating real-time database metrics...</span>
      </div>
    );
  }

  if (dashError) {
    return (
      <div style={{ padding: '20px', backgroundColor: 'var(--color-dark-charcoal)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FFA4A4', marginBottom: '8px' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Failed to load institutional dashboard</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-light-gray)', marginBottom: '14px' }}>
          {dashError}
        </p>
        <button className="btn btn-secondary btn-sm" onClick={() => refetchDash()}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    pendingApprovals: 0,
    feesCollected: 0,
    feesOutstanding: 0,
    attendanceRate: 0,
  };

  const recentAudits = data?.recentAudits || [];
  const lowAttendanceAlerts = data?.lowAttendanceAlerts || [];

  // 1. Student Dashboard View
  if (currentUser.role === 'STUDENT' && studentProfile) {
    const student = studentProfile;
    const attPct = typeof student.attendancePercentage === 'number' ? student.attendancePercentage : 0;
    const pendingFees = typeof student.pendingFees === 'number' ? student.pendingFees : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-white)' }}>
            Welcome back, {currentUser.firstName}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
            Roll No: {student.rollNumber} • {student.programName || 'Degree Candidate'} • Semester {student.semesterNumber || 1}
          </p>
        </div>

        {pendingFees > 0 && (
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
                  Fee Payment Outstanding: ${Number(pendingFees).toLocaleString()}
                </span>
                <p style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
                  Semester tuition dues pending settlement.
                </p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('fees')}>
              View Due
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="text-secondary" style={{ fontSize: '12px' }}>ATTENDANCE RATE</span>
              <Badge variant={attPct >= 75 ? 'success' : 'danger'}>
                {attPct >= 75 ? 'Optimal' : 'Shortage Warning'}
              </Badge>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              {attPct}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Target: 75.0% required for academic standing
            </div>
          </div>

          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="text-secondary" style={{ fontSize: '12px' }}>CUMULATIVE CGPA</span>
              <Badge variant="info">Scale 4.0</Badge>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              {student.cgpa !== undefined ? student.cgpa : '3.80'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Academic standing: Active
            </div>
          </div>

          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="text-secondary" style={{ fontSize: '12px' }}>ACTIVE ASSIGNMENTS</span>
              <Badge variant="default">{assignments.length} Total</Badge>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              {assignments.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Active coursework deliverables
            </div>
          </div>
        </div>

        {/* Schedule & Pending Deadlines */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
                Scheduled Classes
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('timetable')}>
                Full Timetable
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timetableSlots.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-medium-gray)', fontSize: '12px' }}>
                  No classes scheduled for today.
                </div>
              ) : (
                timetableSlots.slice(0, 3).map((slot) => (
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
                    <Badge variant="default">{slot.timeSlot || `${slot.start_time || ''} - ${slot.end_time || ''}`}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
                Coursework Deadlines
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => onNavigate('assignments')}>
                View All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assignments.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-medium-gray)', fontSize: '12px' }}>
                  No active assignments currently pending.
                </div>
              ) : (
                assignments.slice(0, 3).map((asg) => (
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
                      <Badge variant="warning">Due {String(asg.dueDate).split('T')[0].split(' ')[0]}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Faculty Dashboard View
  if (currentUser.role === 'FACULTY') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-white)' }}>
            Faculty Overview • {currentUser.firstName} {currentUser.lastName}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
            Academic Faculty Workspace • Campus Active Session
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="surface-card">
            <span className="text-secondary" style={{ fontSize: '12px' }}>TIMETABLE SESSIONS</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              {timetableSlots.length} Slots
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Scheduled teaching periods
            </div>
          </div>

          <div className="surface-card">
            <span className="text-secondary" style={{ fontSize: '12px' }}>ACTIVE ASSIGNMENTS</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
              {assignments.length} Coursework
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Student assessments managed
            </div>
          </div>

          <div className="surface-card">
            <span className="text-secondary" style={{ fontSize: '12px' }}>CAMPUS ATTENDANCE HEALTH</span>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#81C784', marginTop: '8px' }}>
              {metrics.attendanceRate}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
              Aggregate attendance across terms
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
              Attendance Records
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
              Record attendance for class sessions, finalize rosters, and audit student justifications.
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate('attendance')}>
              Take Attendance Now <ArrowRight size={14} />
            </button>
          </div>

          <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
              Coursework & Submissions
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
              Review student assignment submissions, manage problem sets, and record marks.
            </p>
            <button className="btn btn-secondary" onClick={() => onNavigate('assignments')}>
              View Assignments <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Administrator / HOD / Staff Dashboard View
  const totalDues = Number(metrics.feesCollected) + Number(metrics.feesOutstanding);
  const collectionPct = totalDues > 0 ? ((Number(metrics.feesCollected) / totalDues) * 100).toFixed(1) : '100.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-white)' }}>
            Institution Overview Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
            Role Context: {currentUser.role.replace('_', ' ')} • Real-time PostgreSQL Analytics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('audit')}>
            Audit Logs
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('approvals')}>
            Pending Approvals ({metrics.pendingApprovals})
          </button>
        </div>
      </div>

      {/* Institutional Metrics Grid (Derived from single backend aggregate query) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>TOTAL ENROLLED STUDENTS</span>
            <GraduationCap size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
            {metrics.totalStudents.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
            Across active institutional programs
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>FACULTY STRENGTH</span>
            <Users size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
            {metrics.totalFaculty.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
            Instructional and academic staff
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>FEE COLLECTION RATE</span>
            <DollarSign size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#81C784', marginTop: '8px' }}>
            {collectionPct}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '4px' }}>
            ${Number(metrics.feesCollected).toLocaleString()} collected of ${totalDues.toLocaleString()} dues
          </div>
        </div>

        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="text-secondary" style={{ fontSize: '12px' }}>ATTENDANCE HEALTH</span>
            <CheckCircle2 size={16} color="var(--color-light-gray)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
            {metrics.attendanceRate}%
          </div>
          <div style={{ fontSize: '11px', color: lowAttendanceAlerts.length > 0 ? 'var(--color-warning)' : 'var(--color-medium-gray)', marginTop: '4px' }}>
            {lowAttendanceAlerts.length > 0
              ? `${lowAttendanceAlerts.length} students below 75% threshold`
              : 'All cohorts within normal threshold'}
          </div>
        </div>
      </div>

      {/* Departments Breakdown & Recent Audit Streams */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Departments List from PostgreSQL */}
        <div className="surface-card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)', marginBottom: '14px' }}>
            Academic Departmental Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deptsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : departments.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-medium-gray)', fontSize: '12px' }}>
                No academic departments configured.
              </div>
            ) : (
              departments.map((dept) => (
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
                      {dept.hodName ? `HOD: ${dept.hodName}` : 'Department Division'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-off-white)' }}>
                      {dept.studentCount !== undefined ? `${dept.studentCount} Students` : 'Active'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                      {dept.facultyCount !== undefined ? `${dept.facultyCount} Faculty` : 'Staffed'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Immutable Audit Stream from PostgreSQL */}
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
              Recent Authoritative Audit Trail
            </h3>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('audit')}>
              Inspect All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentAudits.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-medium-gray)', fontSize: '12px' }}>
                No recent audit log entries recorded.
              </div>
            ) : (
              recentAudits.slice(0, 4).map((log) => (
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
                      {String(log.timestamp || '').replace('T', ' ').substring(0, 19)}
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
