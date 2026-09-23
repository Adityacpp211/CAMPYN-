# CAMPYN V2 — Deployment & Operational Runbook

## 1. Environment Configuration

CAMPYN V2 strictly separates configuration from code via environment variables.

### Required Environment Variables (`.env.example`)
```ini
# Application Environment
NODE_ENV=development
PORT=4000

# Security & Cryptography
JWT_SECRET=super-secret-campus-jwt-key-2026-production-change-this
AUDIT_SALT=campus-os-cryptographic-audit-salt-production-secure

# Production Database (Leave empty for embedded PGlite engine)
DATABASE_URL=postgresql://campyn_user:campyn_secure_pass@localhost:5432/campyn_db

# CORS Allowed Origins
CORS_ORIGIN=http://localhost:5173
```

---

## 2. Local Development Quickstart

To run the full stack locally:

```bash
# 1. Install dependencies
npm install

# 2. Run database schema migrations
npm run migrate

# 3. Seed realistic development data
npm run seed

# 4. Start backend server (starts on http://localhost:4000)
npm run server

# 5. In another terminal, start frontend Vite dev server (http://localhost:5173)
npm run dev

# 6. Execute automated integration and security test suite
npm test
```

---

## 3. Production Deployment Architecture

```mermaid
graph TD
    User["Client Browser"]
    CDN["Cloudflare / AWS CloudFront (HTTPS / SSL Termination)"]
    Nginx["Reverse Proxy (Nginx / Caddy)"]
    Vite_Static["Frontend Static Assets (dist/)"]
    Node_Cluster["Node.js Cluster / PM2 / K8s (server/index.ts)"]
    PG_Cluster[("PostgreSQL 16 Multi-AZ Database")]
    S3[("Encrypted Object Storage (Documents & Syllabi)")]

    User -->|HTTPS :443| CDN
    CDN --> Nginx
    Nginx -->|Static / SPA| Vite_Static
    Nginx -->|/api/* & /api/v1/*| Node_Cluster
    Node_Cluster -->|Connection Pool| PG_Cluster
    Node_Cluster -->|Presigned URLs| S3
```

### Health & Readiness Probes
- **Liveness Probe**: `GET /health` — Validates HTTP server responsiveness (returns 200).
- **Readiness Probe**: `GET /readiness` — Validates active PostgreSQL pool connectivity (`SELECT 1`). Returns 200 when ready, 503 during database reconnects or failovers.

---

## 4. Production Build & Validation

```bash
# Compile and package production frontend bundle
npm run build

# Run complete regression and security test suites
npm test
```
