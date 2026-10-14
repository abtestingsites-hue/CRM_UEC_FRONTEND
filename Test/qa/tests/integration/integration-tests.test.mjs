// qa/tests/integration/integration-tests.test.mjs
// Integration Test Suite verifying interactions between controllers, routes, and services
import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';

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
    const res = await fetch(`${BASE_URL}/api/v1/agents`);
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
    const res = await fetch(`${BASE_URL}/api/v1/leads`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data) || typeof data === 'object');
  });

  it('INT-05: Route mismatch detection - Frontend route /leads returns 404 while backend is /api/v1/leads', async () => {
    const legacyRes = await fetch(`${BASE_URL}/leads`);
    // Expected to fail with 404 due to DEF-05 route prefix discrepancy
    assert.strictEqual(legacyRes.status, 404, 'Legacy /leads returns 404 on backend');

    const canonicalRes = await fetch(`${BASE_URL}/api/v1/leads`);
    assert.strictEqual(canonicalRes.status, 200, 'Canonical /api/v1/leads returns 200');
  });

  it('INT-06: Vobiz inbound webhook endpoint (/vobiz/incoming) contract and XML content-type check', async () => {
    const fakeWebhookPayload = {
      Status: 'in-progress',
      CallUUID: 'test_call_uuid_123',
      From: '+919876543210',
      To: '+918000012345',
      Direction: 'inbound'
    };

    const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fakeWebhookPayload)
    });

    assert.strictEqual(res.status, 201, 'POST to /vobiz/incoming returns 201 Created');
    const contentType = res.headers.get('content-type');
    assert.ok(contentType?.includes('text/xml'), 'Header specifies text/xml');
    const body = await res.text();
    // Verifying defect DEF-09: Body is plain 'OK' instead of valid XML <Response>
    const isValidXml = body.startsWith('<?xml') || body.startsWith('<Response>');
    assert.strictEqual(isValidXml, false, 'DEFECT CONFIRMED: Body is raw string "OK", invalid XML');
  });

  it('INT-07: Recording route authorization check - Unauthenticated recording retrieval', async () => {
    const res = await fetch(`${BASE_URL}/telephony/calls/fake-call-id-123/recording`);
    // Defect DEF-03: Endpoint does not require auth, returns 404 instead of 401 Unauthorized
    // In production, unauthenticated request MUST return 401/403
    const isProtected = res.status === 401 || res.status === 403;
    assert.strictEqual(isProtected, false, 'DEFECT CONFIRMED: Recording route lacks authentication guard');
  });
});
