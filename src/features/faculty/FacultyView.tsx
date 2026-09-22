import React from 'react';
import { db } from '../../services/db';
import { Badge } from '../../components/ui/Badge';
import { Mail, Phone, Award, BookOpen } from 'lucide-react';

export const FacultyView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
          Faculty & Academic Staff Roster
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
          Instructional faculty, course assignments, and research specializations
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {db.faculty.map((f) => (
          <div key={f.id} className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Badge variant="info">{f.employeeId}</Badge>
              <Badge variant={f.designation.includes('HOD') ? 'success' : 'default'}>
                {f.designation}
              </Badge>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-white)', marginTop: '10px' }}>
              {f.firstName} {f.lastName}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
              {f.qualification}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--color-light-gray)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={13} color="var(--color-medium-gray)" /> {f.specialization}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} color="var(--color-medium-gray)" /> {f.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={13} color="var(--color-medium-gray)" /> Courses: {f.coursesHandled.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
