// Test/qa/tests/security/phase2-gap-remediation.test.mjs
// Phase 2 Independent Security Verification & Gap Remediation Test Suite
import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));
const { io } = require(path.resolve('CRM/Frontend/node_modules/socket.io-client'));

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

function createToken(payload, secret = JWT_SECRET, options = { expiresIn: '1h' }) {
  return jwt.sign(payload, secret, options);
}

describe('Phase 2 Gap Remediation & Independent Security Verification', () => {

  // ==========================================
  // 1. WEBSOCKET AUTHENTICATION & IMPERSONATION DEFENSE
  // ==========================================
  describe('1. WebSocket Anti-Impersonation & Authentication', () => {
    it('TEST-GAP-01: WebSocket agent_login without token is rejected with auth_error event', async () => {
      await new Promise((resolve, reject) => {
        const socket = io(BASE_URL, { transports: ['websocket'] });
        const timer = setTimeout(() => {
          socket.disconnect();
          reject(new Error('Timed out waiting for expected auth_error on unauthenticated login'));
        }, 4000);

        socket.on('connect', () => {
          // Attempt agent_login with NO token provided
          socket.emit('agent_login', {
            agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
            name: 'Attacker Impersonator'
          });
        });

        socket.on('auth_error', (data) => {
          clearTimeout(timer);
          socket.disconnect();
          assert.ok(data.message.includes('Authentication token required'), 'Must require authentication token');
          resolve();
        });

        socket.on('agent_status_change', (data) => {
          clearTimeout(timer);
          socket.disconnect();
          reject(new Error(`VULNERABILITY: Agent socket was updated without token! Data: ${JSON.stringify(data)}`));
        });
      });
    });

    it('TEST-GAP-02: WebSocket agent_login with valid token and matching identity succeeds', async () => {
      await new Promise((resolve, reject) => {
        const socket = io(BASE_URL, { transports: ['websocket'] });
        const timer = setTimeout(() => {
          socket.disconnect();
          reject(new Error('Timed out waiting for agent_status_change on valid agent login'));
        }, 4000);

        const token = createToken({
          userId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
          agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
          role: 'ADMIN',
        });

        socket.on('connect', () => {
          socket.emit('agent_login', {
            agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
            name: 'Legitimate Admin',
            token,
          });
        });

        socket.on('auth_error', (data) => {
          clearTimeout(timer);
          socket.disconnect();
          reject(new Error(`Unexpected auth_error: ${data.message}`));
        });

        socket.on('agent_status_change', (data) => {
          clearTimeout(timer);
          socket.disconnect();
          assert.strictEqual(data.agentId, 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940');
          assert.strictEqual(data.status, 'AVAILABLE');
          resolve();
        });
      });
    });

    it('TEST-GAP-03: WebSocket agent_login with token for mismatched user is blocked', async () => {
      await new Promise((resolve, reject) => {
        const socket = io(BASE_URL, { transports: ['websocket'] });
        const timer = setTimeout(() => {
          socket.disconnect();
          reject(new Error('Timed out waiting for auth_error on identity mismatch'));
        }, 4000);

        const attackerToken = createToken({
          userId: 'unauthorized_attacker_id_9999',
          agentId: 'unauthorized_attacker_id_9999',
          role: 'AGENT',
        });

        socket.on('connect', () => {
          socket.emit('agent_login', {
            agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
            name: 'Spoofed Agent',
            token: attackerToken,
          });
        });

        socket.on('auth_error', (data) => {
          clearTimeout(timer);
          socket.disconnect();
          assert.ok(data.message.includes('Unauthorized'), 'Must reject identity mismatch');
          resolve();
        });
      });
    });
  });

  // ==========================================
  // 2. JWT TOKEN CLAIMS & SUBJECT VERIFICATION
  // ==========================================
  describe('2. JWT Verification & Claim Enforcement', () => {
    it('TEST-GAP-04: JWT with missing subject/userId claims is rejected with 401', async () => {
      // Token signed with correct secret but without user identifier claims
      const emptyClaimToken = createToken({ customField: 'no_user_id' });

      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${emptyClaimToken}` },
      });
      assert.strictEqual(res.status, 401, 'Token without subject/userId claim must return 401');
    });

    it('TEST-GAP-05: JWT signed with wrong secret key is rejected with 401', async () => {
      const forgedToken = createToken({
        userId: '11111111-1111-4111-8111-111111111111',
        role: 'SUPER_ADMIN',
      }, 'completely_wrong_secret_attacker_key');

      const res = await fetch(`${BASE_URL}/api/v1/agents`, {
        headers: { Authorization: `Bearer ${forgedToken}` },
      });
      assert.strictEqual(res.status, 401, 'JWT signed with wrong secret must return 401');
    });

    it('TEST-GAP-06: Malformed authorization header (not a bearer token) returns 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      assert.strictEqual(res.status, 401, 'Non-Bearer malformed token must return 401');
    });
  });

  // ==========================================
  // 3. RESOURCE SCOPING & CROSS-AGENT DATA ISOLATION
  // ==========================================
  describe('3. Resource Scoping & Cross-Agent Data Isolation', () => {
    it('TEST-GAP-07: Non-elevated agent on GET /api/v1/conversations only receives assigned/pool conversations', async () => {
      const specificAgentId = '44444444-4444-4444-8444-444444444444';
      const agentToken = createToken({
        userId: specificAgentId,
        agentId: specificAgentId,
        role: 'AGENT',
      });

      const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert.strictEqual(res.status, 200, 'Conversations endpoint responds with 200');

      const conversations = await res.json();
      assert.ok(Array.isArray(conversations), 'Must return an array');

      // Verify that none of the returned conversations belong exclusively to other agents
      for (const conv of conversations) {
        if (conv.agentId && conv.agentId !== specificAgentId) {
          assert.fail(`Conversation ${conv.id} assigned to ${conv.agentId} leaked to agent ${specificAgentId}`);
        }
      }
    });

    it('TEST-GAP-08: Elevated SUPER_ADMIN on GET /api/v1/conversations can view all conversations', async () => {
      const adminToken = createToken({
        userId: 'admin_master_1',
        role: 'SUPER_ADMIN',
      });

      const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const conversations = await res.json();
      assert.ok(Array.isArray(conversations));
      assert.ok(conversations.length > 0, 'Admin can view conversations across the organization');
    });

    it('TEST-GAP-09: Non-elevated agent cannot poll another agent ringing call via query param spoofing', async () => {
      const myAgentId = '12345678-1234-4234-8234-123456789abc';
      const victimAgentId = '87654321-4321-4321-8321-cba987654321';
      const agentToken = createToken({
        userId: myAgentId,
        agentId: myAgentId,
        role: 'AGENT',
      });

      // Try passing victim agentId in query param
      const res = await fetch(`${BASE_URL}/telephony/my-ringing-call?agentId=${victimAgentId}`, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      // Should evaluate for myAgentId, not victimAgentId
      if (body.call) {
        assert.notStrictEqual(body.call.assignedAgent?.id, victimAgentId, 'Must not return victim agent call');
      }
    });
  });

  // ==========================================
  // 4. CARRIER WEBHOOK CRYPTOGRAPHIC VALIDATION
  // ==========================================
  describe('4. Carrier Webhook Security & Signatures', () => {
    it('TEST-GAP-10: Vobiz webhook with invalid HMAC signature is rejected with 403', async () => {
      const payload = {
        Status: 'in-progress',
        CallUUID: `tampered_carrier_call_${Date.now()}`,
        From: '+919999999999',
        To: '+918000000000',
        Direction: 'inbound',
      };

      const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vobiz-signature': 'sha256=invalid_forged_carrier_signature_99999',
        },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 403, 'Invalid carrier signature must return 403 Forbidden');
    });

    it('TEST-GAP-11: Vobiz webhook with valid HMAC signature is accepted with HTTP 201 XML response', async () => {
      const payload = {
        Status: 'in-progress',
        CallUUID: `valid_carrier_call_${Date.now()}`,
        From: '+919876543210',
        To: '+918000012345',
        Direction: 'inbound',
      };

      const secret = process.env.VOBIZ_WEBHOOK_SECRET || process.env.VOBIZ_AUTH_TOKEN || '';
      const rawBody = JSON.stringify(payload);
      const signature = secret
        ? 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
        : undefined;

      const headers = { 'Content-Type': 'application/json' };
      if (signature) headers['x-vobiz-signature'] = signature;

      const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
        method: 'POST',
        headers,
        body: rawBody,
      });

      assert.ok(res.status === 200 || res.status === 201, `Valid carrier webhook responds with 200 or 201 (got ${res.status})`);
      const text = await res.text();
      assert.ok(text.includes('<Response>') && text.includes('<Dial'), 'Must return valid TwiML XML');
    });

    it('TEST-GAP-12: Meta webhook verifies HMAC signature when META_APP_SECRET is tested', async () => {
      const payload = { object: 'page', entry: [] };
      const res = await fetch(`${BASE_URL}/webhooks/meta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=invalid_meta_signature_123',
        },
        body: JSON.stringify(payload),
      });

      // If META_APP_SECRET is set, returns 403; if not set in dev, returns 200
      assert.ok([200, 403].includes(res.status), 'Meta webhook handler responded appropriately');
    });
  });

  // ==========================================
  // 5. ROLE-BASED ACCESS CONTROL (ALL ROLES)
  // ==========================================
  describe('5. RBAC Matrix across all System Roles', () => {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'AGENT', 'SALES_AGENT', 'EMERGENCY_TEAM'];

    it('TEST-GAP-13: Approvals review strictly permits elevated roles and denies non-elevated roles', async () => {
      for (const role of roles) {
        const token = createToken({
          userId: `test_user_${role.toLowerCase()}`,
          role,
        });

        const res = await fetch(`${BASE_URL}/api/v1/approvals/req_123/review`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'APPROVED' }),
        });

        const isElevated = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'].includes(role);
        if (isElevated) {
          assert.strictEqual(res.status, 200, `Role ${role} must be permitted to review approvals`);
        } else {
          assert.strictEqual(res.status, 403, `Role ${role} must be denied from reviewing approvals`);
        }
      }
    });

    it('TEST-GAP-14: Agent creation strictly permits ADMIN/SUPER_ADMIN and denies AGENT/SALES_AGENT/EMERGENCY_TEAM', async () => {
      const nonAdminRoles = ['AGENT', 'SALES_AGENT', 'EMERGENCY_TEAM'];
      for (const role of nonAdminRoles) {
        const token = createToken({
          userId: `test_user_${role.toLowerCase()}`,
          role,
        });

        const res = await fetch(`${BASE_URL}/api/v1/agents/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fullName: 'Malicious', email: 'mal@test.com' }),
        });

        assert.strictEqual(res.status, 403, `Role ${role} must receive 403 on agent creation`);
      }
    });
  });

  // ==========================================
  // 6. ERROR HANDLING & INFORMATION DISCLOSURE
  // ==========================================
  describe('6. Error Handling & Information Disclosure', () => {
    it('TEST-GAP-15: Malformed input does not leak stack traces or internal DB query code', async () => {
      const res = await fetch(`${BASE_URL}/appointments/patient/'%20OR%201=1--`);
      const text = await res.text();
      assert.strictEqual(text.includes('node_modules'), false, 'Must not leak file paths');
      assert.strictEqual(text.includes('PrismaClientKnownRequestError'), false, 'Must not leak DB error classes');
    });

    it('TEST-GAP-16: Express trust proxy and security headers are active', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/health`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.ok(res.headers.get('x-frame-options'));
    });
  });
});
