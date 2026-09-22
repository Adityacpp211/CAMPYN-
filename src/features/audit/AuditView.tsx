import React, { useState } from 'react';
import { db } from '../../services/db';
import { AuditLog } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ShieldAlert, Search, Terminal, Eye } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState(db.auditLogs);
  const [search, setSearch] = useState('');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-white)' }}>
            Cryptographic Append-Only Audit Stream
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-light-gray)' }}>
            Tamper-evident system activity ledger tracking every state transition
          </p>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} color="var(--color-medium-gray)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search action, actor, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base"
            style={{ paddingLeft: '32px' }}
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Actor & Role</th>
              <th>Target Entity</th>
              <th>Documented Rationale / Reason</th>
              <th>IP Address</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-light-gray)' }}>
                  {log.timestamp}
                </td>
                <td>
                  <Badge
                    variant={
                      log.action.includes('CHANGE') || log.action === 'UPDATE'
                        ? 'warning'
                        : log.action === 'APPROVE' || log.action === 'PAYMENT'
                        ? 'success'
                        : log.action === 'DELETE' || log.action === 'REFUND' || log.action === 'REJECT'
                        ? 'danger'
                        : 'default'
                    }
                  >
                    {log.action}
                  </Badge>
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--color-off-white)' }}>
                    {log.actorEmail}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-medium-gray)' }}>
                    Role: {log.role}
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {log.entity} <span style={{ color: 'var(--color-medium-gray)' }}>({log.entityId})</span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--color-light-gray)', maxWidth: '280px' }}>
                  {log.reason || 'Standard system commit'}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-medium-gray)' }}>
                  {log.ipAddress}
                </td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => setInspectLog(log)}>
                    <Eye size={12} /> Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Diff Inspector Modal */}
      {inspectLog && (
        <Modal
          isOpen={!!inspectLog}
          onClose={() => setInspectLog(null)}
          title={`Audit Record: ${inspectLog.action} on ${inspectLog.entity}`}
          subtitle={`Log ID: ${inspectLog.id} • ${inspectLog.timestamp}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '11px' }}>ACTOR</span>
                <div style={{ fontWeight: 600, color: 'var(--color-white)', marginTop: '2px' }}>
                  {inspectLog.actorEmail}
                </div>
                <div style={{ color: 'var(--color-medium-gray)' }}>Role: {inspectLog.role}</div>
              </div>

              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '11px' }}>TARGET ENTITY</span>
                <div style={{ fontWeight: 600, color: 'var(--color-white)', marginTop: '2px' }}>
                  {inspectLog.entity}
                </div>
                <div style={{ color: 'var(--color-medium-gray)' }}>Entity ID: {inspectLog.entityId}</div>
              </div>
            </div>

            <div className="surface-card">
              <span className="text-secondary" style={{ fontSize: '11px' }}>DOCUMENTED JUSTIFICATION</span>
              <div style={{ color: 'var(--color-off-white)', marginTop: '4px', fontStyle: 'italic' }}>
                "{inspectLog.reason || 'None provided.'}"
              </div>
            </div>

            {/* Before vs After State JSON Diffs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#E57373', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  PREVIOUS STATE (OLD)
                </span>
                <pre
                  style={{
                    backgroundColor: 'var(--color-near-black)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-gray)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    overflowX: 'auto',
                    color: 'var(--color-light-gray)',
                  }}
                >
                  {JSON.stringify(inspectLog.oldValues || { state: 'initial_or_unchanged' }, null, 2)}
                </pre>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#81C784', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  MUTATED STATE (NEW)
                </span>
                <pre
                  style={{
                    backgroundColor: 'var(--color-near-black)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-gray)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    overflowX: 'auto',
                    color: '#C8E6C9',
                  }}
                >
                  {JSON.stringify(inspectLog.newValues || { state: 'deleted_or_finalized' }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
