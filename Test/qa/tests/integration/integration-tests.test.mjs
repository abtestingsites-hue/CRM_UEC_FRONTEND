// qa/tests/integration/integration-tests.test.mjs
// Integration Test Suite verifying interactions between controllers, routes, and services
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));
const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

const adminToken = jwt.sign({
  userId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
  agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
  email: 'admin@paramantra.com',
  role: 'SUPER_ADMIN',
  userType: 'SUPER_ADMIN'
}, JWT_SECRET, { expiresIn: '1h' });

const authHeaders = {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
};

describe('Integration Testing: API Contracts & Service Interoperability', () => {
  it('INT-01: Root endpoint responds with 200 and text/html payload', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.match(text, /Hello World/);
  });

  it('INT-02: Telephony health endpoint returns operational provider status', async () => {
    const res = await fetch(`${BASE_URL}/telephony/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.provider, 'vobiz');
    assert.ok(data.livekit !== undefined);
  });

  it('INT-03: Agents endpoint returns JSON object containing agents list', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/agents`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success === true || Array.isArray(data));
    const agentList = data.agents || data;
    assert.ok(Array.isArray(agentList), 'Response must contain agents array');
    if (agentList.length > 0) {
      const agent = agentList[0];
      assert.ok(agent.id !== undefined, 'Agent record must have id');
      assert.ok(agent.email !== undefined || agent.name !== undefined, 'Agent record must have email or name');
    }
  });

  it('INT-04: Canonical leads endpoint (/api/v1/leads) returns 200 and leads collection', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data) || typeof data === 'object');
  });

  it('INT-05: Route compatibility - Frontend route /leads and backend /api/v1/leads both respond 200', async () => {
    const legacyRes = await fetch(`${BASE_URL}/leads`, { headers: authHeaders });
    assert.strictEqual(legacyRes.status, 200, 'Legacy /leads returns 200 with auth');

    const canonicalRes = await fetch(`${BASE_URL}/api/v1/leads`, { headers: authHeaders });
    assert.strictEqual(canonicalRes.status, 200, 'Canonical /api/v1/leads returns 200');
  });

  it('INT-06: Vobiz inbound webhook endpoint (/vobiz/incoming) contract and XML content-type check', async () => {
    const crypto = await import('node:crypto');
    const fakeWebhookPayload = JSON.stringify({
      Status: 'in-progress',
      CallUUID: 'test_call_uuid_123',
      From: '+919876543210',
      To: '+918000012345',
      Direction: 'inbound'
    });

    const secret = process.env.VOBIZ_WEBHOOK_SECRET || process.env.VOBIZ_AUTH_TOKEN || '';
    const headers = { 'Content-Type': 'application/json' };
    if (secret) {
      headers['x-vobiz-signature'] = 'sha256=' + crypto.createHmac('sha256', secret).update(fakeWebhookPayload).digest('hex');
    }

    const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
      method: 'POST',
      headers,
      body: fakeWebhookPayload
    });

    assert.ok(res.status === 200 || res.status === 201, 'POST to /vobiz/incoming returns 200 OK per DEF-30');
    const contentType = res.headers.get('content-type');
    assert.ok(contentType?.includes('text/xml'), 'Header specifies text/xml');
    const body = await res.text();
    const isValidXml = body.startsWith('<?xml') || body.startsWith('<Response>');
    assert.strictEqual(isValidXml, true, 'DEF-09 RESOLVED: Body is valid XML <Response>');
  });

  it('INT-07: Recording route authorization check - Unauthenticated recording retrieval', async () => {
    const res = await fetch(`${BASE_URL}/telephony/calls/fake-call-id-123/recording`);
    const isProtected = res.status === 401 || res.status === 403;
    assert.strictEqual(isProtected, true, 'DEF-03 RESOLVED: Recording route is protected with authentication guard');
  });
});
