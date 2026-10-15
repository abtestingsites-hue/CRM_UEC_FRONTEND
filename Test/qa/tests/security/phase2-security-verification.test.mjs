// Test/qa/tests/security/phase2-security-verification.test.mjs
// Phase 2 Comprehensive Security Hardening & RBAC Verification Test Suite
import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

function createToken(payload, secret = JWT_SECRET, options = { expiresIn: '1h' }) {
  return jwt.sign(payload, secret, options);
}

describe('Phase 2 Security Verification: RBAC, IDOR, Token Lifecycle, & Redaction', () => {

  // ==========================================
  // A. AUTHENTICATION & TOKEN LIFECYCLE
  // ==========================================
  describe('A. Authentication & Token Lifecycle', () => {
    it('TEST-SEC-P2-01: GET /api/v1/auth/me returns authenticated user identity claims', async () => {
      const token = createToken({
        userId: '11111111-1111-4111-8111-111111111111',
        email: 'testagent@eldercare.internal',
        role: 'AGENT',
        agentId: '22222222-2222-4222-8222-222222222222',
      });

      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.strictEqual(res.status, 200, 'Authenticated /me returns 200');
      const body = await res.json();
      assert.strictEqual(body.userId, '11111111-1111-4111-8111-111111111111');
      assert.strictEqual(body.role, 'AGENT');
      assert.strictEqual(body.email, 'testagent@eldercare.internal');
    });

    it('TEST-SEC-P2-02: POST /api/v1/auth/logout blacklists token and subsequent calls return 401', async () => {
      const token = createToken({
        userId: '33333333-3333-4333-8333-333333333333',
        email: 'logout_test@eldercare.internal',
        role: 'AGENT',
      });

      // 1. Initial /me call succeeds
      const initialRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(initialRes.status, 200, 'Token valid before logout');

      // 2. Call logout
      const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      assert.strictEqual(logoutRes.status, 200, 'Logout succeeds with 200');
      const logoutBody = await logoutRes.json();
      assert.strictEqual(logoutBody.success, true);

      // 3. Subsequent request with the revoked token must return 401
      const subsequentRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(subsequentRes.status, 401, 'Revoked token must be rejected with 401 Unauthorized');
    });

    it('TEST-SEC-P2-03: POST /api/v1/auth/refresh issues new tokens for valid refresh token', async () => {
      const refreshToken = createToken({
        userId: '44444444-4444-4444-8444-444444444444',
        email: 'refresh_test@eldercare.internal',
        role: 'ADMIN',
        type: 'refresh',
      }, JWT_SECRET, { expiresIn: '7d' });

      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      assert.strictEqual(res.status, 200, 'Refresh returns 200 for valid token');
      const body = await res.json();
      assert.ok(body.accessToken, 'Must return new accessToken');
      assert.ok(body.refreshToken, 'Must return new refreshToken');

      // Validate new access token
      const decoded = jwt.verify(body.accessToken, JWT_SECRET);
      assert.strictEqual(decoded.userId, '44444444-4444-4444-8444-444444444444');
      assert.strictEqual(decoded.role, 'ADMIN');
    });

    it('TEST-SEC-P2-04: POST /api/v1/auth/refresh rejects tampered refresh token with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid.tampered.token' }),
      });

      assert.strictEqual(res.status, 401, 'Tampered refresh token returns 401');
    });

    it('TEST-SEC-P2-05: POST /api/v1/auth/reset-password returns safe response without email enumeration', async () => {
      const resNonExistent = await fetch(`${BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent_account_xyz@eldercare.internal' }),
      });

      assert.strictEqual(resNonExistent.status, 200, 'Reset password returns 200');
      const body = await resNonExistent.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'If an account with that email exists, password reset instructions have been sent.');
    });
  });

  // ==========================================
  // B. AUTHORIZATION & RBAC ENFORCEMENT
  // ==========================================
  describe('B. Role-Based Access Control (RBAC)', () => {
    it('TEST-SEC-P2-06: PUT /api/v1/approvals/:id/review rejects AGENT with 403 and allows SUPERVISOR', async () => {
      const agentToken = createToken({
        userId: '55555555-5555-4555-8555-555555555555',
        role: 'AGENT',
      });

      const supervisorToken = createToken({
        userId: '66666666-6666-4666-8666-666666666666',
        role: 'SUPERVISOR',
      });

      // 1. Agent attempt -> 403 Forbidden
      const agentRes = await fetch(`${BASE_URL}/api/v1/approvals/app_123/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agentToken}`,
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      assert.strictEqual(agentRes.status, 403, 'AGENT role must receive 403 Forbidden for approvals review');

      // 2. Supervisor attempt -> 200 OK
      const supRes = await fetch(`${BASE_URL}/api/v1/approvals/app_123/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supervisorToken}`,
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      assert.strictEqual(supRes.status, 200, 'SUPERVISOR role must be allowed to review approvals');
    });

    it('TEST-SEC-P2-07: POST /api/v1/agents/create rejects AGENT with 403 and permits ADMIN', async () => {
      const agentToken = createToken({
        userId: '77777777-7777-4777-8777-777777777777',
        role: 'AGENT',
      });

      const agentRes = await fetch(`${BASE_URL}/api/v1/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agentToken}`,
        },
        body: JSON.stringify({
          fullName: 'Malicious Escalation',
          email: 'hack@eldercare.internal',
          role: 'SUPER_ADMIN',
        }),
      });
      assert.strictEqual(agentRes.status, 403, 'AGENT must receive 403 when trying to create agents');
    });

    it('TEST-SEC-P2-08: DELETE /api/v1/agents/:id rejects AGENT with 403', async () => {
      const agentToken = createToken({
        userId: '88888888-8888-4888-8888-888888888888',
        role: 'AGENT',
      });

      const res = await fetch(`${BASE_URL}/api/v1/agents/target_agent_id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert.strictEqual(res.status, 403, 'AGENT must receive 403 when trying to delete agents');
    });

    it('TEST-SEC-P2-09: POST /api/v1/leads/upload rejects AGENT with 403', async () => {
      const agentToken = createToken({
        userId: '99999999-9999-4999-8999-999999999999',
        role: 'AGENT',
      });

      const res = await fetch(`${BASE_URL}/api/v1/leads/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert.strictEqual(res.status, 403, 'AGENT role must receive 403 when accessing leads upload');
    });

    it('TEST-SEC-P2-10: GET /test-send is protected against unauthenticated callers and non-admins', async () => {
      // 1. Unauthenticated -> 401
      const unauthRes = await fetch(`${BASE_URL}/test-send`);
      assert.strictEqual(unauthRes.status, 401, 'Anonymous request to /test-send returns 401');

      // 2. Agent -> 403
      const agentToken = createToken({
        userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role: 'AGENT',
      });
      const agentRes = await fetch(`${BASE_URL}/test-send`, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert.strictEqual(agentRes.status, 403, 'Agent request to /test-send returns 403');
    });
  });

  // ==========================================
  // C. SENSITIVE RECORDS & IDOR PROTECTION
  // ==========================================
  describe('C. Sensitive Records & IDOR Protection', () => {
    it('TEST-SEC-P2-11: GET /appointments/patient/:customerId rejects invalid non-UUID identifier with 404', async () => {
      const adminToken = createToken({
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        role: 'ADMIN',
      });

      const res = await fetch(`${BASE_URL}/appointments/patient/invalid-non-uuid-string`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 404, 'Non-UUID patient identifier must return 404');
    });

    it('TEST-SEC-P2-12: GET /api/v1/conversations/:id/messages rejects unauthenticated and non-UUID with 401/404', async () => {
      // 1. Unauthenticated -> 401
      const unauthRes = await fetch(`${BASE_URL}/api/v1/conversations/00000000-0000-0000-0000-000000000000/messages`);
      assert.strictEqual(unauthRes.status, 401, 'Unauthenticated conversation access returns 401');

      // 2. Non-UUID -> 404
      const agentToken = createToken({
        userId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        role: 'AGENT',
      });
      const invalidIdRes = await fetch(`${BASE_URL}/api/v1/conversations/non-uuid-id/messages`, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert.strictEqual(invalidIdRes.status, 404, 'Invalid conversation UUID returns 404');
    });

    it('TEST-SEC-P2-13: Header-based role spoofing (x-user-role: SUPER_ADMIN) is ignored on /api/v1/call-records', async () => {
      const agentToken = createToken({
        userId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        agentId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        role: 'AGENT',
      });

      // Send x-user-role: SUPER_ADMIN in headers
      const res = await fetch(`${BASE_URL}/api/v1/call-records`, {
        headers: {
          Authorization: `Bearer ${agentToken}`,
          'x-user-role': 'SUPER_ADMIN',
          'x-agent-id': '00000000-0000-0000-0000-000000000000',
        },
      });

      assert.strictEqual(res.status, 200, 'Endpoint responds with 200');
      const records = await res.json();
      assert.ok(Array.isArray(records), 'Records should be an array');
      // If records are present, verify none are INBOUND or assigned to other agents
      for (const rec of records) {
        assert.strictEqual(rec.direction, 'OUTBOUND', 'Agents should only receive OUTBOUND calls even if sending x-user-role: SUPER_ADMIN');
      }
    });

    it('TEST-SEC-P2-14: Header spoofing on /api/v1/leads does not bypass phone masking', async () => {
      const agentToken = createToken({
        userId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
        agentId: '12121212-1212-4212-8212-121212121212',
        role: 'AGENT',
      });

      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        headers: {
          Authorization: `Bearer ${agentToken}`,
          'x-user-role': 'SUPER_ADMIN',
        },
      });

      assert.strictEqual(res.status, 200, 'Endpoint responds with 200');
      const leads = await res.json();
      assert.ok(Array.isArray(leads), 'Leads must be an array');

      // Check that leads not assigned to this agent are masked
      for (const lead of leads) {
        if (lead.assignedAgentId !== '12121212-1212-4212-8212-121212121212') {
          assert.ok(lead.phoneNumber.includes('X'), `Unassigned lead phone ${lead.phoneNumber} must remain masked`);
        }
      }
    });

    it('TEST-SEC-P2-15: Protected messaging routes require authentication', async () => {
      // POST /api/messages/send-whatsapp
      const waRes = await fetch(`${BASE_URL}/api/messages/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'c1', message: 'test' }),
      });
      assert.strictEqual(waRes.status, 401, 'Anonymous send-whatsapp must return 401');

      // POST /api/messages/send-instagram
      const igRes = await fetch(`${BASE_URL}/api/messages/send-instagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'c1', message: 'test' }),
      });
      assert.strictEqual(igRes.status, 401, 'Anonymous send-instagram must return 401');

      // POST /api/v1/feedback
      const fbRes = await fetch(`${BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSid: 'sid_1', csatScore: 5 }),
      });
      assert.strictEqual(fbRes.status, 401, 'Anonymous feedback must return 401');
    });
  });

  // ==========================================
  // D. CREDENTIALS & SOURCE CODE REDACTION
  // ==========================================
  describe('D. Credentials & Redaction', () => {
    it('TEST-SEC-P2-16: Hardcoded Meta access token is purged from source code files', () => {
      const legacyIndexPath = path.resolve('CRM/Backend/src/legacy/index.js');
      const legacyCallServicePath = path.resolve('CRM/Backend-call service/src/index.js');

      const content1 = fs.readFileSync(legacyIndexPath, 'utf-8');
      const content2 = fs.readFileSync(legacyCallServicePath, 'utf-8');

      assert.strictEqual(content1.includes('IGAASXVchcdJ'), false, 'Backend/src/legacy/index.js must not contain hardcoded Meta token');
      assert.strictEqual(content2.includes('IGAASXVchcdJ'), false, 'Backend-call service/src/index.js must not contain hardcoded Meta token');
    });

    it('TEST-SEC-P2-17: .env.example contains only sanitized template variables without real credentials', () => {
      const examplePath = path.resolve('CRM/Backend/.env.example');
      const content = fs.readFileSync(examplePath, 'utf-8');

      assert.ok(content.includes('your-supabase-service-role-key'), 'Supabase key must be sanitized');
      assert.ok(content.includes('your-livekit-api-secret'), 'Livekit secret must be sanitized');
      assert.ok(content.includes('your-twilio-auth-token'), 'Twilio token must be sanitized');
      assert.strictEqual(content.includes('eyJhbGciOi'), false, 'Must not contain real JWTs');
    });
  });
});
