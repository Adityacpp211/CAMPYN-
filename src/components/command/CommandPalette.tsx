import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Calendar, BookOpen, DollarSign, CheckSquare, ShieldAlert, ArrowRight, User } from 'lucide-react';
import { api } from '../../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectStudent?: (studentId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectStudent,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [matchedStudents, setMatchedStudents] = useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live student search from PostgreSQL API
  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setMatchedStudents([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.students.list({ search: query.trim(), limit: 5 });
        const list = Array.isArray(res) ? res : res.data || [];
        setMatchedStudents(
          list.map((s: any) => ({
            id: `student-${s.id}`,
            label: `${s.firstName || ''} ${s.lastName || ''} (${s.rollNumber || ''})`,
            detail: `Roll: ${s.rollNumber} • ${s.programName || 'Student'}`,
            studentId: s.id,
            category: 'Students',
            icon: User,
          }))
        );
      } catch (err) {
        console.warn('[CommandPalette] Student search:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  // Navigation commands
  const navCommands = [
    { id: 'nav-students', label: 'Go to Students Directory', tab: 'students', icon: User, category: 'Navigation' },
    { id: 'nav-attendance', label: 'Open Attendance System', tab: 'attendance', icon: UserCheck, category: 'Navigation' },
    { id: 'nav-timetable', label: 'View Class Timetable & Conflicts', tab: 'timetable', icon: Calendar, category: 'Navigation' },
    { id: 'nav-assignments', label: 'Open Course Assignments', tab: 'assignments', icon: BookOpen, category: 'Navigation' },
    { id: 'nav-exams', label: 'Manage Examinations & Marks', tab: 'exams', icon: CheckSquare, category: 'Navigation' },
    { id: 'nav-fees', label: 'View Fee Ledgers & Payments', tab: 'fees', icon: DollarSign, category: 'Navigation' },
    { id: 'nav-approvals', label: 'Pending Workflow Approvals', tab: 'approvals', icon: CheckSquare, category: 'Navigation' },
    { id: 'nav-audit', label: 'Inspect Immutable Audit Logs', tab: 'audit', icon: ShieldAlert, category: 'Navigation' },
  ];

  const filteredCommands = navCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const combinedItems = query.trim() === '' ? navCommands : [...filteredCommands, ...matchedStudents];

  const handleSelect = (item: (typeof combinedItems)[0]) => {
    if ('tab' in item && item.tab) {
      onNavigate(item.tab);
      onClose();
    } else if ('studentId' in item && item.studentId) {
      onNavigate('students');
      if (onSelectStudent) onSelectStudent(item.studentId);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: 'var(--color-dark-charcoal)',
          border: '1px solid var(--color-border-gray)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border-gray)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--color-charcoal)',
          }}
        >
          <Search size={18} color="var(--color-light-gray)" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search students, courses..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-white)',
              fontSize: '15px',
              fontFamily: 'inherit',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              backgroundColor: 'var(--color-dark-gray)',
              border: '1px solid var(--color-border-gray)',
              borderRadius: '4px',
              color: 'var(--color-light-gray)',
            }}
          >
            ESC
          </span>
        </div>

        {/* Command List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
          {combinedItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-medium-gray)', fontSize: '13px' }}>
              No matching commands or entities found for "{query}".
            </div>
          ) : (
            combinedItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--color-dark-gray)' : 'transparent',
                    border: isSelected ? '1px solid var(--color-border-gray)' : '1px solid transparent',
                    transition: 'all 80ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        color: isSelected ? 'var(--color-white)' : 'var(--color-light-gray)',
                        display: 'flex',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-off-white)' }}>
                        {item.label}
                      </div>
                      {'detail' in item && item.detail && (
                        <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)', marginTop: '2px' }}>
                          {item.detail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                      {item.category}
                    </span>
                    <ArrowRight size={13} color="var(--color-light-gray)" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
