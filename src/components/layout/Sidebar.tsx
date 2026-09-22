import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  UserCheck,
  FileText,
  Award,
  CreditCard,
  CheckSquare,
  ShieldAlert,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { hasPermission, PERMISSIONS } from '../../services/rbac';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onSwitchRole,
}) => {
  const allRoles: UserRole[] = [
    'SUPER_ADMIN',
    'COLLEGE_ADMIN',
    'PRINCIPAL',
    'HOD',
    'FACULTY',
    'STUDENT',
    'ACCOUNTANT',
    'AUDITOR',
  ];

  const navSections = [
    {
      title: 'CORE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
      ],
    },
    {
      title: 'ACADEMIC REPOSITORY',
      items: [
        { id: 'students', label: 'Students', icon: GraduationCap, permission: PERMISSIONS.STUDENTS_READ },
        { id: 'faculty', label: 'Faculty Roster', icon: Users, permission: PERMISSIONS.FACULTY_READ },
        { id: 'courses', label: 'Departments & Courses', icon: BookOpen, permission: null },
        { id: 'timetable', label: 'Class Timetable', icon: Calendar, permission: PERMISSIONS.TIMETABLE_READ },
        { id: 'attendance', label: 'Attendance System', icon: UserCheck, permission: PERMISSIONS.ATTENDANCE_READ },
      ],
    },
    {
      title: 'ACADEMIC OPERATIONS',
      items: [
        { id: 'assignments', label: 'Assignments', icon: FileText, permission: PERMISSIONS.ASSIGNMENTS_READ },
        { id: 'exams', label: 'Exams & Marks', icon: Award, permission: PERMISSIONS.MARKS_READ },
        { id: 'fees', label: 'Fees & Ledgers', icon: CreditCard, permission: PERMISSIONS.FEES_READ },
      ],
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        { id: 'approvals', label: 'Approval Queue', icon: CheckSquare, permission: PERMISSIONS.APPROVALS_MANAGE },
        { id: 'audit', label: 'Immutable Audit Logs', icon: ShieldAlert, permission: PERMISSIONS.AUDIT_READ },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--color-dark-charcoal)',
        borderRight: '1px solid var(--color-border-gray)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Organization Title */}
      <div
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--color-border-gray)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'var(--color-white)',
            color: 'var(--color-black)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '-0.03em',
          }}
        >
          OS
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-white)', letterSpacing: '-0.01em' }}>
            CampusOS
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={10} /> Apex Institute of Tech
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
        {navSections.map((section) => {
          // Filter items based on user role permissions
          const visibleItems = section.items.filter(
            (item) => !item.permission || hasPermission(currentUser.role, item.permission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} style={{ marginBottom: '18px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'var(--color-medium-gray)',
                  padding: '4px 10px 8px 10px',
                  textTransform: 'uppercase',
                }}
              >
                {section.title}
              </div>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--color-charcoal)' : 'transparent',
                      color: isActive ? 'var(--color-white)' : 'var(--color-light-gray)',
                      border: isActive ? '1px solid var(--color-border-gray)' : '1px solid transparent',
                      fontSize: '13px',
                      fontWeight: isActive ? 500 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '2px',
                      transition: 'all 100ms ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? 'var(--color-white)' : 'var(--color-medium-gray)'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Role Switcher & User Profile Footprint */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--color-border-gray)',
          backgroundColor: 'var(--color-near-black)',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginBottom: '6px' }}>
          SWITCH ACTIVE ROLE (RBAC):
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={currentUser.role}
            onChange={(e) => onSwitchRole(e.target.value as UserRole)}
            className="input-base"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: 'var(--color-dark-charcoal)',
            }}
          >
            {allRoles.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-dark-gray)',
              border: '1px solid var(--color-border-gray)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: 'var(--color-white)',
              fontWeight: 600,
            }}
          >
            {currentUser.firstName[0]}
            {currentUser.lastName[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-off-white)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {currentUser.firstName} {currentUser.lastName}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-medium-gray)' }}>
              {currentUser.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
