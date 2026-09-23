# CAMPYN V2 — Enterprise Security Baseline & Threat Mitigation

## 1. Security Architecture Summary

CAMPYN V2 is constructed around a **Zero-Trust Server Boundary**. No client-supplied authority, frontend state, or unvalidated parameters are trusted by backend services.

| Threat Category | Potential Vulnerability | CAMPYN V2 Architectural Mitigation |
| :--- | :--- | :--- |
| **SQL Injection** | Attacker injects malicious SQL statements into query strings or body parameters. | **100% Parameterized Queries**. Database drivers handle escaping natively via `$1, $2, ...` placeholders. Raw string interpolation in SQL clauses is strictly forbidden. |
| **IDOR / BOLA** | Student manipulates student IDs in URL or body to access peer dossiers or marks. | **ABAC Assertion Engine** (`assertStudentSelfAccess`). Student requests are checked against the database identity. Cross-student access throws HTTP 403 `STUDENT_PRIVACY_VIOLATION`. |
| **Cross-Tenant Leakage** | Tenant A attempts to read or mutate Tenant B records via header or body tampering. | **`enforceTenantIsolation` Middleware**. Every authenticated request enforces `req.user.institutionId`. Mismatched tenant targets fail with `TENANT_ISOLATION_VIOLATION`. |
| **Privilege Escalation** | Attacker attempts to change role by submitting `{ role: 'SUPER_ADMIN' }` in payload. | **Immutable Authority Extraction**. User roles and permissions are resolved exclusively from the database on every authenticated request; body fields modifying roles are discarded. |
| **Instructional Violations**| Faculty member modifies grades or attendance for an unassigned section. | **`assertFacultyCourseAssignment`**. Validates teaching allocations in `section_courses` before allowing attendance or grading writes. |
| **Silent Audit Tampering** | Administrator attempts to overwrite or delete audit logs. | **Cryptographic SHA-256 Hash Chaining**. Each log entry hashes the previous entry's hash, canonical JSON payload, and server secret salt. Deletion or modification breaks the chain instantly. |
| **Financial Concurrency** | Race condition leading to double payment or incorrect balance settlement. | **Row-Level Locking & ACID Transactions** (`SELECT ... FOR UPDATE` + `withTransaction`). Ledger updates either succeed atomically or roll back completely. |
| **Brute Force Attacks** | Credential stuffing on login endpoints. | **Rate Limiting & Account Lockout**. 10 login requests per minute per IP limit, combined with `failed_login_attempts` tracking and `locked_until` exponential backoff. |
| **Information Leakage** | Exposing passwords, internal paths, or database stack traces in error responses. | **Centralized Error Envelope Handler** (`errorHandler`). Masks internal errors and stack traces in non-development environments, providing safe error codes and correlation request IDs. |

---

## 2. Automated Security Test Coverage

Automated tests in `/tests/` continuously verify each security constraint:
- `tests/security_idor.test.ts` — Tests student attempts to access peer records, audit streams, and governance approval queues.
- `tests/tenant_isolation.test.ts` — Tests cross-tenant header and payload injection attempts.
- `tests/faculty_assignment.test.ts` — Tests faculty attempts to record attendance for unassigned sections and courses.
- `tests/rbac.test.ts` — Tests role permission enforcement across student, faculty, and administrative endpoints.
- `tests/transactions.test.ts` — Tests ACID rollbacks and financial consistency.
- `tests/audit.test.ts` — Tests cryptographic tamper-detection algorithms.
