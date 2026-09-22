import React, { useState } from 'react';
import { db } from '../../services/db';
import { User, Examination } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Award, Lock, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '../../services/rbac';

interface ExamsViewProps {
  currentUser: User;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ currentUser }) => {
  const [exams, setExams] = useState(db.examinations);
  const [selectedExam, setSelectedExam] = useState<Examination>(db.examinations[0]);
  const [marks, setMarks] = useState(db.marksEntries);

  const canLockPublish = hasPermission(currentUser.role, PERMISSIONS.MARKS_LOCK_PUBLISH);

  const handleToggleLock = (exam: Examination) => {
    if (!canLockPublish) {
      alert(`Access Denied: Role [${currentUser.role}] lacks [marks.lock_publish] permission.`);
      return;
    }

    exam.isLocked = !exam.isLocked;
    exam.isPublished = exam.isLocked;

    db.logAudit(
      currentUser,
      exam.isLocked ? 'APPROVE' : 'UPDATE',
      'examinations',
      exam.id,
      { isLocked: !exam.isLocked },
      { isLocked: exam.isLocked, isPublished: exam.isPublished },
      `Examination results officially ${exam.isLocked ? 'LOCKED & PUBLISHED' : 'UNLOCKED'} by Exam Cell`
    );

    setExams([...db.examinations]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
            Examinations & Marks Verification
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
            Semester 5 • Continuous Assessment & Final Term Grades
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${selectedExam.isLocked ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => handleToggleLock(selectedExam)}
          >
            <Lock size={13} /> {selectedExam.isLocked ? 'Unlock Results (Requires Approval)' : 'Lock & Publish Results'}
          </button>
        </div>
      </div>

      {/* Exam Tab Pills */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {exams.map((exam) => {
          const isSelected = selectedExam.id === exam.id;
          return (
            <button
              key={exam.id}
              onClick={() => setSelectedExam(exam)}
              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {exam.isLocked ? <Lock size={12} /> : <Award size={12} />}
              <span>{exam.title}</span>
              <Badge variant={exam.isLocked ? 'success' : 'warning'}>
                {exam.isLocked ? 'Official & Published' : 'Draft / Grading'}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Examination Status Warning Notice */}
      {selectedExam.isLocked ? (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: '#A5D6A7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={16} />
          <span>Results for this examination are officially locked. Any subsequent changes require a formal HOD & Exam Cell approval workflow.</span>
        </div>
      ) : (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: '#FFB74D',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>Draft Grading Mode: Faculty members may adjust scores prior to official verification and final lock.</span>
        </div>
      )}

      {/* Marks Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Marks Obtained</th>
              <th>Maximum</th>
              <th>Grade</th>
              <th>Audit Status</th>
            </tr>
          </thead>
          <tbody>
            {marks.map((m) => (
              <tr key={m.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                  {m.studentRoll}
                </td>
                <td style={{ fontWeight: 500, color: 'var(--color-off-white)' }}>
                  {m.studentName}
                </td>
                <td>{m.courseCode} Data Structures</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                  {m.marksObtained}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-medium-gray)' }}>
                  {m.maxMarks}
                </td>
                <td>
                  <Badge variant="info">{m.grade}</Badge>
                </td>
                <td>
                  <Badge variant={selectedExam.isLocked ? 'success' : 'default'}>
                    {selectedExam.isLocked ? 'Immutable' : 'Editable'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
