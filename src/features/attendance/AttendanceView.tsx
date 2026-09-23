import React, { useState } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { User, AttendanceRecord } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ShieldAlert, History, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface AttendanceViewProps {
  currentUser: User;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser: _currentUser }) => {
  const { records, loading, error, updateRecord } = useAttendance();
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present');
  const [editReason, setEditReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setNewStatus(rec.status);
    setEditReason('');
  };

  const handleCommitEdit = async () => {
    if (!editingRecord || !editReason.trim()) {
      alert('A valid justification reason (min 5 characters) is mandatory for auditable attendance edits.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateRecord(editingRecord.id, newStatus, editReason);
      setEditingRecord(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAuditHistory = async () => {
    try {
      const logs = await api.audit.list({ action: 'ATTENDANCE_CHANGE' });
      setAuditLogs(logs);
      setShowHistory(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load audit trail');
    }
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
            Auditable Attendance System
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
            Course: Data Structures (CS301) • Section A • Session Slot: 09:00 - 10:00 AM
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" onClick={openAuditHistory}>
            <History size={14} /> Audit Trail
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#f87171', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="surface-card">
          <span className="text-secondary" style={{ fontSize: '11px' }}>TOTAL ENROLLED</span>
          <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-white)', marginTop: '4px' }}>
            {records.length} Students
          </div>
        </div>
        <div className="surface-card">
          <span className="text-secondary" style={{ fontSize: '11px' }}>PRESENT TODAY</span>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#81C784', marginTop: '4px' }}>
            {presentCount} ({records.length > 0 ? ((presentCount / records.length) * 100).toFixed(0) : 0}%)
          </div>
        </div>
        <div className="surface-card">
          <span className="text-secondary" style={{ fontSize: '11px' }}>ABSENT / ON LEAVE</span>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#E57373', marginTop: '4px' }}>
            {absentCount}
          </div>
        </div>
      </div>

      {/* Attendance Roster Grid */}
      <div className="table-container">
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--color-medium-gray)' }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ marginLeft: '10px', fontSize: '13px' }}>Loading session roster...</span>
          </div>
        )}

        {!loading && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Recorded Status</th>
                <th>Recorded At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-medium-gray)' }}>
                    No records found for this session.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-white)' }}>
                      {r.studentRoll}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--color-off-white)' }}>
                      {r.studentName}
                    </td>
                    <td>
                      <Badge
                        variant={
                          r.status === 'present'
                            ? 'success'
                            : r.status === 'absent'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {r.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-medium-gray)' }}>
                      {new Date(r.recordedAt).toLocaleString()}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(r)}>
                        Edit Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Mandatory Audit Modification Modal */}
      {editingRecord && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title={`Auditable Correction: ${editingRecord.studentName}`}
          subtitle={`Current Status: ${editingRecord.status.toUpperCase()} • Roll: ${editingRecord.studentRoll}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                color: '#FFB74D',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <ShieldAlert size={16} />
              <span>Silent modifications are forbidden. This edit will be permanently recorded in the append-only audit log.</span>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-light-gray)', display: 'block', marginBottom: '6px' }}>
                New Attendance Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="input-base"
              >
                <option value="present">PRESENT</option>
                <option value="absent">ABSENT</option>
                <option value="late">LATE</option>
                <option value="excused">EXCUSED (Medical / Authorized Duty)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-light-gray)', display: 'block', marginBottom: '6px' }}>
                Mandatory Justification / Reason *
              </label>
              <textarea
                rows={3}
                placeholder="State the official rationale (e.g. Student submitted signed medical certificate)..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="input-base"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button className="btn btn-outline" onClick={() => setEditingRecord(null)} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCommitEdit} disabled={isSubmitting}>
                {isSubmitting ? 'Signing...' : 'Commit with Audit Signature'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Audit Trail Drawer Modal */}
      {showHistory && (
        <Modal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          title="Attendance Modification Audit Log"
          subtitle="Append-only cryptographic timeline of attendance adjustments"
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-medium-gray)', fontSize: '13px' }}>
                No attendance adjustment audit logs found.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--color-charcoal)',
                    border: '1px solid var(--color-border-gray)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge variant="warning">{log.action}</Badge>
                    <span style={{ color: 'var(--color-medium-gray)' }}>{log.timestamp}</span>
                  </div>
                  <div style={{ marginTop: '6px', color: 'var(--color-off-white)' }}>
                    Actor: <strong>{log.actorEmail}</strong> ({log.role})
                  </div>
                  <div style={{ marginTop: '4px', color: 'var(--color-light-gray)' }}>
                    Reason: <em>"{log.reason}"</em>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-medium-gray)', fontFamily: 'var(--font-mono)' }}>
                    Diff: {JSON.stringify(log.oldValues)} ➔ {JSON.stringify(log.newValues)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
