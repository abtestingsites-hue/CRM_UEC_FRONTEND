// Test/qa/tests/security/security-verification.test.mjs
// Comprehensive Security Verification Test Suite for Phase 1 Fixes
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));
const { io } = require(path.resolve('CRM/Frontend/node_modules/socket.io-client'));

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

describe('Phase 1 Verification: Security Hardening & Authentication Defect Fixes', () => {
  it('TEST-SEC-01 (DEF-17): Enterprise HTTP security headers are present on responses', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200, 'Root endpoint returns 200');
    
    const xfo = res.headers.get('x-frame-options');
    const xcto = res.headers.get('x-content-type-options');
    
    assert.ok(xfo, 'X-Frame-Options header must be present');
    assert.strictEqual(xcto, 'nosniff', 'X-Content-Type-Options must be nosniff');
  });

  it('TEST-SEC-02: Public endpoints are accessible without authentication', async () => {
    const resHealth = await fetch(`${BASE_URL}/api/v1/health`);
    assert.strictEqual(resHealth.status, 200, '/api/v1/health must be public');

    const resTelHealth = await fetch(`${BASE_URL}/telephony/health`);
    assert.strictEqual(resTelHealth.status, 200, '/telephony/health must be public');
  });

  it('TEST-SEC-03 (DEF-07): Vobiz inbound webhook accepts carrier calls and returns valid TwiML XML', async () => {
    const payload = {
      Status: 'in-progress',
      CallUUID: `test_vobiz_${Date.now()}`,
      From: '+919876543210',
      To: '+918000012345',
      Direction: 'inbound',
    };

    const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201, 'Webhook responds with 201');
    const text = await res.text();
    assert.ok(text.includes('<Response>') && text.includes('<Dial') && text.includes('<Sip>'), 'Must return valid TwiML XML dial instructions');
  });

  it('TEST-SEC-04 (DEF-02): Unauthenticated access to /api/v1/agents is blocked with HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/agents`);
    assert.strictEqual(res.status, 401, 'Anonymous request must return 401 Unauthorized');
  });

  it('TEST-SEC-05 (DEF-02): Authenticated agent can query /api/v1/agents and PII (address/zipCode) is redacted', async () => {
    const token = jwt.sign(
      { sub: 'test_agent_user', userId: 'test_agent_user', role: 'AGENT' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${BASE_URL}/api/v1/agents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200, 'Authenticated request returns 200');

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.agents) && data.agents.length > 0);

    const firstAgent = data.agents[0];
    assert.strictEqual(firstAgent.address, undefined, 'Personal street address must be redacted for non-admins');
    assert.strictEqual(firstAgent.zipCode, undefined, 'Personal zipCode must be redacted for non-admins');
  });

  it('TEST-SEC-06 (DEF-02): Authenticated SUPER_ADMIN access to /api/v1/agents retains administrative fields', async () => {
    const token = jwt.sign(
      { sub: 'test_admin_user', userId: 'test_admin_user', role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${BASE_URL}/api/v1/agents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);
    const firstAgent = data.agents[0];
    assert.ok('address' in firstAgent, 'Address field must be present for administrators');
  });

  it('TEST-SEC-07 (DEF-03): Unauthenticated access to /telephony/calls/:callId/recording is blocked with HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/telephony/calls/05a749da-3f9f-47a5-a7b2-6481bd06384c/recording`);
    assert.strictEqual(res.status, 401, 'Anonymous recording access must return 401 Unauthorized');
  });

  it('TEST-SEC-08 (DEF-03): Unauthorized agent access to /telephony/calls/:callId/recording is blocked with HTTP 403 (IDOR defense)', async () => {
    const unauthAgentToken = jwt.sign(
      { sub: 'unauth_agent_999', userId: 'unauth_agent_999', agentId: 'agent_999', role: 'AGENT' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${BASE_URL}/telephony/calls/05a749da-3f9f-47a5-a7b2-6481bd06384c/recording`, {
      headers: { Authorization: `Bearer ${unauthAgentToken}` }
    });
    assert.strictEqual(res.status, 403, 'Unassigned agent must receive 403 Forbidden');
    const data = await res.json();
    assert.ok(data.error.includes('Forbidden'), 'Error message must reflect permission rejection');
  });

  it('TEST-SEC-09 (DEF-03): Authorized SUPER_ADMIN access to /telephony/calls/:callId/recording passes auth checks', async () => {
    const adminToken = jwt.sign(
      { sub: 'admin_user', userId: 'admin_user', role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${BASE_URL}/telephony/calls/05a749da-3f9f-47a5-a7b2-6481bd06384c/recording`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    // Since recording file is not physically on live S3 bucket in dev, 404 is the expected outcome (NOT 401 or 403)
    assert.notStrictEqual(res.status, 401, 'Admin must not be rejected with 401');
    assert.notStrictEqual(res.status, 403, 'Admin must not be rejected with 403');
    assert.strictEqual(res.status, 404, 'Admin passes authorization checks and reaches recording resolution');
  });

  it('TEST-SEC-10 (DEF-01): Login with wrong password returns HTTP 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'raghav@uec.com', password: 'DefinitelyWrongPassword!999' }),
    });
    assert.strictEqual(res.status, 401, 'Invalid password must return 401');
  });

  it('TEST-SEC-11 (DEF-01): Login with raw bcrypt password hash as input password is rejected with HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'raghav@uec.com',
        password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      }),
    });
    assert.strictEqual(res.status, 401, 'Raw hash bypass must be rejected with 401');
  });

  it('TEST-SEC-12 (DEF-02): Request with forged or tampered JWT is rejected with HTTP 401', async () => {
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJyb2xlIjoiU1VQRVJfQURNSU4ifQ.tampered_signature_xyz';
    const res = await fetch(`${BASE_URL}/api/v1/agents`, {
      headers: { 'Authorization': `Bearer ${forgedToken}` },
    });
    assert.strictEqual(res.status, 401, 'Forged JWT must be rejected with 401 Unauthorized');
  });

  it('TEST-SEC-13 (DEF-02): Request with expired JWT is rejected with HTTP 401', async () => {
    const expiredToken = jwt.sign(
      { sub: 'test_user', role: 'SUPER_ADMIN', exp: Math.floor(Date.now() / 1000) - 3600 },
      JWT_SECRET
    );
    const res = await fetch(`${BASE_URL}/api/v1/agents`, {
      headers: { 'Authorization': `Bearer ${expiredToken}` },
    });
    assert.strictEqual(res.status, 401, 'Expired JWT must be rejected with 401 Unauthorized');
  });

  it('TEST-SEC-14 (DEF-18): Brute-force rate limiting blocks rapid login attempts with HTTP 429', async () => {
    const statuses = [];
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `attacker_${Date.now()}_${i}@test.com`, password: 'test' }),
      });
      statuses.push(res.status);
    }
    assert.ok(statuses.includes(429), 'Rapid consecutive login attempts must trigger HTTP 429 Too Many Requests');
  });

  it('TEST-SEC-15: WebSocket authentication rejects tampered tokens with auth_error event', async () => {
    await new Promise((resolve, reject) => {
      const socket = io(BASE_URL, { transports: ['websocket'] });
      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('WebSocket auth_error event timed out'));
      }, 5000);

      socket.on('connect', () => {
        socket.emit('agent_login', {
          agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
          token: 'tampered.token.invalid'
        });
      });

      socket.on('auth_error', (data) => {
        clearTimeout(timer);
        socket.disconnect();
        assert.ok(data.message.includes('Invalid or expired'), 'Must return invalid token error');
        resolve();
      });
    });
  });

  it('TEST-SEC-16: WebSocket agent login blocks agent identity spoofing/impersonation', async () => {
    await new Promise((resolve, reject) => {
      const socket = io(BASE_URL, { transports: ['websocket'] });
      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('WebSocket spoofing detection timed out'));
      }, 5000);

      const attackerToken = jwt.sign(
        { sub: 'attacker_user_id', userId: 'attacker_user_id', role: 'AGENT' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      socket.on('connect', () => {
        // Attempt to claim agent belonging to a different user
        socket.emit('agent_login', {
          agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
          token: attackerToken
        });
      });

      socket.on('auth_error', (data) => {
        clearTimeout(timer);
        socket.disconnect();
        assert.ok(data.message.includes('Unauthorized'), 'Must reject agent impersonation');
        resolve();
      });
    });
  });

  it('TEST-SEC-17 (DEF-04): Secret hygiene - .env is ignored and .env.example exists without live secrets', () => {
    const rootGitignore = fs.readFileSync(path.resolve('.gitignore'), 'utf8');
    assert.ok(rootGitignore.includes('.env'), 'Root .gitignore must ignore .env');

    const backendGitignore = fs.readFileSync(path.resolve('CRM/Backend/.gitignore'), 'utf8');
    assert.ok(backendGitignore.includes('.env'), 'Backend .gitignore must ignore .env');

    const envExamplePath = path.resolve('CRM/Backend/.env.example');
    assert.ok(fs.existsSync(envExamplePath), 'CRM/Backend/.env.example must exist');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    assert.ok(!envExampleContent.includes('AQ.Ab8RN6Lm'), 'Must not contain real production keys');
    assert.ok(envExampleContent.includes('DATABASE_URL='), '.env.example must contain template schema');
  });
});
