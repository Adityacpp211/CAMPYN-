import React from 'react';
import { db } from '../../services/db';
import { Badge } from '../../components/ui/Badge';
import { BookOpen, User, Award } from 'lucide-react';

export const CoursesView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
          Departments & Course Catalog
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
          Curriculum, syllabus modules, and course-to-faculty allocations
        </p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Credits</th>
              <th>Type</th>
              <th>Instructor</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            {db.courses.map((c) => (
              <tr key={c.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                  {c.code}
                </td>
                <td style={{ fontWeight: 500, color: 'var(--color-off-white)' }}>
                  {c.name}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {c.credits} Credits
                </td>
                <td>
                  <Badge variant={c.type === 'core' ? 'default' : 'info'}>
                    {c.type.toUpperCase()}
                  </Badge>
                </td>
                <td style={{ color: 'var(--color-light-gray)' }}>
                  {c.facultyName}
                </td>
                <td>Semester {c.semester}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
