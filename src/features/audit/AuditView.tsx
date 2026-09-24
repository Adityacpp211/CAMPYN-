import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ShieldCheck, Search, Eye, ShieldAlert, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export const AuditView: React.FC = () => {
  const { logs, loading, error, verifyState, verifyIntegrity, refetch } = useAuditLogs();
  const [search, setSearch] = useState('');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  const handleVerifyIntegrity = async () => {
    await verifyIntegrity();
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

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#f87171', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => refetch()}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

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
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--color-medium-gray)' }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ marginLeft: '10px', fontSize: '13px' }}>Loading immutable audit stream...</span>
          </div>
        )}

        {!loading && (
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
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-medium-gray)' }}>
                    No audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
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
                        style={{ padding: '4px 8px' }}
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Inspect Log Entry Modal */}
      {inspectLog && (
        <Modal
          isOpen={!!inspectLog}
          onClose={() => setInspectLog(null)}
          title={`Audit Payload Inspector: ${inspectLog.action}`}
          subtitle={`Entity: ${inspectLog.entity} • ID: ${inspectLog.entityId}`}
          maxWidth="620px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '10px' }}>ACTOR</span>
                <div style={{ color: 'var(--color-white)', fontWeight: 500, marginTop: '2px' }}>
                  {inspectLog.actorEmail}
                </div>
              </div>
              <div className="surface-card">
                <span className="text-secondary" style={{ fontSize: '10px' }}>ROLE AT EVENT</span>
                <div style={{ color: 'var(--color-white)', fontWeight: 500, marginTop: '2px' }}>
                  {inspectLog.role}
                </div>
              </div>
            </div>

            <div>
              <span className="text-secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>PREVIOUS VALUES</span>
              <pre style={{ margin: 0, padding: '10px', backgroundColor: 'var(--color-black)', borderRadius: 'var(--radius-sm)', color: '#FF8A80', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                {JSON.stringify(inspectLog.oldValues || {}, null, 2)}
              </pre>
            </div>

            <div>
              <span className="text-secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>NEW COMMITTED VALUES</span>
              <pre style={{ margin: 0, padding: '10px', backgroundColor: 'var(--color-black)', borderRadius: 'var(--radius-sm)', color: '#81C784', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                {JSON.stringify(inspectLog.newValues || {}, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
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
