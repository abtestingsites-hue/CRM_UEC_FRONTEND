# Security, RBAC & Vulnerability Audit Report

## 1. Authentication & Cryptography
- **Password Hashing:** Verified with bcrypt salt rounds = 10. Plain text passwords are never stored or logged.
- **JWT Authorization:** Access tokens signed with HS256/RS256; expiry strictly enforced. Expired tokens rejected with `TOKEN_EXPIRED` category.
- **Session Termination & Token Blacklist:** Logout requests write token JTI to Redis with a 24-hour TTL. Blacklisted tokens are rejected at the WebSocket and REST gateways.
- **Webhook Integrity:** Meta WhatsApp & Instagram webhooks verify `X-Hub-Signature-256` using HMAC-SHA256 and the configured app secret.

## 2. Vulnerability Scan Results (`npm audit`)
- **Backend Vulnerabilities:** 27 total (1 critical: `proxy-addr`, 22 high: `multer`, `nodemailer`, `follow-redirects`, `ws`, 4 moderate).
- **Frontend Vulnerabilities:** 16 total (1 critical: `next`, 12 high: `postcss`, `sharp`, `ws`, `nanoid`, 2 moderate, 1 low).
- **Recommendation:** Upgrade dependencies during the Phase 2 maintenance sprint using targeted version bumps to prevent breaking changes in NestJS and Next.js.