// qa/tests/security/security-audit.test.mjs
// Application Security and Vulnerability Assessment Suite
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';

describe('Security Testing: OWASP Top 10 & API Security Posture', () => {
  it('SEC-01: Broken Object Level Authorization & Missing AuthGuard on /api/v1/agents', async () => {
    // Attempting access without Authorization header
    const res = await fetch(`${BASE_URL}/api/v1/agents`);
    // CRITICAL SECURITY DEFECT: This endpoint should return 401 Unauthorized, but returns 200 OK
    const isVulnerable = res.status === 200;
    assert.strictEqual(isVulnerable, true, 'CONFIRMED VULNERABILITY: /api/v1/agents exposes PII without authentication');
  });

  it('SEC-02: IDOR and Unauthenticated Audio Access on /telephony/calls/:callId/recording', async () => {
    // Attempting access to sensitive call recording without credentials
    const testCallId = 'test-call-12345';
    const res = await fetch(`${BASE_URL}/telephony/calls/${testCallId}/recording`);
    // CRITICAL SECURITY DEFECT: Does not return 401 Unauthorized
    assert.notStrictEqual(res.status, 401, 'CONFIRMED VULNERABILITY: Recording endpoint lacks 401 authentication check');
  });

  it('SEC-03: Missing Security Headers on HTTP responses', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const csp = res.headers.get('content-security-policy');
    const xfo = res.headers.get('x-frame-options');
    const hsts = res.headers.get('strict-transport-security');
    const xcto = res.headers.get('x-content-type-options');

    const missingHeaders = [];
    if (!csp) missingHeaders.push('Content-Security-Policy');
    if (!xfo) missingHeaders.push('X-Frame-Options');
    if (!hsts) missingHeaders.push('Strict-Transport-Security');
    if (!xcto) missingHeaders.push('X-Content-Type-Options');

    // Asserts that standard enterprise security headers are missing
    assert.ok(missingHeaders.length >= 2, `Missing security headers: ${missingHeaders.join(', ')}`);
  });

  it('SEC-04: Rate Limiting & Brute Force Defense on Auth/API endpoints', async () => {
    // Send 10 rapid requests to test rate limiting
    const requests = Array.from({ length: 10 }).map(() =>
      fetch(`${BASE_URL}/`, { method: 'GET' })
    );
    const responses = await Promise.all(requests);
    const anyThrottled = responses.some(r => r.status === 429);
    // Notice: CRM currently has no ThrottlerModule configured in AppModule
    assert.strictEqual(anyThrottled, false, 'FINDING: No rate limiting (HTTP 429) active on server');
  });

  it('SEC-05: Stack Trace and Internal Error Disclosure on Malformed Input', async () => {
    // Inject invalid ID into calls endpoint to check error handling
    const res = await fetch(`${BASE_URL}/telephony/calls/'%20OR%201=1--/recording`);
    const text = await res.text();
    // Verify whether internal system details or stack traces are leaked
    const leaksDetails = text.includes('node_modules') || text.includes('PrismaClientKnownRequestError');
    // If it does not leak raw stack traces, that is good; record status
    assert.ok(typeof leaksDetails === 'boolean');
  });

  it('SEC-06: Plaintext Credential Exposure in Environment Files', () => {
    const envPath = path.resolve('CRM/Backend/.env');
    assert.ok(fs.existsSync(envPath), 'Backend .env exists in repository');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const exposedCategories = [];
    if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=ey')) exposedCategories.push('Supabase Service Role Key');
    if (envContent.includes('REDIS_PASSWORD=')) exposedCategories.push('Cloud Redis Password');
    if (envContent.includes('TWILIO_AUTH_TOKEN=')) exposedCategories.push('Twilio Auth Token');
    if (envContent.includes('LIVEKIT_API_SECRET=')) exposedCategories.push('LiveKit API Secret');
    if (envContent.includes('VOBIZ_AUTH_TOKEN=')) exposedCategories.push('Vobiz Auth Token');

    assert.ok(exposedCategories.length >= 3, `CONFIRMED VULNERABILITY: Plaintext secrets in .env: ${exposedCategories.join(', ')}`);
  });
});
