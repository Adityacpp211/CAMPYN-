# CAMPYN Frontend Data Migration & Architecture Audit

## 1. Executive Summary

This document audits and maps the migration of CAMPYN from its prototype frontend mock-data layer (`src/services/db.ts`) to an authoritative PostgreSQL backend accessed exclusively through Express API endpoints.

Following this phase, the application adheres to the strict data flow:
```
PostgreSQL Database
       ↓
Express Backend (Auth, RBAC, Tenant Isolation, Audit, Validation)
       ↓
REST API (/api/v1/*)
       ↓
React Query/Hooks Client Layer
       ↓
CAMPYN Frontend Views
```

The frontend maintains zero authoritative state, holds no hardcoded production records, and performs no mock auditing.

---

## 2. Comprehensive Audit of `src/services/db.ts`

The legacy prototype class `CampusDatabase` in `src/services/db.ts` maintained simulated application state across multiple campus domains. Every dataset and method has been audited and categorized below:

| Property / Method | Category | Description | Migration Target (Authoritative Endpoint) |
|---|---|---|---|
| `departments[]` | MOCK DATA / REAL API DATA | Hardcoded array of 4 engineering departments | `GET /api/v1/academics/departments` |
| `courses[]` | MOCK DATA / REAL API DATA | Hardcoded array of 5 core and lab courses | `GET /api/v1/academics/courses` |
| `faculty[]` | MOCK DATA / REAL API DATA | Hardcoded roster of 3 faculty members | `GET /api/v1/faculty`, `GET /api/v1/faculty/:id` |
| `students[]` | MOCK DATA / REAL API DATA | Hardcoded array of 5 students with simulated GPAs | `GET /api/v1/students`, `GET /api/v1/students/:id`, `GET /api/v1/students/profile` |
| `attendanceSessions[]` | MOCK DATA / REAL API DATA | Hardcoded single attendance session | `GET /api/v1/attendance/sessions`, `POST /api/v1/attendance/sessions` |
| `attendanceRecords[]` | MOCK DATA / REAL API DATA | 5 student attendance records | `GET /api/v1/attendance/records?sessionId=:id`, `PUT /api/v1/attendance/records/:id` |
| `attendanceCorrections[]` | MOCK DATA / REAL API DATA | Single simulated regularization request | `POST /api/v1/attendance/corrections`, `GET /api/v1/approvals` |
| `timetableSlots[]` | MOCK DATA / REAL API DATA | 7 timetable slots with 1 fake conflict flag | `GET /api/v1/timetable`, `POST /api/v1/timetable`, `DELETE /api/v1/timetable/:id` |
| `assignments[]` | MOCK DATA / REAL API DATA | 2 sample assignments | `GET /api/v1/assignments` |
| `submissions[]` | MOCK DATA / REAL API DATA | 4 student assignment submissions | `GET /api/v1/assignments/:id/submissions` |
| `examinations[]` | MOCK DATA / REAL API DATA | 2 examination records | `GET /api/v1/exams`, `POST /api/v1/exams/:id/lock` |
| `marksEntries[]` | MOCK DATA / REAL API DATA | 5 marks entries for CAT-1 | `GET /api/v1/exams/:id/marks`, `PUT /api/v1/exams/marks/:id` |
| `feeDues[]` | MOCK DATA / REAL API DATA | 5 student fee receivables | `GET /api/v1/fees/dues` |
| `feeTransactions[]` | MOCK DATA / REAL API DATA | 2 settlement receipts | `GET /api/v1/fees/transactions` |
| `approvalRequests[]` | MOCK DATA / REAL API DATA | 2 pending workflow items | `GET /api/v1/approvals`, `POST /api/v1/approvals/:id/resolve` |
| `auditLogs[]` | MOCK DATA / REAL API DATA | Hardcoded genesis audit logs | `GET /api/v1/audit`, `GET /api/v1/audit/verify` |
| `logAudit()` | LEGACY MOCK MUTATOR | Client-side fake audit log generator | **ELIMINATED**. Audit logs are only created server-side via `createAuditLog` in PostgreSQL. |
| `subscribe()` / `notify()` | TEMPORARY UI STATE | Simple pub/sub event bus | **ELIMINATED**. Replaced by standard React hook lifecycle with loading, error, and refetch states. |
| `sync()` | LEGACY BRIDGE | Background batch fetcher with fallback | **ELIMINATED**. Each view queries its dedicated API hook on demand. |
| `updateAttendanceRecord()` | LEGACY ADAPTER | Local state mutating helper | **ELIMINATED**. Handled by `useAttendance` hook calling `PUT /api/v1/attendance/records/:id`. |
| `recordFeePayment()` | LEGACY ADAPTER | Local array mutation helper | **ELIMINATED**. Handled by `useFees` hook calling `POST /api/v1/fees/collect`. |
| `refundFeeTransaction()` | LEGACY ADAPTER | Local reversal helper | **ELIMINATED**. Handled by `useFees` hook calling `POST /api/v1/fees/transactions/:id/refund`. |
| `resolveApproval()` | LEGACY ADAPTER | Local approval status mutation | **ELIMINATED**. Handled by `useApprovals` hook calling `POST /api/v1/approvals/:id/resolve`. |

---

## 3. Module-by-Module Migration Strategy

### 3.1 Authentication & Session Management
- **Previous**: Hardcoded initial user (`admin.vance@campus.edu`) in `App.tsx`; client-side simulation.
- **New Flow**:
  1. Frontend boots and checks for existing JWT token in `localStorage`.
  2. If present, calls `GET /api/v1/auth/session` to validate session and load user profile + permissions.
  3. If missing or invalid (HTTP 401), clears tokens and transitions to authenticated login state.
  4. Global API client interceptor intercepts HTTP 401 responses, immediately clearing authenticated user state and prompting login.
  5. Role switching UI is completely removed from production.

