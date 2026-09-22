import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ShieldCheck, Search, Terminal, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState(db.auditLogs);
  const [search, setSearch] = useState('');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);
  const [verifyState, setVerifyState] = useState<{
    loading: boolean;
    verified: boolean;
    isValid?: boolean;
    totalRecords?: number;
    error?: string;
  }>({ loading: false, verified: false });

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setLogs([...db.auditLogs]);
    });
    return unsub;
  }, []);

  const handleVerifyIntegrity = async () => {
    setVerifyState({ loading: true, verified: false });
    try {
      const res = await api.audit.verify();
      setVerifyState({
        loading: false,
        verified: true,
        isValid: res.isValid,
        totalRecords: res.totalRecords,
        error: res.error,
      });
    } catch (err: any) {
      setVerifyState({
        loading: false,
        verified: true,
        isValid: false,
        error: err.message,
      });
    }
  };

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
            Tamper-evident system activity ledger tracking every state transition with SHA-256 hash chaining
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleVerifyIntegrity}
            disabled={verifyState.loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ShieldCheck size={14} color="#81C784" />
            <span>{verifyState.loading ? 'Verifying Chain...' : 'Verify Cryptographic Integrity'}</span>
          </button>

          <div style={{ position: 'relative', width: '240px' }}>
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
      </div>

      {/* Verification Banner */}
      {verifyState.verified && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: verifyState.isValid ? 'rgba(46, 125, 50, 0.15)' : 'rgba(211, 47, 47, 0.15)',
            border: `1px solid ${verifyState.isValid ? 'var(--color-success)' : 'var(--color-danger)'}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {verifyState.isValid ? (
              <CheckCircle2 size={18} color="var(--color-success)" />
            ) : (
              <ShieldAlert size={18} color="var(--color-danger)" />
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: verifyState.isValid ? '#81C784' : '#FF8A80' }}>
                {verifyState.isValid
                  ? 'Cryptographic Ledger Integrity Confirmed'
                  : 'Ledger Integrity Violation Detected'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-light-gray)', marginTop: '2px' }}>
                {verifyState.isValid
                  ? `All ${verifyState.totalRecords} immutable records verified. SHA-256 hash chains and cryptographic parent pointers are 100% unbroken.`
                  : verifyState.error || 'Discrepancy detected in hash chain.'}
              </div>
            </div>
          </div>
          <Badge variant={verifyState.isValid ? 'success' : 'danger'}>
            {verifyState.isValid ? '100% Intact' : 'Tampered'}
          </Badge>
        </div>
      )}

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
              <th>SHA-256 Hash Link</th>
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
                  <div style={{ fontWeight: 500, color: 'var(--color-white)' }}>{log.actorEmail}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-medium-gray)' }}>{log.role}</div>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-off-white)' }}>
                    {log.entity}
                  </span>
                </td>
                <td style={{ maxWidth: '300px', fontSize: '12px', color: 'var(--color-light-gray)' }}>
                  {log.reason || '—'}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-medium-gray)' }}>
                  {(log as any).hash ? `${(log as any).hash.substring(0, 16)}...` : 'genesis'}
                </td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setInspectLog(log)}
                    style={{ padding: '3px 8px' }}
                  >
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspect Diff Modal */}
      {inspectLog && (
        <Modal
          isOpen={true}
          onClose={() => setInspectLog(null)}
          title={`Audit Event Inspection: ${inspectLog.action} (${inspectLog.id})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                padding: '12px',
                backgroundColor: 'var(--color-charcoal)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-medium-gray)' }}>Actor:</span> {inspectLog.actorEmail}
              </div>
              <div>
                <span style={{ color: 'var(--color-medium-gray)' }}>Role:</span> {inspectLog.role}
              </div>
              <div>
                <span style={{ color: 'var(--color-medium-gray)' }}>Target Entity:</span> {inspectLog.entity} (ID: {inspectLog.entityId})
              </div>
              <div>
                <span style={{ color: 'var(--color-medium-gray)' }}>IP Address:</span> {inspectLog.ipAddress}
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--color-medium-gray)' }}>Cryptographic Hash:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#81C784', wordBreak: 'break-all', marginTop: '2px' }}>
                  {(inspectLog as any).hash || 'Genesis block signature verified'}
                </div>
              </div>
            </div>

            {/* JSON Before / After Diffs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-light-gray)', marginBottom: '6px' }}>
                  Previous State
                </div>
                <pre
                  style={{
                    backgroundColor: 'var(--color-black)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-gray)',
                    color: '#E57373',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}
                >
                  {inspectLog.oldValues ? JSON.stringify(inspectLog.oldValues, null, 2) : 'null (Created)'}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-light-gray)', marginBottom: '6px' }}>
                  Mutated State
                </div>
                <pre
                  style={{
                    backgroundColor: 'var(--color-black)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-gray)',
                    color: '#81C784',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}
                >
                  {inspectLog.newValues ? JSON.stringify(inspectLog.newValues, null, 2) : 'null (Deleted)'}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn btn-secondary" onClick={() => setInspectLog(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
