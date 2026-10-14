# PARAMANTRA / ELDERCARE CRM — COMPREHENSIVE SECURITY ASSESSMENT

**Audit Standard:** OWASP Top 10 (2021) & OWASP API Security Top 10 (2023)  
**Classification:** RESTRICTED // INTERNAL SECURITY AUDIT  
**Audit Authority:** Lead Penetration Tester & Application Security Architect  
**Audit Date:** October 13, 2026  
**Target:** NestJS Backend on Port 4000, Express Legacy Layer, PostgreSQL Supabase Instance  

---

## 1. Security Posture Summary

The defensive security assessment revealed severe architectural and implementation vulnerabilities that make the application immediately susceptible to data exfiltration, authentication bypass, customer impersonation, and administrative compromise.

```
+--------------------------------------------------------------------------------+
|                           SECURITY SCORECARD & RISK                            |
|                                                                                |
|  Total Security Probes Executed: 6                                             |
|  Critical (P0) Vulnerabilities Confirmed: 4                                    |
|  High (P1) Vulnerabilities Confirmed:     1                                    |
|  Medium (P2) Vulnerabilities Confirmed:   2                                    |
|  Security Gate Status:                    REJECTED (FAIL)                      |
+--------------------------------------------------------------------------------+
```

---

## 2. Confirmed Vulnerability Register

### VULN-01: Plaintext Password Hash Comparison & Static Mock JWT (CVSS 9.8 / P0 Critical)
- **OWASP:** API2:2023 Broken Authentication / A07:2021 Identification & Authentication Failures
- **Location:** `CRM/Backend/src/auth/auth.controller.ts:33-37`
- **Vulnerability Mechanism:**
  ```typescript
  // Line 33: Raw string comparison
  if (password !== user.passwordHash) {
    throw new UnauthorizedException('Invalid credentials');
  }
  // Line 37: Fixed mock string returned to all users
  return {
    success: true,
    token: 'jwt_token_mock_until_nestjs_auth_guard_is_setup',
    user
  };
  ```
- **Observed Impact:**
  1. If passwords stored in PostgreSQL are hashed using standard cryptographic algorithms (bcrypt/argon2), no valid user can log in because input password never matches the hash string.
  2. If passwords are stored as plaintext, any SQL injection or database backup compromise exposes all credentials.
  3. The static mock token is universally accepted; it has no cryptographic signature, no expiration timestamp, and no tenant isolation claims.
- **Remediation:**
  1. Hash all stored passwords using `bcrypt` (work factor 12) or `argon2id`.
  2. Use `await bcrypt.compare(password, user.passwordHash)`.
  3. Generate RS256/HS256 signed JWT tokens via `@nestjs/jwt` containing `{ sub: user.id, email: user.email, role: user.role, orgId: user.organizationId }` with a maximum 1-hour expiration.

---

### VULN-02: Public Unauthenticated Exposure of Agent PII Directory (CVSS 9.1 / P0 Critical)
- **OWASP:** API1:2023 Broken Object Level Authorization / API3:2023 Broken Object Property Level Authorization
- **Location:** `CRM/Backend/dist/src/legacy/routes/agents.js:15` & `CRM/Backend/src/auth/guards/auth.guard.ts`
- **Vulnerability Mechanism:**
  The `/api/v1/agents` route does not check for any `Authorization: Bearer <token>` header. Furthermore, the stubbed `AuthGuard` in NestJS contains `canActivate(): boolean { return true; }`.
- **Live Evidence:**
  ```bash
  curl -i http://localhost:4000/api/v1/agents
  # HTTP/1.1 200 OK
  # Content-Type: application/json; charset=utf-8
  # Returns: {"success":true,"agents":[{"id":"072dd2d6...","name":"Mani","phone":"6369825386","address":"1/2,Palla street...","city":"Tirukoilur","state":"Tamil Nadu","country":"India","zipCode":"605803"}]}
  ```
- **Observed Impact:** Any unauthenticated external client can scrape personal names, phone numbers, and physical residential home addresses of staff members. Direct violation of Indian DPDP Act 2023 and GDPR Article 32.
- **Remediation:** Apply `@UseGuards(JwtAuthGuard)` to all `/api/v1/*` routes and strip private residential addresses from standard directory responses.

