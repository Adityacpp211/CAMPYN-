import React from 'react';
import { Filter, ChevronRight } from 'lucide-react';
import { GlobalFilterState } from '../../types';

interface GlobalFilterBarProps {
  filter: GlobalFilterState;
  onFilterChange: (newFilter: Partial<GlobalFilterState>) => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ filter, onFilterChange }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-dark-charcoal)',
        borderBottom: '1px solid var(--color-border-gray)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-light-gray)' }}>
          <Filter size={13} />
          <span style={{ fontWeight: 500 }}>Active Scope:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Academic Year */}
          <select
            value={filter.academicYear}
            onChange={(e) => onFilterChange({ academicYear: e.target.value })}
            className="input-base"
            style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
          >
            <option value="2026-2027">AY 2026-2027</option>
            <option value="2025-2026">AY 2025-2026</option>
          </select>

          <ChevronRight size={12} color="var(--color-medium-gray)" />

          {/* Department */}
          <select
            value={filter.departmentId}
            onChange={(e) => onFilterChange({ departmentId: e.target.value })}
            className="input-base"
            style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
          >
            <option value="dept-cse">Computer Science (CSE)</option>
            <option value="dept-ece">Electronics (ECE)</option>
            <option value="dept-it">Information Tech (IT)</option>
            <option value="dept-me">Mechanical Eng (ME)</option>
          </select>

          <ChevronRight size={12} color="var(--color-medium-gray)" />

          {/* Semester */}
          <select
            value={filter.semester}
            onChange={(e) => onFilterChange({ semester: Number(e.target.value) })}
            className="input-base"
            style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
          >
            <option value={5}>Semester 5 (Fall 2026)</option>
            <option value={4}>Semester 4 (Spring 2026)</option>
            <option value={3}>Semester 3</option>
          </select>

          <ChevronRight size={12} color="var(--color-medium-gray)" />

          {/* Section */}
          <select
            value={filter.section}
            onChange={(e) => onFilterChange({ section: e.target.value })}
            className="input-base"
            style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
          >
            <option value="Section A">Section A</option>
            <option value="Section B">Section B</option>
          </select>
        </div>
      </div>

      <div style={{ color: 'var(--color-medium-gray)', fontSize: '11px' }}>
        Press <kbd style={{ padding: '2px 5px', background: 'var(--color-charcoal)', border: '1px solid var(--color-border-gray)', borderRadius: '3px', color: 'var(--color-light-gray)' }}>Ctrl + K</kbd> to search & jump
      </div>
    </div>
  );
};
