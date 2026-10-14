// qa/tests/regression/regression-suite.test.mjs
// Automated Regression Test Suite to ensure core functionality and detect unexpected regressions
import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

describe('Regression Testing: Paramantra / ElderCare Core Baseline', () => {
  it('REG-01: Application Root and Telephony Subsystems must stay online', async () => {
    const rootRes = await fetch(`${BASE_URL}/`);
    assert.strictEqual(rootRes.status, 200);

    const telRes = await fetch(`${BASE_URL}/telephony/health`);
    assert.strictEqual(telRes.status, 200);
    const data = await telRes.json();
    assert.strictEqual(data.status, 'ok');
  });

  it('REG-02: Agent Directory API enforces authentication and returns valid agents when authorized', async () => {
    // 1. Unauthenticated request is blocked
    const unauthRes = await fetch(`${BASE_URL}/api/v1/agents`);
    assert.strictEqual(unauthRes.status, 401, 'Anonymous request must return 401');

    // 2. Authenticated request succeeds
    const token = jwt.sign(
      { sub: 'test_user', userId: 'test_user', role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await fetch(`${BASE_URL}/api/v1/agents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success === true || Array.isArray(data));
  });

  it('REG-03: Leads API must maintain queryability', async () => {
    const token = jwt.sign(
      { sub: 'test_user', userId: 'test_user', role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res = await fetch(`${BASE_URL}/api/v1/leads`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.status, 200);
  });

  it('REG-04: Inbound Webhook handler must acknowledge valid payloads', async () => {
    const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Status: 'ringing', CallUUID: `reg_test_${Date.now()}` })
    });
    assert.strictEqual(res.status, 201);
  });

  it('REG-05: Non-existent endpoints must cleanly return HTTP 404 without crashing', async () => {
    const res = await fetch(`${BASE_URL}/non_existent_route_9999`);
    assert.strictEqual(res.status, 404);
  });
});
