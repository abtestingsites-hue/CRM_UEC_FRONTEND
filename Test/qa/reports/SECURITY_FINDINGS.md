# PARAMANTRA / ELDERCARE CRM — APPLICATION SECURITY ASSESSMENT REPORT

**Classification:** STRICTLY CONFIDENTIAL // SECURITY AUDIT FINDINGS  
**Date:** October 13, 2026  
**Auditor:** Principal Application Security Engineer  
**Scope:** `CRM/Backend/`, `CRM/Frontend/`, `CRM/Backend-call service/`, Configuration & Database Schema  

---

## 1. Executive Security Verdict

> **VERDICT: CRITICAL RISK — IMMEDIATE REMEDIATION MANDATORY PRIOR TO ANY RELEASE**  
> The application contains multiple P0 Critical security vulnerabilities that expose customer Personally Identifiable Information (PII), confidential patient audio recordings, and cloud infrastructure credentials.

---

## 2. Vulnerability Register & OWASP Mapping

| Vulnerability ID | Vulnerability Title | OWASP Category | Severity | CVSS v3.1 | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **SEC-01** | Plaintext Password Hash Comparison & Static Mock JWT | A07:2021 Identification & Authentication Failures | **P0 Critical** | **9.8** | CONFIRMED |
| **SEC-02** | Complete AuthGuard Bypass on Agent PII Directory | A01:2021 Broken Access Control | **P0 Critical** | **9.1** | CONFIRMED |
| **SEC-03** | Insecure Direct Object Reference (IDOR) on Audio Recordings | A01:2021 Broken Access Control | **P0 Critical** | **8.6** | CONFIRMED |
| **SEC-04** | Plaintext Production Infrastructure Secrets Committed | A05:2021 Security Misconfiguration | **P0 Critical** | **9.8** | CONFIRMED |
| **SEC-05** | Missing Enterprise HTTP Security Headers | A05:2021 Security Misconfiguration | **P2 Medium** | **5.3** | CONFIRMED |
| **SEC-06** | Absence of Rate Limiting & Brute-Force Defenses | A04:2021 Insecure Design | **P2 Medium** | **6.5** | CONFIRMED |

---

## 3. Detailed Vulnerability Analyses

### SEC-01: Plaintext Password Hash Comparison & Static Mock JWT
- **File:** `CRM/Backend/src/auth/auth.controller.ts:33-37`
- **Root Cause:**
  ```typescript
  // Line 33
  if (password !== user.passwordHash) {
    throw new UnauthorizedException('Invalid credentials');
  }
  // Line 37
  return {
    success: true,
    token: 'jwt_token_mock_until_nestjs_auth_guard_is_setup',
    user
  };
  ```
- **Impact:**
  1. The login check compares raw input `password` directly against `user.passwordHash` with string equality (`!==`). If the database stores bcrypt or argon2 hashes, valid users can never log in. If plaintext passwords are stored in the database, credentials will leak during any DB breach.
  2. The issued session token is a fixed static string. It lacks RFC 7519 structure, digital signatures, expirations (`exp`), and tenant claims. Any client can use this mock token indefinitely.
- **Remediation:**
  1. Install `bcrypt` or `@node-rs/argon2`.
  2. Implement `await bcrypt.compare(password, user.passwordHash)`.
  3. Wire `@nestjs/jwt` `JwtService.sign({ sub: user.id, email: user.email, role: user.role, tenantId: user.organizationId }, { expiresIn: '1h' })`.

---

### SEC-02: Complete AuthGuard Bypass on Agent PII Directory
- **Files:** `CRM/Backend/src/auth/guards/auth.guard.ts` & `CRM/Backend/dist/src/legacy/routes/agents.js`
- **Root Cause:**
  ```typescript
  // auth.guard.ts
  @Injectable()
  export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      return true; // Stubbed guard allows all requests
    }
  }
  ```
  Furthermore, the `/api/v1/agents` controller endpoint does not even have `@UseGuards(AuthGuard)` applied.
- **Evidence:**
  ```bash
  curl -X GET http://localhost:4000/api/v1/agents
  # Response: HTTP 200 OK with full agent PII (Names, phone numbers, addresses, city, state, postal codes)
  ```
- **Impact:** Any unauthenticated actor on the internet can scrape all agent names, phone numbers, and physical residential addresses.
- **Remediation:** Apply `@UseGuards(JwtAuthGuard)` to all `/api/v1/*` routes and validate JWT signatures before dispatching controller logic.

---

### SEC-03: IDOR and Unauthenticated Audio Access on Telephony Recordings
- **File:** `CRM/Backend/src/telephony/telephony.controller.ts:109`
- **Root Cause:**
  ```typescript
  @Get('calls/:callId/recording')
  async getCallRecording(@Param('callId') callId: string, @Res() res: Response) {
    // Queries call recording without verifying session caller ID or tenant isolation
  }
  ```
- **Evidence:** Verified by automated security test `SEC-02` in `qa/tests/security/security-audit.test.mjs`. The route responds without requesting any Bearer token or cookie.
- **Impact:** Attackers can enumerate `callId` UUIDs and download audio recordings of sensitive patient/eldercare healthcare calls.
- **Remediation:**
  1. Require `JwtAuthGuard` on recording retrieval.
  2. Verify that the authenticated user belongs to the same `organizationId` as the recorded call.

---

### SEC-04: Plaintext Production Infrastructure Secrets Committed in Repository
- **File:** `CRM/Backend/.env`
- **Exposed Secret Categories:**
  - Supabase Service Role Key (full administrative database access, bypassing RLS)
  - Cloud Redis Instance Password (`redislabs.com:12592`)
  - Twilio Account SID & Auth Token
  - LiveKit WebRTC Server API Key & Secret
  - Vobiz Telephony Auth Token
  - Google Gmail SMTP App Password
- **Remediation:**
  1. **IMMEDIATE ACTION:** Revoke and rotate all above credentials in their respective cloud consoles.
  2. Add `.env` to `.gitignore`.
  3. Utilize Azure Key Vault, AWS Secrets Manager, or Doppler for runtime secret injection.

---

### SEC-05: Missing Enterprise HTTP Security Headers
- **Evidence:** Tested via `SEC-03` in `qa/tests/security/security-audit.test.mjs`.
  - Missing: `Content-Security-Policy` (XSS prevention)
  - Missing: `X-Frame-Options` (Clickjacking prevention)
  - Missing: `Strict-Transport-Security` (HTTPS enforcement)
  - Missing: `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- **Remediation:** Add `helmet` in `main.ts`:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```

---

### SEC-06: Absence of Rate Limiting & Brute-Force Defenses
- **Evidence:** Tested via `SEC-04` in `qa/tests/security/security-audit.test.mjs`. The server handled 10 rapid concurrent bursts without returning HTTP 429.
- **Remediation:** Configure `@nestjs/throttler`:
  ```typescript
  ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
  ```
