# CAMPYN V2 — Automated Testing & Security Verification Suite

## 1. Test Architecture

The CAMPYN V2 test suite is built on **Vitest** and **Supertest**, executing end-to-end HTTP integration tests directly against an isolated PostgreSQL relational engine.

```bash
# Execute the full automated test suite
npm test
```

Configuration notes:
- Database: Uses `@electric-sql/pglite` embedded engine to run 100% native PostgreSQL queries without external service dependencies.
- Concurrency: Configured with `fileParallelism: false` in `vitest.config.ts` to prevent filesystem lock contention on embedded SQLite/PG storage files during test runs.

---

## 2. Test Suite Catalog

| Test Suite | File | Focus Areas & Invariants Verified |
| :--- | :--- | :--- |
| **Authentication & Sessions** | `tests/auth.test.ts` | Valid credential login, invalid password rejection, unauthenticated endpoint protection, JWT Bearer verification, role persona switching. |
| **Institutional RBAC** | `tests/rbac.test.ts` | Permission enforcement (`students.read`, `fees.collect`, `audit.read`), 403 Forbidden on unauthorized roles, accountant vs faculty boundary checks. |
| **ACID Transactions** | `tests/transactions.test.ts` | Atomic fee payment settlement, receipt generation, outstanding balance recalculation, mandatory justification for attendance modifications. |
| **Cryptographic Audit** | `tests/audit.test.ts` | SHA-256 hash chaining, canonical JSON key sorting, tamper-evident parent pointer verification, `/api/v1/audit/verify` verification algorithm. |
| **Student Privacy (IDOR)** | `tests/security_idor.test.ts` | Student profile self-lookup, roll number self-lookup, cross-student dossier access prevention (403 `STUDENT_PRIVACY_VIOLATION`), blocking student access to administrative audit and approval queues. |
| **Multi-Tenant Isolation** | `tests/tenant_isolation.test.ts` | Cross-tenant header injection blocking (`X-Institution-Id`), cross-tenant request body tampering prevention (`TENANT_ISOLATION_VIOLATION`), unauthenticated request rejection. |
| **Instructional ABAC** | `tests/faculty_assignment.test.ts` | Faculty attendance recording for assigned course allocations, rejection of attendance mutations for unassigned course allocations (403 `FACULTY_COURSE_UNASSIGNED`), empty records validation. |

---

## 3. Current Test Execution Results

```
Test Files  7 passed (7)
Tests       26 passed (26)
Duration    ~13s
```
