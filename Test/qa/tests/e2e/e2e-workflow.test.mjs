// qa/tests/e2e/e2e-workflow.test.mjs
// End-to-End Core Business Workflow Test
import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

const testToken = jwt.sign(
  {
    sub: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
    userId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
    role: 'SUPER_ADMIN',
    email: 'Raghav@uec.com',
    name: 'Raghav'
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function getVobizHeaders(bodyStr) {
  const secret = process.env.VOBIZ_WEBHOOK_SECRET || process.env.VOBIZ_AUTH_TOKEN || '';
  const headers = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['x-vobiz-signature'] = 'sha256=' + crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
  }
  return headers;
}

describe('E2E Workflow: Inbound Customer Call to Agent Disposition Lifecycle', () => {
  let callSessionId = `e2e_call_${Date.now()}`;

  it('Step 1: System Health & Provider Readiness Check', async () => {
    const res = await fetch(`${BASE_URL}/telephony/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  });

  it('Step 2: Retrieve Active Agents for Inbound Routing', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/agents`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const agents = data.agents || data;
    assert.ok(agents.length > 0, 'Must have at least one registered agent in system');
  });

  it('Step 3: Inbound Telephony Webhook Trigger from Carrier (Vobiz)', async () => {
    const inboundPayload = {
      Status: 'in-progress',
      CallUUID: callSessionId,
      From: '+919876543210',
      To: '+918000012345',
      Direction: 'inbound',
      Timestamp: new Date().toISOString()
    };
    const bodyStr = JSON.stringify(inboundPayload);

    const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
      method: 'POST',
      headers: getVobizHeaders(bodyStr),
      body: bodyStr
    });

    assert.strictEqual(res.status, 201);
  });

  it('Step 4: Carrier Disconnect / Call Termination Status Webhook', async () => {
    const statusPayload = {
      Status: 'completed',
      CallUUID: callSessionId,
      From: '+919876543210',
      To: '+918000012345',
      Duration: '45',
      Direction: 'inbound'
    };
    const bodyStr = JSON.stringify(statusPayload);

    const res = await fetch(`${BASE_URL}/vobiz/status`, {
      method: 'POST',
      headers: getVobizHeaders(bodyStr),
      body: bodyStr
    });

    assert.strictEqual(res.status, 201);
  });

  it('Step 5: Query Leads to correlate Caller ID to CRM Records', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.strictEqual(res.status, 200);
  });
});
