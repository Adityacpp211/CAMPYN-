import { useState, useEffect } from 'react';
import { User, GlobalFilterState } from './types';
import { db } from './services/db';
import { api } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { GlobalFilterBar } from './components/layout/GlobalFilterBar';
import { CommandPalette } from './components/command/CommandPalette';
import { LoginModal } from './components/auth/LoginModal';
import { DashboardView } from './features/dashboard/DashboardView';
import { StudentsView } from './features/students/StudentsView';
import { FacultyView } from './features/faculty/FacultyView';
import { CoursesView } from './features/academics/CoursesView';
import { TimetableView } from './features/timetable/TimetableView';
import { AttendanceView } from './features/attendance/AttendanceView';
import { AssignmentsView } from './features/assignments/AssignmentsView';
import { ExamsView } from './features/exams/ExamsView';
import { FeesView } from './features/fees/FeesView';
import { ApprovalsView } from './features/approvals/ApprovalsView';
import { AuditView } from './features/audit/AuditView';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'u-admin-1',
    email: 'admin.vance@campus.edu',
    username: 'avance',
    firstName: 'Adrian',
    lastName: 'Vance',
    role: 'COLLEGE_ADMIN',
    departmentId: 'dept-cse',
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [selectedStudentDossierId, setSelectedStudentDossierId] = useState<string | undefined>(undefined);
  const [, setTick] = useState<number>(0);

  const [globalFilter, setGlobalFilter] = useState<GlobalFilterState>({
    academicYear: '2026-2027',
    semester: 5,
    departmentId: 'dept-cse',
    section: 'Section A',
  });

  // Subscribe to real-time database state mutations
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setTick((prev) => prev + 1);
    });

    // Bootstrap real JWT session and sync PostgreSQL data
    const initSession = async () => {
      try {
        if (api.getToken()) {
          const sessionRes = await api.auth.getSession();
          if (sessionRes && sessionRes.user) {
            setCurrentUser({
              ...sessionRes.user,
              role: sessionRes.role,
              permissions: sessionRes.permissions,
              departmentId: sessionRes.department?.id,
            });
          }
        }
        await db.sync();
      } catch (err) {
        console.warn('[App] Session bootstrap note (running in local mode):', err);
      }
    };

    initSession();
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('[handleSignOut] Error during logout:', err);
    } finally {
      setIsLoginOpen(true);
    }
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView currentUser={currentUser} onNavigate={setCurrentTab} />;
      case 'students':
        return <StudentsView selectedStudentId={selectedStudentDossierId} />;
      case 'faculty':
        return <FacultyView />;
      case 'courses':
        return <CoursesView />;
      case 'timetable':
        return <TimetableView />;
      case 'attendance':
        return <AttendanceView currentUser={currentUser} />;
      case 'assignments':
        return <AssignmentsView currentUser={currentUser} />;
      case 'exams':
        return <ExamsView currentUser={currentUser} />;
      case 'fees':
        return <FeesView currentUser={currentUser} />;
      case 'approvals':
        return <ApprovalsView currentUser={currentUser} />;
      case 'audit':
        return <AuditView />;
      default:
        return <DashboardView currentUser={currentUser} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--color-near-black)' }}>
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Frame */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          currentUser={currentUser}
          onOpenCommand={() => setIsCommandOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        <GlobalFilterBar
          filter={globalFilter}
          onFilterChange={(newVals) => setGlobalFilter({ ...globalFilter, ...newVals })}
        />

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={setCurrentTab}
        onSelectStudent={(stuId) => {
          setSelectedStudentDossierId(stuId);
          setCurrentTab('students');
        }}
      />

      {/* Enterprise Authentication Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          db.sync();
        }}
      />
    </div>
  );
}

export default App;
