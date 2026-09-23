# CampusOS (CAMPYN V2) — Current Architecture Audit

This document provides a comprehensive audit of the repository as of CAMPYN V2 initiation, identifying existing components, retained assets, necessary refactoring, simulated logic, and missing production-grade requirements.

---

## 1. What Currently Exists

### Frontend
- **Framework & Tooling**: React 19, TypeScript, Vite, Oxlint.
- **Design System & Aesthetics**: Monochromatic palette (`#000000`, `#0A0A0A`, `#111111`, `#181818`, `#222222`, `#2A2A2A`, `#666666`, `#A0A0A0`, `#F5F5F5`, `#FFFFFF`), muted semantic functional accents, 8px spatial grid, Geist/Inter typography, high-density compact tables, badges, and modals.
- **Navigation & Layout**:
  - `Sidebar.tsx`: Fixed left navigation with module tabs, collapse toggle, active institution indicator, and legacy client role switcher.
  - `Topbar.tsx`: Search trigger (`⌘K`), RBAC role indicator, notifications bell, and authentication modal trigger.
  - `GlobalFilterBar.tsx`: Academic Year, Semester, Department, and Section filtering controls.
  - `CommandPalette.tsx`: Global search modal (`Ctrl+K` / `⌘K`) with entity search across students, faculty, and quick navigation actions.
- **Feature Views (`src/features/`)**:
  - `DashboardView`: Multi-role overview with KPI statistics, timetable preview, assignments summary, and recent audit activity.
  - `StudentsView`: Student directory with search, filtering, and dossier inspection modal (overview, attendance, marks, fees, timeline).
  - `FacultyView`: Faculty roster, qualifications, designations, and assigned courses.
  - `CoursesView`: Course catalog with credit allocations and departmental breakdown.
  - `TimetableView`: Weekly timetable slot grid with conflict detection UI.
  - `AttendanceView`: Roster attendance marking with mandatory justification modal and historical corrections.
  - `AssignmentsView`: Assignment list and submission review/grading drawer.
  - `ExamsView`: Exam listing and marks entry verification grid with lock/publish controls.
  - `FeesView`: Student dues ledger, payment collection modal with receipt generation, and non-destructive refund reversals.
  - `ApprovalsView`: Centralized governance request listing with approve/reject justification modal.
  - `AuditView`: Cryptographic append-only audit stream with SHA-256 hash link display, JSON state diff inspector, and live chain integrity verification.

