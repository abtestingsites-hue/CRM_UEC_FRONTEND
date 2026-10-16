// Test/qa/tests/security/rbac-resource-ownership.test.mjs
// Focused RBAC & Resource-Ownership Security Audit Suite
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

describe('Focused RBAC & Resource Ownership Authorization Suite', () => {
  let agentA;
  let agentB;
  let tokenAgentA;
  let tokenAgentB;
  let tokenAdmin;

  let testLeadId;
  let testTicketId;
  let testAppointmentId;
  let testFollowupId;

  before(async () => {
    tokenAdmin = makeToken({
      sub: '0e3daf02-f81a-41be-96cd-f86785ebe1f1',
      userId: '0e3daf02-f81a-41be-96cd-f86785ebe1f1',
      agentId: '5c5515de-587b-4a56-b4a8-53b51af275e9',
      role: 'SUPER_ADMIN',
      email: 'raghav@uec.com',
      name: 'Super Admin'
    });

    // 1. Fetch available agents from API
    const agentsRes = await fetch(`${BASE_URL}/api/v1/agents`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const agentsData = await agentsRes.json();
    assert.ok(agentsData.agents && agentsData.agents.length >= 2, 'Need at least 2 agents in DB');
    
    agentA = agentsData.agents[0];
    agentB = agentsData.agents[1];

    tokenAgentA = makeToken({
      sub: agentA.userId || agentA.id,
      userId: agentA.userId || agentA.id,
      agentId: agentA.id,
      role: 'AGENT',
      email: agentA.email || 'agenta@crm.internal',
      name: agentA.name || 'Agent A'
    });

    tokenAgentB = makeToken({
      sub: agentB.userId || agentB.id,
      userId: agentB.userId || agentB.id,
      agentId: agentB.id,
      role: 'AGENT',
      email: agentB.email || 'agentb@crm.internal',
      name: agentB.name || 'Agent B'
    });

    // 2. Create a lead assigned to Agent A
    const leadRes = await fetch(`${BASE_URL}/api/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        customerName: 'Protected VIP Client',
        phoneNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: 'vip@client.com',
        serviceInterest: 'Elder Care Specialist',
        assignedAgentId: agentA.id,
        status: 'NEW'
      })
    });
    const leadData = await leadRes.json();
    testLeadId = leadData.id;
    assert.ok(testLeadId, `Lead assigned to Agent A must be created. Resp: ${JSON.stringify(leadData)}`);

    // 3. Create a ticket assigned to Agent A
    const ticketRes = await fetch(`${BASE_URL}/api/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        customerName: 'Ticket Client',
        customerPhone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
        subject: 'Private Medical Inquiry',
        description: 'Confidential patient details',
        priority: 'HIGH',
        agentId: agentA.id
      })
    });
    const ticketData = await ticketRes.json();
    testTicketId = ticketData.id;
    assert.ok(testTicketId, `Ticket assigned to Agent A must be created. Resp: ${JSON.stringify(ticketData)}`);

    // 4. Create an appointment assigned to Agent A
    const futureDate = new Date(Date.now() + 86400000 * (10 + Math.floor(Math.random() * 50)));
    const futureEndDate = new Date(futureDate.getTime() + 3600000);
    const apptRes = await fetch(`${BASE_URL}/api/v1/appointments/calendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        title: 'Confidential Care Assessment',
        type: 'CLINICAL_VISIT',
        assignedAgentId: agentA.id,
        startTime: futureDate.toISOString(),
        endTime: futureEndDate.toISOString()
      })
    });
    const apptData = await apptRes.json();
    testAppointmentId = apptData.id;
    assert.ok(testAppointmentId, `Appointment for Agent A must be created. Resp: ${JSON.stringify(apptData)}`);

    // 5. Create a followup for Agent A
    const followupRes = await fetch(`${BASE_URL}/api/v1/followups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        leadId: testLeadId,
        agentId: agentA.id,
        followupDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        meetingType: 'CONSULTATION',
        purpose: 'Care plan review'
      })
    });
    const followupData = await followupRes.json();
    testFollowupId = followupData.id;
    assert.ok(testFollowupId, `Followup for Agent A must be created. Resp: ${JSON.stringify(followupData)}`);
  });

  // -------------------------------------------------------------
  // SCENARIO 1: Lead PII & Phone Number Exposure via IDOR
  // -------------------------------------------------------------
  it('SEC-RBAC-01: Agent B querying Agent A lead via GET /api/v1/leads/:id receives masked phone number', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}`, {
      headers: { Authorization: `Bearer ${tokenAgentB}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(
      data.phoneNumber.includes('X'),
      `Customer phone number must be masked for non-assigned peer Agent B. Received: ${data.phoneNumber}`
    );
  });

  // -------------------------------------------------------------
  // SCENARIO 2: Unauthorized Lead Hijacking / Tampering
  // -------------------------------------------------------------
  it('SEC-RBAC-02: Agent B attempting PUT /api/v1/leads/:id on Agent A lead is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentB}`
      },
      body: JSON.stringify({
        customerName: 'Hijacked Customer Name'
      })
    });
    assert.strictEqual(
      res.status,
      403,
      `Non-assigned peer Agent B modifying Agent A lead must be denied with 403 Forbidden. Received: ${res.status}`
    );
  });

  // -------------------------------------------------------------
  // SCENARIO 3: Lead Reassignment Privilege Escalation
  // -------------------------------------------------------------
  it('SEC-RBAC-03: Non-elevated agent attempting to reassign lead assignedAgentId is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentB}`
      },
      body: JSON.stringify({
        assignedAgentId: agentB.id
      })
    });
    assert.strictEqual(res.status, 403, 'Reassigning lead by non-elevated user must return 403 Forbidden');
  });

  // -------------------------------------------------------------
  // SCENARIO 4: Lead Status Tampering IDOR
  // -------------------------------------------------------------
  it('SEC-RBAC-04: Agent B attempting PUT /api/v1/leads/:id/status on Agent A lead is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentB}`
      },
      body: JSON.stringify({
        status: 'CLOSED',
        notes: 'Sabotaged status change'
      })
    });
    assert.strictEqual(res.status, 403, 'Modifying another agent lead status must return 403 Forbidden');
  });

  // -------------------------------------------------------------
  // SCENARIO 5: Lead Conversion Tampering IDOR
  // -------------------------------------------------------------
  it('SEC-RBAC-05: Agent B attempting POST /api/v1/leads/:id/convert on Agent A lead is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentB}`
      },
      body: JSON.stringify({
        notes: 'Unauthorized conversion attempt'
      })
    });
    assert.strictEqual(res.status, 403, 'Converting another agent lead must return 403 Forbidden');
  });

  // -------------------------------------------------------------
  // SCENARIO 6: Ticket Status Tampering IDOR
  // -------------------------------------------------------------
  it('SEC-RBAC-06: Agent B attempting PUT /api/v1/tickets/:id/status on Agent A ticket is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/tickets/${testTicketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentB}`
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolution: 'Tampered resolution'
      })
    });
    assert.strictEqual(res.status, 403, 'Modifying another agent ticket status must return 403 Forbidden');
  });

  // -------------------------------------------------------------
  // SCENARIO 7: Calendar Appointment Cancellation IDOR
  // -------------------------------------------------------------
  it('SEC-RBAC-07: Agent B attempting DELETE /calendar/:id on Agent A appointment is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/calendar/${testAppointmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAgentB}` }
    });
    assert.strictEqual(res.status, 403, 'Cancelling another agent appointment must return 403 Forbidden');
  });

  // -------------------------------------------------------------
  // SCENARIO 8: Followup Status Tampering IDOR
  // -------------------------------------------------------------
  it('SEC-RBAC-08: Agent B attempting PUT /api/v1/followups/:id/status on Agent A followup is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/followups/${testFollowupId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentB}`
      },
      body: JSON.stringify({
        status: 'COMPLETED'
      })
    });
    assert.strictEqual(res.status, 403, 'Updating another agent followup status must return 403 Forbidden');
  });

  // -------------------------------------------------------------
  // SCENARIO 9: Legitimate Access for Assigned Agent & Elevated Role
  // -------------------------------------------------------------
  it('SEC-RBAC-09: Assigned Agent A legitimately reads unmasked lead, updates status, and converts', async () => {
    // 1. Agent A reads unmasked lead
    const getRes = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}`, {
      headers: { Authorization: `Bearer ${tokenAgentA}` }
    });
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(
      !getData.phoneNumber.includes('X'),
      `Assigned Agent A must see unmasked phone number. Received: ${getData.phoneNumber}`
    );

    // 2. Agent A legitimately updates status
    const statusRes = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentA}`
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        notes: 'Consultation initiated'
      })
    });
    assert.strictEqual(statusRes.status, 200, 'Assigned agent must be permitted to update status');

    // 3. Agent A legitimately updates ticket
    const ticketRes = await fetch(`${BASE_URL}/api/v1/tickets/${testTicketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAgentA}`
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        resolution: 'Working on resolution'
      })
    });
    assert.strictEqual(ticketRes.status, 200, 'Assigned agent must be permitted to update ticket status');
  });

  it('SEC-RBAC-10: Super Admin can access and manage any resource across agents', async () => {
    // Admin reads unmasked lead
    const getRes = await fetch(`${BASE_URL}/api/v1/leads/${testLeadId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    assert.ok(!getData.phoneNumber.includes('X'), 'Admin must see unmasked phone number');

    // Admin cancels appointment
    const delRes = await fetch(`${BASE_URL}/calendar/${testAppointmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert.strictEqual(delRes.status, 200, 'Admin must be permitted to cancel appointment');
  });
});
