// qa/tests/e2e/e2e-workflow.test.mjs
// End-to-End Core Business Workflow Test
import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';

describe('E2E Workflow: Inbound Customer Call to Agent Disposition Lifecycle', () => {
  let callSessionId = `e2e_call_${Date.now()}`;

  it('Step 1: System Health & Provider Readiness Check', async () => {
    const res = await fetch(`${BASE_URL}/telephony/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  });

  it('Step 2: Retrieve Active Agents for Inbound Routing', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/agents`);
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

    const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inboundPayload)
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

    const res = await fetch(`${BASE_URL}/vobiz/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusPayload)
    });

    assert.strictEqual(res.status, 201);
  });

  it('Step 5: Query Leads to correlate Caller ID to CRM Records', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads`);
    assert.strictEqual(res.status, 200);
  });
});
