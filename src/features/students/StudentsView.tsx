import React, { useState } from 'react';
import { db } from '../../services/db';
import { Student } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Search, User, ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react';

interface StudentsViewProps {
  selectedStudentId?: string;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ selectedStudentId }) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    selectedStudentId ? db.students.find((s) => s.id === selectedStudentId) || db.students[0] : null
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'marks' | 'fees' | 'timeline'>('overview');

  const filteredStudents = db.students.filter(
    (s) =>
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.studentIdNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
            Students Academic Directory
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
            Total {db.students.length} enrolled students in active scope
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} color="var(--color-medium-gray)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by name, roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '32px' }}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Student Export CSV generated.')}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Program & Section</th>
              <th>Attendance</th>
              <th>CGPA</th>
              <th>Fee Status</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id} onClick={() => setSelectedStudent(s)} style={{ cursor: 'pointer' }}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                  {s.rollNumber}
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--color-off-white)' }}>
                    {s.firstName} {s.lastName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                    {s.email}
                  </div>
                </td>
                <td>
                  {s.programName}
                  <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                    {s.sectionName} • Sem {s.semesterNumber}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: s.attendancePercentage >= 75 ? '#81C784' : '#E57373',
                    }}
                  >
                    {s.attendancePercentage}%
                  </span>
                  {s.attendancePercentage < 75 && (
                    <Badge variant="danger" style={{ marginLeft: '6px' }}>
                      Shortage
                    </Badge>
                  )}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                  {s.cgpa}
                </td>
                <td>
                  {s.pendingFees === 0 ? (
                    <Badge variant="success">Paid in Full</Badge>
                  ) : (
                    <Badge variant="warning">${s.pendingFees} Due</Badge>
                  )}
                </td>
                <td>
                  <Badge variant={s.academicStatus === 'active' ? 'default' : 'danger'}>
                    {s.academicStatus}
                  </Badge>
                </td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudent(s);
                    }}
                  >
                    View Dossier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Academic Identity Modal Dossier */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Academic Dossier: ${selectedStudent.firstName} ${selectedStudent.lastName}`}
          subtitle={`Roll: ${selectedStudent.rollNumber} • ID: ${selectedStudent.studentIdNumber}`}
          maxWidth="680px"
        >
          {/* Sub-tabs inside Dossier */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              borderBottom: '1px solid var(--color-border-gray)',
              marginBottom: '16px',
            }}
          >
            {(['overview', 'attendance', 'marks', 'fees', 'timeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--color-white)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--color-white)' : 'var(--color-light-gray)',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '11px' }}>REGISTRATION NUMBER</span>
                <div style={{ fontWeight: 600, color: 'var(--color-white)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  {selectedStudent.registrationNumber}
                </div>
              </div>

              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '11px' }}>DATE OF BIRTH & BLOOD</span>
                <div style={{ fontWeight: 600, color: 'var(--color-white)', marginTop: '2px' }}>
                  {selectedStudent.dateOfBirth} • Blood: {selectedStudent.bloodGroup}
                </div>
              </div>

              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '11px' }}>CONTACT</span>
                <div style={{ fontWeight: 500, color: 'var(--color-off-white)', marginTop: '2px' }}>
                  {selectedStudent.phone}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                  {selectedStudent.email}
                </div>
              </div>

              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '11px' }}>GUARDIAN DETAILS</span>
                <div style={{ fontWeight: 500, color: 'var(--color-off-white)', marginTop: '2px' }}>
                  {selectedStudent.guardianName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                  {selectedStudent.guardianPhone}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Attendance */}
          {activeTab === 'attendance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
                  Overall Term Attendance: <strong style={{ color: 'var(--color-white)' }}>{selectedStudent.attendancePercentage}%</strong>
                </span>
                <Badge variant={selectedStudent.attendancePercentage >= 75 ? 'success' : 'danger'}>
                  {selectedStudent.attendancePercentage >= 75 ? 'Eligible for Finals' : 'Attendance Shortage Alert'}
                </Badge>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Total Sessions</th>
                      <th>Attended</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CS301 Data Structures</td>
                      <td>24</td>
                      <td>22</td>
                      <td style={{ color: '#81C784', fontWeight: 600 }}>91.6%</td>
                    </tr>
                    <tr>
                      <td>CS302 Operating Systems</td>
                      <td>22</td>
                      <td>18</td>
                      <td style={{ color: '#81C784', fontWeight: 600 }}>81.8%</td>
                    </tr>
                    <tr>
                      <td>CS304 Computer Networks</td>
                      <td>20</td>
                      <td>14</td>
                      <td style={{ color: '#FFB74D', fontWeight: 600 }}>70.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Marks */}
          {activeTab === 'marks' && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Examination</th>
                    <th>Course</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {db.marksEntries
                    .filter((m) => m.studentId === selectedStudent.id)
                    .map((m) => (
                      <tr key={m.id}>
                        <td>CAT-1 Internal Exam</td>
                        <td>{m.courseCode}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {m.marksObtained} / {m.maxMarks}
                        </td>
                        <td>
                          <Badge variant="info">{m.grade}</Badge>
                        </td>
                        <td>
                          <Badge variant={m.verified ? 'success' : 'warning'}>
                            {m.verified ? 'Verified & Locked' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: Fees */}
          {activeTab === 'fees' && (
            <div>
              {db.feeDues
                .filter((f) => f.studentId === selectedStudent.id)
                .map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--color-charcoal)',
                      border: '1px solid var(--color-border-gray)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-white)' }}>{f.title}</span>
                      <Badge variant={f.status === 'paid' ? 'success' : 'warning'}>{f.status.toUpperCase()}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '12px' }}>
                      <div>Total: <strong style={{ color: 'var(--color-white)' }}>${f.totalAmount}</strong></div>
                      <div>Paid: <strong style={{ color: '#81C784' }}>${f.paidAmount}</strong></div>
                      <div>Outstanding: <strong style={{ color: f.outstandingAmount > 0 ? '#E57373' : 'var(--color-light-gray)' }}>${f.outstandingAmount}</strong></div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Tab 5: Activity Timeline */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Clock size={16} color="var(--color-medium-gray)" />
                <div>
                  <div style={{ color: 'var(--color-white)', fontWeight: 500 }}>Admission Registered</div>
                  <div style={{ color: 'var(--color-medium-gray)' }}>{selectedStudent.admissionDate} • Matriculated to B.Tech CSE</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <CheckCircle2 size={16} color="#81C784" />
                <div>
                  <div style={{ color: 'var(--color-white)', fontWeight: 500 }}>Semester 4 Results Published</div>
                  <div style={{ color: 'var(--color-medium-gray)' }}>CGPA Achieved: {selectedStudent.cgpa}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <DollarSign size={16} color="var(--color-info)" />
                <div>
                  <div style={{ color: 'var(--color-white)', fontWeight: 500 }}>Semester 5 Fee Invoiced</div>
                  <div style={{ color: 'var(--color-medium-gray)' }}>Tuition & Lab Fee structure assigned</div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
