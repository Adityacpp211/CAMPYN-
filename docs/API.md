# CAMPYN V2 — RESTful API Specification

## 1. API Design Principles & Standards

All endpoints in CAMPYN V2 are versioned under `/api/v1/` and follow strict enterprise standards:
1. **Predictable HTTP Status Codes**: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`, `500 Internal Error`.
2. **Correlation IDs**: Every request and response carries an `X-Request-Id` UUID for end-to-end tracing and support triage.
3. **Consistent JSON Envelopes**:

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  },
  "requestId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "STUDENT_PRIVACY_VIOLATION",
    "message": "IDOR Violation: Students are strictly restricted to accessing their own records",
    "requestId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
  }
}
```

---

## 2. API Domain Catalog

### System & Health Checks
- `GET /health` — Verifies HTTP API responsiveness.
- `GET /readiness` — Probes live PostgreSQL database connectivity.

### Identity & Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` — Authenticates email/password; returns JWT and user profile.
- `GET /api/v1/auth/me` — Returns authenticated caller's profile and permissions.
- `POST /api/v1/auth/switch-role` — (Development/Demo) switches active testing persona.
- `POST /api/v1/auth/logout` — Revokes caller's active session.

### Students Academic Directory (`/api/v1/students`)
- `GET /api/v1/students` — Paginated student directory (supports `search`, `departmentId`, `section`, `page`, `limit`).
- `GET /api/v1/students/profile` — Self-dossier lookup for authenticated student.
- `GET /api/v1/students/:id` — Individual student dossier (enforces IDOR protection).

### Faculty & Instructional Staff (`/api/v1/faculty`)
- `GET /api/v1/faculty` — Lists faculty members filtered by department.

### Academics & Curriculum (`/api/v1/academics`)
- `GET /api/v1/academics/departments` — Returns active academic departments and metrics.
- `GET /api/v1/academics/courses` — Returns institutional course catalog.

### Auditable Attendance System (`/api/v1/attendance`)
- `GET /api/v1/attendance/sessions` — Lists recorded attendance sessions.
- `GET /api/v1/attendance/records` — Fetches attendance roster records by session.
- `POST /api/v1/attendance/sessions` — Records batch attendance (enforces faculty course assignment).
- `PUT /api/v1/attendance/records/:id` — Modifies attendance record with mandatory justification.
- `POST /api/v1/attendance/corrections` — Submits regularisation request for governance approval.

### Fees & Financial Ledgers (`/api/v1/fees`)
- `GET /api/v1/fees/dues` — Returns student fee invoices (self-scoped for students).
- `GET /api/v1/fees/transactions` — Returns immutable ledger transaction history.
- `POST /api/v1/fees/collect` (or `/pay`) — Atomically settles payment and issues receipt.
- `POST /api/v1/fees/transactions/:id/refund` — Non-destructive transaction reversal with balance restoration.

### Governance Approval Workflows (`/api/v1/approvals`)
- `GET /api/v1/approvals` — Lists pending approval requests.
- `POST /api/v1/approvals` — Submits new approval request.
- `POST /api/v1/approvals/:id/resolve` — Approves or rejects request with side-effect application.

### Cryptographic Audit Stream (`/api/v1/audit`)
- `GET /api/v1/audit` — Inspects append-only audit trail with previous hash pointers.
- `GET /api/v1/audit/verify` — Validates the entire SHA-256 blockchain and reports tamper status.