### 3.2 Student Directory & Profile
- **Previous**: Read from `db.students[]`.
- **New Flow**:
  - `useStudents({ search, departmentId, section, page, limit })` executes `GET /api/v1/students`.
  - Supports server-side filtering, searching, and pagination.
  - Profile inspection queries `GET /api/v1/students/:id`.
  - Section transfers execute `POST /api/v1/students/:id/transfer-section`.

### 3.3 Faculty Roster & Workloads
- **Previous**: Read from `db.faculty[]`.
- **New Flow**:
  - `useFaculty({ departmentId, search, page, limit })` executes `GET /api/v1/faculty`.
  - Faculty assignments execute `POST /api/v1/faculty/assign` and `DELETE /api/v1/faculty/unassign/:sectionCourseId`.
  - Workload metrics are computed server-side directly in PostgreSQL.

### 3.4 Academic Core (Departments, Programs, Courses)
- **Previous**: Read from `db.departments[]` and `db.courses[]`.
- **New Flow**:
  - `useAcademics()` executes `GET /api/v1/academics/departments`, `GET /api/v1/academics/courses`, and `GET /api/v1/academics/programs`.
  - Course creation executes `POST /api/v1/academics/courses`.
  - Department management executes `POST /api/v1/academics/departments`.

### 3.5 Attendance Management
- **Previous**: Read from `db.attendanceSessions[]` and `db.attendanceRecords[]`.
- **New Flow**:
  - `useAttendance(sessionId)` executes `GET /api/v1/attendance/sessions` and `GET /api/v1/attendance/records?sessionId=:id`.
  - Session recording: `POST /api/v1/attendance/sessions`.
  - Session locking: `POST /api/v1/attendance/sessions/:id/lock`.
  - In-session record updates: `PUT /api/v1/attendance/records/:id`.
  - Post-lock corrections: `POST /api/v1/attendance/corrections`.
  - Student attendance statistics: `GET /api/v1/attendance/stats`.
  - Department statistics: `GET /api/v1/attendance/department-stats`.

### 3.6 Timetable & Scheduling
- **Previous**: Read from `db.timetableSlots[]`.
- **New Flow**:
  - `useTimetable({ sectionId, facultyId, roomNumber, dayOfWeek })` executes `GET /api/v1/timetable`.
  - Slot creation: `POST /api/v1/timetable` with server-side conflict detection.
  - Slot deletion: `DELETE /api/v1/timetable/:id`.

### 3.7 Governance & Approvals
- **Previous**: Read from `db.approvalRequests[]`.
- **New Flow**:
  - `useApprovals()` executes `GET /api/v1/approvals`.
  - Resolution: `POST /api/v1/approvals/:id/resolve` with mandatory justification and audit logging.

### 3.8 Cryptographic Audit Ledger
- **Previous**: Read from `db.auditLogs[]`; mutations simulated with `db.logAudit()`.
- **New Flow**:
  - `useAuditLogs({ action, entity, actorEmail })` executes `GET /api/v1/audit`.
  - Integrity check executes `GET /api/v1/audit/verify`.
  - Zero client-side audit creation. Only server-side transactions append SHA-256 chained audit records.

### 3.9 Fees & Financial Ledgers
- **Previous**: Read from `db.feeDues[]` and `db.feeTransactions[]`.
- **New Flow**:
  - `useFees()` executes `GET /api/v1/fees/dues` and `GET /api/v1/fees/transactions`.
  - Collection: `POST /api/v1/fees/collect`.
  - Reversal: `POST /api/v1/fees/transactions/:id/refund`.

### 3.10 Assignments & Submissions
- **Previous**: Read from `db.assignments[]` and `db.submissions[]`.
- **New Flow**:
  - `useAssignments()` executes `GET /api/v1/assignments` and `GET /api/v1/assignments/:id/submissions`.
  - If a feature is not yet fully configured on the backend, explicit "Not yet configured" states are displayed rather than simulating submissions.

### 3.11 Examinations & Marks
- **Previous**: Read from `db.examinations[]` and `db.marksEntries[]`.
- **New Flow**:
  - `useExams()` executes `GET /api/v1/exams` and `GET /api/v1/exams/:id/marks`.
  - Marks update: `PUT /api/v1/exams/marks/:id` with server-side transaction and audit log.
  - Lock & publish: `POST /api/v1/exams/:id/lock`.

### 3.12 Dashboard Metrics
- **Previous**: Calculated from `db.*` array lengths and hardcoded numbers.
- **New Flow**:
  - `useDashboard()` executes single aggregated query to `GET /api/v1/dashboard/stats`.
  - Returns backend computed counts, fees totals, attendance rate, alerts, and recent audit activity.

---

## 4. Security & Production Hardening

1. **Fail-Fast Configuration**:
   - `NODE_ENV=production` mandates `DATABASE_URL`, `JWT_SECRET`, and `AUDIT_SALT`.
   - The application immediately refuses to start if fallback development values or missing environment variables are detected in production.
2. **PGlite Isolation**:
   - Embedded PGlite is restricted strictly to development and testing environments.
   - Production throws an error if an external PostgreSQL connection is not provided.
3. **Seed Credentials**:
   - `Password@123` is labeled strictly as `[DEVELOPMENT ONLY]`.
   - In production, seed scripts refuse execution unless an explicit administrator secret is supplied.