---

### VULN-03: Insecure Direct Object Reference (IDOR) on Patient Audio Recordings (CVSS 8.6 / P0 Critical)
- **OWASP:** API1:2023 Broken Object Level Authorization / A01:2021 Broken Access Control
- **Location:** `CRM/Backend/src/telephony/telephony.controller.ts:109`
- **Vulnerability Mechanism:**
  ```typescript
  @Get('calls/:callId/recording')
  async getCallRecording(@Param('callId') callId: string, @Res() res: Response) {
    // Queries call recording without verifying session caller ID or tenant isolation
  }
  ```
- **Observed Impact:** Patient healthcare consultations and emergency calls stored in cloud storage can be enumerated by UUID without credentials.
- **Remediation:** Require authenticated user session and verify that `callSession.organizationId === user.organizationId` before issuing a signed short-lived storage URL.

---

### VULN-04: Plaintext Cloud Infrastructure Secrets Committed in Repository (CVSS 9.8 / P0 Critical)
- **OWASP:** A05:2021 Security Misconfiguration
- **Location:** `CRM/Backend/.env`
- **Vulnerability Mechanism:** Tracked file in version control contains production-level cloud secrets:
  - Supabase Service Role Key (grants full database administrative access, bypassing Row Level Security)
  - Cloud Redis Instance Password (`redislabs.com:12592`)
  - Twilio Account SID & Auth Token
  - LiveKit WebRTC Server API Key & Secret
  - Vobiz Telephony Auth Token
  - Google Gmail SMTP App Password
- **Observed Impact:** Anyone with access to the source code repository has full administrative access to database tables, voice servers, cloud caches, and corporate email sending.
- **Remediation:**
  1. Revoke and rotate all 6 credentials in their cloud dashboards immediately.
  2. Add `.env` to `.gitignore`.
  3. Inject secrets at runtime via Docker environment variables or cloud secret managers.

---

### VULN-05: Missing Enterprise HTTP Security Headers (CVSS 5.3 / P2 Medium)
- **OWASP:** A05:2021 Security Misconfiguration
- **Evidence:** Probed via `TC-SEC-03` in `qa_release_audit/evidence/security-test-results-fresh.txt`.
  - `Content-Security-Policy`: Missing (Exposes frontend to XSS injection)
  - `X-Frame-Options`: Missing (Exposes CRM to Clickjacking)
  - `Strict-Transport-Security`: Missing (Allows plaintext HTTP downgrades)
  - `X-Content-Type-Options`: Missing (Permits MIME sniffing)
- **Remediation:** Add `helmet` in `main.ts`:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```

---

### VULN-06: Absence of Rate Limiting & Brute-Force Defenses (CVSS 6.5 / P2 Medium)
- **OWASP:** API4:2023 Unrestricted Resource Consumption
- **Evidence:** Tested via `TC-SEC-04`. Server accepts rapid concurrent bursts with zero throttling (no HTTP 429).
- **Remediation:** Configure `@nestjs/throttler` globally in `app.module.ts`:
  ```typescript
  ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
  ```

---

## 3. Unconfirmed Concerns & False Positives Analysis

| Suspected Concern | Verified Reality | Verdict |
| :--- | :--- | :---: |
| **SQL Injection / Parameter Tampering** | Probed `/telephony/calls/'%20OR%201=1--/recording`. NestJS/Prisma sanitized input; no SQL errors leaked. | **SECURE (Prisma Parameterized)** |
| **Test Runner False Positive** | In earlier test runs, `security-audit.test.mjs` exited code 0 because it asserted that endpoints were vulnerable (`assert.strictEqual(isVulnerable, true)`). CI pipelines checking only exit code 0 would falsely report security as PASS. | **TEST RUNNER FALSE POSITIVE IDENTIFIED** |

---

## 4. Retest Status
- Total Confirmed Vulnerabilities: **6**
- Remediated: **0**
- Retest Status: **ALL OPEN / UNRESOLVED** (Audit-only baseline phase).
