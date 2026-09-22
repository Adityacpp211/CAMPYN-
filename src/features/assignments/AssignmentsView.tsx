import React, { useState } from 'react';
import { db } from '../../services/db';
import { Assignment, Submission, User } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FileText, Clock, CheckCircle2, Upload, ArrowRight } from 'lucide-react';



interface AssignmentsViewProps {
  currentUser: User;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({ currentUser }) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(db.assignments[0]);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const submissions = selectedAssignment
    ? db.submissions.filter((s) => s.assignmentId === selectedAssignment.id)
    : [];

  const handleOpenGrade = (sub: Submission) => {
    setGradingSubmission(sub);
    setGradeMarks(sub.marksAwarded || 0);
    setGradeFeedback(sub.feedback || '');
  };

  const handleCommitGrade = () => {
    if (!gradingSubmission || !selectedAssignment) return;
    gradingSubmission.marksAwarded = Number(gradeMarks);
    gradingSubmission.feedback = gradeFeedback;
    gradingSubmission.status = 'graded';

    db.logAudit(
      currentUser,
      'UPDATE',
      'assignment_submission',
      gradingSubmission.id,
      { status: 'submitted' },
      { marksAwarded: gradeMarks, feedback: gradeFeedback, status: 'graded' },
      `Assignment evaluated for ${gradingSubmission.studentName}`
    );

    setGradingSubmission(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
          Assignments & Submission Evaluations
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
          Continuous assessment and code deliverables review
        </p>
      </div>

      {/* Assignment Cards List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {db.assignments.map((asg) => {
          const isSelected = selectedAssignment?.id === asg.id;
          return (
            <div
              key={asg.id}
              onClick={() => setSelectedAssignment(asg)}
              className="surface-card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--color-white)' : 'var(--color-border-gray)',
                backgroundColor: isSelected ? 'var(--color-charcoal)' : 'var(--color-dark-charcoal)',
                transition: 'all 120ms ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Badge variant="default">{asg.courseCode}</Badge>
                <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                  Max Marks: <strong style={{ color: 'var(--color-white)' }}>{asg.maxMarks}</strong>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-white)', marginTop: '8px' }}>
                {asg.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-light-gray)', marginTop: '4px' }}>
                {asg.description}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--color-border-gray)',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#FFB74D' }}>Due: {asg.dueDate}</span>
                <span style={{ color: 'var(--color-light-gray)' }}>
                  {asg.submissionCount} of {asg.totalStudents} Submitted
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions Roster */}
      {selectedAssignment && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-white)' }}>
              Submissions for {selectedAssignment.courseCode} ({submissions.length})
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--color-medium-gray)' }}>
              Click any student row to grade or comment
            </span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Submitted Timestamp</th>
                  <th>Status</th>
                  <th>Marks (Max {selectedAssignment.maxMarks})</th>
                  <th>Feedback</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                      {sub.studentRoll}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--color-off-white)' }}>
                      {sub.studentName}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-light-gray)' }}>
                      {sub.submittedAt}
                      {sub.isLate && <Badge variant="danger" style={{ marginLeft: '6px' }}>Late</Badge>}
                    </td>
                    <td>
                      <Badge variant={sub.status === 'graded' ? 'success' : 'warning'}>
                        {sub.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                      {sub.marksAwarded !== undefined ? `${sub.marksAwarded} / ${selectedAssignment.maxMarks}` : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-light-gray)', maxWidth: '240px' }}>
                      {sub.feedback || 'No feedback recorded.'}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleOpenGrade(sub)}>
                        {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {gradingSubmission && selectedAssignment && (
        <Modal
          isOpen={!!gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          title={`Evaluate Submission: ${gradingSubmission.studentName}`}
          subtitle={`Roll: ${gradingSubmission.studentRoll} • Assignment: ${selectedAssignment.title}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-light-gray)', display: 'block', marginBottom: '6px' }}>
                Score / Marks Awarded (Max: {selectedAssignment.maxMarks}) *
              </label>
              <input
                type="number"
                min="0"
                max={selectedAssignment.maxMarks}
                value={gradeMarks}
                onChange={(e) => setGradeMarks(Number(e.target.value))}
                className="input-base"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-light-gray)', display: 'block', marginBottom: '6px' }}>
                Qualitative Feedback for Student
              </label>
              <textarea
                rows={3}
                placeholder="Specific guidance, code review comments, algorithm optimization notes..."
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                className="input-base"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button className="btn btn-outline" onClick={() => setGradingSubmission(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCommitGrade}>
                Save Grade & Notify Student
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
