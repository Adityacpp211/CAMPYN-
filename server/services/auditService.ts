import crypto from 'crypto';
import { dbClient, DbClient } from '../db';
import { config } from '../config';

export interface AuditRecordInput {
  institutionId?: string;
  actorId: string;
  actorEmail: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function canonicalJson(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return canonicalJson(parsed);
    } catch {
      return val;
    }
  }
  if (typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) {
    return '[' + val.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  return '{' + keys.map((k) => `"${k}":${canonicalJson(val[k])}`).join(',') + '}';
}

export function computeAuditHash(
  previousHash: string,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  oldValues: any,
  newValues: any,
  reason: string | null | undefined,
  timestamp: string | Date
): string {
  const normOld = canonicalJson(oldValues);
  const normNew = canonicalJson(newValues);
  const normReason = reason || '';
  const timeStr = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const payload = `${previousHash}|${actorId}|${action}|${entity}|${entityId}|${normOld}|${normNew}|${normReason}|${timeStr}|${config.auditSalt}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function createAuditLog(
  input: AuditRecordInput,
  client?: DbClient
): Promise<any> {
  const db = client || dbClient;

  // Fetch the latest audit log entry to get the previous_hash
  const latestLogRes = await db.query(
    'SELECT hash FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 1'
  );

  const previousHash = latestLogRes.rows.length > 0 && latestLogRes.rows[0].hash
    ? latestLogRes.rows[0].hash
    : GENESIS_HASH;

  const now = new Date();
  const timestamp = now.toISOString();

  const hash = computeAuditHash(
    previousHash,
    input.actorId,
    input.action,
    input.entity,
    input.entityId,
    input.oldValues,
    input.newValues,
    input.reason,
    timestamp
  );

  // If institutionId not provided, look up default
  let institutionId = input.institutionId;
  if (!institutionId) {
    const instRes = await db.query('SELECT id FROM institutions LIMIT 1');
    institutionId = instRes.rows[0]?.id;
  }

  const insertSql = `
    INSERT INTO audit_logs (
      institution_id, actor_id, actor_email, role, action, entity, entity_id,
      old_values, new_values, reason, ip_address, user_agent, hash, previous_hash, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    ) RETURNING *
  `;

  const values = [
    institutionId,
    input.actorId,
    input.actorEmail,
    input.role,
    input.action,
    input.entity,
    input.entityId,
    input.oldValues ? JSON.stringify(input.oldValues) : null,
    input.newValues ? JSON.stringify(input.newValues) : null,
    input.reason || null,
    input.ipAddress || '127.0.0.1',
    input.userAgent || 'CampusOS-Backend',
    hash,
    previousHash,
    timestamp,
  ];

  const result = await db.query(insertSql, values);
  return result.rows[0];
}

export async function verifyAuditLedger(): Promise<{
  isValid: boolean;
  totalRecords: number;
  tamperedIndex?: number;
  tamperedRecordId?: string;
  error?: string;
}> {
  const result = await dbClient.query(
    'SELECT * FROM audit_logs ORDER BY created_at ASC, id ASC'
  );

  const logs = result.rows;
  if (logs.length === 0) {
    return { isValid: true, totalRecords: 0 };
  }

  let runningHash = GENESIS_HASH;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const expectedPrev = runningHash;

    if (log.previous_hash && log.previous_hash !== expectedPrev) {
      return {
        isValid: false,
        totalRecords: logs.length,
        tamperedIndex: i,
        tamperedRecordId: log.id,
        error: `Broken chain link at index ${i}: expected previous_hash ${expectedPrev}, found ${log.previous_hash}`,
      };
    }

    const calculatedHash = computeAuditHash(
      expectedPrev,
      log.actor_id,
      log.action,
      log.entity,
      log.entity_id,
      log.old_values,
      log.new_values,
      log.reason,
      log.created_at
    );

    if (log.hash && log.hash !== calculatedHash) {
      return {
        isValid: false,
        totalRecords: logs.length,
        tamperedIndex: i,
        tamperedRecordId: log.id,
        error: `Hash mismatch at index ${i}: recorded ${log.hash}, calculated ${calculatedHash}`,
      };
    }

    runningHash = log.hash || calculatedHash;
  }

  return { isValid: true, totalRecords: logs.length };
}
