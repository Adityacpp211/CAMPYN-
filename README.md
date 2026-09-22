# CampusOS — Production College Management System

A production-grade, monochromatic enterprise operating system for higher education institutions, built from first principles with an emphasis on data integrity, auditability, speed, and quiet visual aesthetics.

---

## 🏛️ System Overview

CampusOS is designed to manage the entire lifecycle of higher education institutions:
- **Academic Hierarchy**: Multi-tenancy support across Institutions, Campuses, Departments, Programs, Academic Years, Semesters, and Sections.
- **Academic Identities**: Complete student dossiers (biodata, guardians, attendance, marks, fees, and activity timelines) and instructional faculty rosters.
- **Auditable Attendance**: Real-time roster tracking with mandatory justification modals and append-only audit signatures to prevent silent modifications.
- **Timetable Scheduling**: Automated detection of room double-bookings and faculty schedule overlaps.
- **Examination Engine**: Continuous assessment (CAT), semester marks entry, and immutable result locking.
- **Transactional Fee Ledgers**: Invoicing, receipt generation, and non-destructive reversal adjustments.
- **Two-Tier Governance Workflows**: Centralized approval state machine (`ApprovalRequest`) for grade revisions, attendance regularizations, and fee refunds.
- **Tamper-Evident Audit Stream**: Cryptographic append-only event ledger tracking all authenticated state transitions with before/after JSON diffs.
- **Command Palette (`Ctrl+K`)**: Global fuzzy entity search and instant action execution.

---

## 🎨 Visual Design System

The interface adheres to a strict monochromatic design language:
- `BLACK` `#000000`
- `NEAR BLACK` `#0A0A0A`
- `DARK CHARCOAL` `#111111`
- `CHARCOAL` `#181818`
- `DARK GRAY` `#222222`
- `BORDER GRAY` `#2A2A2A`
- `MEDIUM GRAY` `#666666`
- `LIGHT GRAY` `#A0A0A0`
- `OFF WHITE` `#F5F5F5`
- `WHITE` `#FFFFFF`
- Muted semantic functional accents (Success `#2E7D32`, Warning `#ED6C02`, Danger `#D32F2F`, Info `#0288D1`).
- 8px grid spacing, 4px–8px border radius, Geist/Inter typography, high-density compact tables.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on v25.2.1)
- **npm**: v9+ (tested on v11.6.2)

### Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Seed relational PostgreSQL database (creates tables & initial records)
npm run seed

# 3. Run automated tests (Auth, RBAC, Transactions, Cryptographic Audit)
npm test

# 4. Start backend API server (runs on http://localhost:3001)
npm run dev:server

# 5. Start frontend development server (runs on http://localhost:5173)
npm run dev
```

The frontend reverse-proxies `/api` requests to the Express backend on port 3001. Both work out of the box with zero external PostgreSQL installation required (embedded engine) or by providing a `DATABASE_URL` connection string for external PostgreSQL.

---

## 🗄️ Database Architecture

The normalized relational PostgreSQL schema is located in [`database/schema.sql`](./database/schema.sql) and includes:
- Multi-tenancy (`institutions`, `campuses`)
- Academic organization (`departments`, `programs`, `semesters`, `sections`)
- RBAC permissions (`roles`, `permissions`, `user_roles`, `user_sessions`)
- Academic records (`students`, `faculty`, `courses`, `enrollments`)
- Operations (`attendance_sessions`, `attendance_records`, `attendance_corrections`)
- Assessment (`assignments`, `examinations`, `marks_entries`)
- Finance (`fee_structures`, `student_fee_dues`, `fee_transactions`)
- Governance (`approval_requests`, `audit_logs`)

---

## 🛡️ Role-Based Access Control (RBAC)

Supports 14 institutional roles:
`SUPER_ADMIN`, `COLLEGE_ADMIN`, `PRINCIPAL`, `HOD`, `FACULTY`, `STUDENT`, `PARENT`, `ACCOUNTANT`, `LIBRARIAN`, `EXAM_CELL`, `PLACEMENT_OFFICER`, `HOSTEL_ADMIN`, `TRANSPORT_ADMIN`, `AUDITOR`.

Use the **Role Switcher** in the lower-left sidebar to preview permissions and context-aware dashboards for any role.