### Backend & Persistence
- **Runtime**: Node.js with Express 5, TypeScript (`tsx`).
- **Database Engine**: Dual-mode adapter supporting external PostgreSQL connection pool (`pg.Pool`) via `DATABASE_URL` and embedded WebAssembly PostgreSQL 16 (`@electric-sql/pglite`) for local zero-dependency testing.
- **Schema (`database/schema.sql`)**: Comprehensive relational DDL across 20+ tables: `institutions`, `campuses`, `departments`, `programs`, `academic_years`, `semesters`, `sections`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_sessions`, `students`, `faculty`, `courses`, `section_courses`, `enrollments`, `attendance_sessions`, `attendance_records`, `attendance_corrections`, `assignments`, `assignment_submissions`, `examinations`, `marks_entries`, `fee_structures`, `student_fee_dues`, `fee_transactions`, `approval_requests`, `audit_logs`.
- **Database Scripts**:
  - `server/db/migrate.ts`: Direct execution of `database/schema.sql`.
  - `server/db/seed.ts`: Populates baseline multi-tenant structure, 14 roles, 28 permissions, hashed bcrypt user accounts, student/faculty records, enrollments, fee dues, attendance sessions, and genesis audit entries.
- **Security & Authorization Middleware**:
  - `server/middleware/auth.ts`: Validates Bearer JWT, queries DB for active user status and permission list, attaches `req.user`.
  - `server/middleware/rbac.ts`: Enforces `requirePermission()`, `requireAnyPermission()`, and `requireRole()`.
- **Cryptographic Audit Service (`server/services/auditService.ts`)**:
  - Deterministic SHA-256 hash chaining across previous hash, actor, action, entity, JSON old/new values, reason, timestamp, and salt.
  - Verification algorithm detecting unauthorized row mutations.
- **API Endpoints (`server/routes/`)**:
  - Routes mounted at `/api/auth`, `/api/students`, `/api/faculty`, `/api/academics`, `/api/attendance`, `/api/fees`, `/api/approvals`, `/api/audit`, `/api/timetable`, `/api/assignments`, `/api/exams`, `/api/dashboard`.
- **Automated Tests (`tests/`)**:
  - 15 passing tests across `tests/auth.test.ts`, `tests/rbac.test.ts`, `tests/transactions.test.ts`, and `tests/audit.test.ts`.

---

## 2. What Can Be Retained

1. **Visual Design Language & CSS Tokens**: The entire monochromatic styling, typography, spacing, tables, badges, modals, and layouts in `src/index.css` and `src/App.css`.
2. **Component Structure**: `Sidebar`, `Topbar`, `GlobalFilterBar`, `CommandPalette`, `Badge`, `Modal`, `EmptyState`.
3. **Feature View Layouts**: The UI presentations of the 11 feature views.
4. **Relational Schema Core**: The normalized data model in `database/schema.sql` (multi-tenancy, academic hierarchy, course allocations, attendance, examinations, fee ledgers, governance approvals).
5. **Cryptographic Audit Hash Logic**: The SHA-256 chain calculation and tamper verification algorithms.
6. **Dual Database Adapter Concept**: Seamless ability to connect to external PostgreSQL or use embedded PGlite for tests and development.

---

## 3. What Must Be Refactored

1. **API Versioning**: Move all endpoints from `/api/*` to `/api/v1/*`.
2. **Backend Architecture Layering**: Break apart monolithic route handlers in `server/routes/*.ts` into Clean Architecture layers:
   ```
   Route -> Controller -> Service -> Repository -> Database
   ```
3. **Authorization Layer (ABAC / Resource-Level)**:
   - Upgrade from basic permission checks to relationship-aware authorization:
     - Verify faculty teach the specific section before editing attendance or entering marks.
     - Enforce student privacy (prevent IDOR on dossiers, marks, fee dues, and attendance).
     - Enforce institution isolation on every SQL query.
4. **State Management & Frontend Data Fetching**:
   - De-couple React components from `db.<collection>` in `src/services/db.ts`.
   - Replace in-memory array properties with typed custom hooks (`useStudents`, `useAttendance`, `useFees`, etc.) calling the centralized API client.
   - Implement loading skeletons, pagination, and error boundaries.
5. **Database Migration Strategy**:
   - Replace the single monolithic `schema.sql` runner with an ordered, versioned migration runner (`database/migrations/001_initial.sql`, `002_...`).
6. **Client-Side Role Switcher**:
   - Refactor the role switcher from a client-side state modifier into a development-only persona impersonation tool that issues real server-side authenticated sessions.

---

## 4. What Must Be Replaced

1. **`src/services/db.ts`**: The legacy singleton class holding mock arrays and synchronous mutations must be phased out in favor of server state hooks and a centralized API client.
2. **Client-Side Data Filtering**: Replace in-memory array filtering (e.g. `students.filter(...)`) for large collections with server-side pagination, sorting, and search query parameters (`?page=1&limit=25&search=...`).
3. **Hardcoded IDs and Foreign Keys**: Replace synthetic IDs (e.g. `'dept-cse'`, `'c-101'`, `'fac-1'`) with valid UUIDs throughout UI forms and seeds.

---

## 5. What Is Currently Simulated

| Feature | Current State | Target Production State |
| :--- | :--- | :--- |
| **Authentication Flow** | Basic login works; password reset, email verification, session revocation, and lockout are simulated/stubbed. | Complete identity lifecycle with refresh tokens, rate limiting, and password reset flows. |
| **Resource-Level Auth** | Advisory or coarse role-level checks (`attendance.record`). | Context-aware relationship checks (e.g. Faculty-Course-Section assignment check). |
| **Tenant Isolation** | Schema has `institution_id`, but some queries lack strict multi-tenant scoping in `WHERE` clauses. | Server-enforced tenant context extracted from JWT on every database query. |
| **Document Storage** | `file_url` stored as static strings; no real upload or storage system. | S3-compatible / local disk object storage abstraction with access-controlled presigned URLs. |
| **Background Tasks** | Operations run synchronously in request threads. | Asynchronous job runner / worker queue for reports, notifications, and ledger reconciliation. |

---

## 6. What Is Missing for Production

1. **Security & Rate Limiting**:
   - IP-based rate limiting on `/api/v1/auth/login` (`express-rate-limit`).
   - CSRF protection / secure cookie tokens where applicable.
   - Request payload validation schemas (Zod).
2. **Robust Identity Features**:
   - Password reset via one-time cryptographically secure tokens.
   - Refresh token rotation and multi-device session revocation (`/api/v1/auth/logout-all`).
   - Account lockout after consecutive failed attempts.
3. **Server-Side Pagination & Cursors**:
   - Pagination contracts `{ data: [], pagination: { total, page, limit, totalPages } }`.
4. **Centralized Error Envelope & Request IDs**:
   - UUID-based `X-Request-Id` attached to all requests and included in audit logs and error envelopes.
5. **Structured Logging & Observability**:
   - Structured JSON logging (Pino/Winston) omitting sensitive credentials.
   - Health and readiness endpoints (`/health`, `/readiness`).
6. **Comprehensive Security Test Suite**:
   - IDOR exploit tests, tenant boundary cross-contamination tests, unassigned faculty mutation tests, student privilege escalation tests.
