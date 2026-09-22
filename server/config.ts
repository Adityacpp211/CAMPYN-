import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'campus-os-enterprise-secret-key-2026-secure-token',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  auditSalt: process.env.AUDIT_SALT || 'campus_os_cryptographic_audit_ledger_v1',
};
