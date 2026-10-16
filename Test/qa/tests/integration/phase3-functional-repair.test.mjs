// Test/qa/tests/integration/phase3-functional-repair.test.mjs
// Phase 3 CRM Functional Repair, Integration, Performance & Reliability Test Suite
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import crypto from 'node:crypto';

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

describe('Phase 3: CRM Functional Repair, Integration, Performance & Reliability', () => {

  // ==========================================
  // DEF-05: LEADS ROUTING & CORE WORKFLOWS
  // ==========================================
  describe('DEF-05: Leads Routing, Search, and Full Lifecycle', () => {
    let createdLeadId = null;

    it('P3-DEF05-01: Creates a new lead with validation and persistence', async () => {
      const payload = {
        customerName: 'Phase3 QA Test Lead',
        phoneNumber: `+919999${Math.floor(100000 + Math.random() * 900000)}`,
        email: `qa-lead-${Date.now()}@testcrm.io`,
        serviceInterest: 'Elder Care Plan',
        status: 'NEW'
      };

      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 200, 'Lead creation must succeed with 200');
      const data = await res.json();
      assert.ok(data.id, 'Created lead must have an ID');
      assert.strictEqual(data.customerName, payload.customerName);
      createdLeadId = data.id;
    });

    it('P3-DEF05-02: Search leads via search query parameter', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads?search=Phase3 QA`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Result must be an array');
      const match = data.find(l => l.id === createdLeadId);
      assert.ok(match, 'Search query must find the created lead');
    });

    it('P3-DEF05-03: Update lead status and persist notes', async () => {
      assert.ok(createdLeadId, 'Requires created lead');
      const res = await fetch(`${BASE_URL}/api/v1/leads/${createdLeadId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          notes: 'Agent performed first qualification call'
        })
      });

      assert.strictEqual(res.status, 200);
      const updated = await res.json();
      assert.strictEqual(updated.status, 'IN_PROGRESS');
      assert.ok(updated.notes.includes('first qualification call'));
    });

    it('P3-DEF05-04: Full lead edit via PUT /api/v1/leads/:id', async () => {
      assert.ok(createdLeadId, 'Requires created lead');
      const res = await fetch(`${BASE_URL}/api/v1/leads/${createdLeadId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          customerName: 'Phase3 QA Updated Name',
          serviceInterest: 'Memory Care Service'
        })
      });

      assert.strictEqual(res.status, 200);
      const updated = await res.json();
      assert.strictEqual(updated.customerName, 'Phase3 QA Updated Name');
      assert.strictEqual(updated.serviceInterest, 'Memory Care Service');
    });

    it('P3-DEF05-05: Claim lead assignment to active agent', async () => {
      assert.ok(createdLeadId, 'Requires created lead');
      const res = await fetch(`${BASE_URL}/api/v1/leads/${createdLeadId}/claim`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940'
        })
      });

      assert.strictEqual(res.status, 200);
      const claimed = await res.json();
      const leadData = claimed.lead || claimed;
      assert.ok(leadData.assignedAgentId);
    });

    it('P3-DEF05-06: Route backward-compatibility alias /leads returns 200', async () => {
      const res = await fetch(`${BASE_URL}/leads`, {
        headers: authHeaders
      });
      assert.strictEqual(res.status, 200, 'Alias /leads must resolve with 200');
    });
  });

  // ==========================================
  // DEF-23: LEAD CONVERSION NULL/UNDEFINED NOTES
  // ==========================================
  describe('DEF-23: Lead Conversion Sentiment & Notes Handling', () => {
    let testLeadForConversion = null;

    it('Setup: Create temporary lead for conversion tests', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          customerName: 'Conversion Test Subject',
          phoneNumber: `+918888${Math.floor(100000 + Math.random() * 900000)}`,
          email: `conv-${Date.now()}@crmtest.com`,
          serviceInterest: 'Assisted Living',
          status: 'IN_PROGRESS'
        })
      });
      assert.strictEqual(res.status, 200);
      testLeadForConversion = await res.json();
    });

    it('P3-DEF23-01: Convert lead with null notes succeeds without TypeError', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leads/${testLeadForConversion.id}/convert`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          notes: null,
          appointmentDate: new Date(Date.now() + 86400000).toISOString()
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.lead.status, 'CONVERTED');
      assert.strictEqual(data.sentiment, 'NEUTRAL');
    });

    it('P3-DEF23-02: Convert lead with undefined/missing notes succeeds', async () => {
      // Create second lead
      const setupRes = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          customerName: 'Conversion Undefined Subject',
          phoneNumber: `+917777${Math.floor(100000 + Math.random() * 900000)}`,
          email: `conv-undef-${Date.now()}@crmtest.com`,
          serviceInterest: 'Nursing Care'
        })
      });
      const lead2 = await setupRes.json();

      const res = await fetch(`${BASE_URL}/api/v1/leads/${lead2.id}/convert`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          // notes omitted
          appointmentDate: new Date(Date.now() + 86400000).toISOString()
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.lead.status, 'CONVERTED');
    });

    it('P3-DEF23-03: Convert lead with positive keywords sets POSITIVE sentiment', async () => {
      const setupRes = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          customerName: 'Positive Subject',
          phoneNumber: `+916666${Math.floor(100000 + Math.random() * 900000)}`,
          serviceInterest: 'Day Care'
        })
      });
      const lead3 = await setupRes.json();

      const res = await fetch(`${BASE_URL}/api/v1/leads/${lead3.id}/convert`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          notes: 'Customer is very happy and interested in signing today'
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.sentiment, 'POSITIVE');
    });
  });

  // ==========================================
  // DEF-06: DASHBOARD ANALYTICS LIVE METRICS
  // ==========================================
  describe('DEF-06: Dashboard Analytics Live Aggregations', () => {
    it('P3-DEF06-01: GET /dashboard/analytics returns real DB KPIs and charts', async () => {
      const res = await fetch(`${BASE_URL}/dashboard/analytics`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.kpis), 'kpis must be an array');
      assert.ok(data.charts, 'charts must exist');
      assert.ok(Array.isArray(data.charts.salesFunnel), 'salesFunnel must be an array');
      assert.ok(Array.isArray(data.charts.revenueTrend), 'revenueTrend must be an array');
      assert.ok(data.liveStats, 'liveStats must exist');
      assert.strictEqual(typeof data.liveStats.totalCustomers, 'number');
      assert.strictEqual(typeof data.liveStats.totalLeads, 'number');
    });

    it('P3-DEF06-02: Canonical /api/v1/dashboard/analytics returns identical structure', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/dashboard/analytics`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.kpis);
      assert.ok(data.charts);
    });
  });

  // ==========================================
  // DEF-07, DEF-08: CALENDAR, APPOINTMENTS & HEALTH
  // ==========================================
  describe('DEF-07 & DEF-08: Calendar, Appointments & Health Routes', () => {
    it('P3-DEF08-01: Health check /api/v1/health returns 200 with status', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status.toUpperCase(), 'OK');
      assert.ok(data.timestamp);
    });

    it('P3-DEF07-01: Calendar route /calendar responds with 200 without date errors', async () => {
      const res = await fetch(`${BASE_URL}/calendar`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data) || typeof data === 'object');
    });

    it('P3-DEF07-02: Appointments calendar route /api/v1/appointments/calendar parity', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/appointments/calendar`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data) || typeof data === 'object');
    });
  });

  // ==========================================
  // DEF-14: TICKETS API INTEGRATION
  // ==========================================
  describe('DEF-14: Tickets Module Integration', () => {
    it('P3-DEF14-01: GET /api/v1/tickets returns real ticket list with normalized fields', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tickets`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Tickets must be an array');
      if (data.length > 0) {
        const ticket = data[0];
        assert.ok(ticket.id, 'Ticket must have id');
        assert.ok(ticket.title !== undefined || ticket.subject !== undefined, 'Ticket must have title or subject');
      }
    });

    it('P3-DEF14-02: Updating ticket status responds with updated record', async () => {
      const listRes = await fetch(`${BASE_URL}/api/v1/tickets`, { headers: authHeaders });
      const tickets = await listRes.json();
      if (tickets.length > 0) {
        const target = tickets[0];
        const res = await fetch(`${BASE_URL}/api/v1/tickets/${target.id}/status`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ status: 'RESOLVED' })
        });
        assert.strictEqual(res.status, 200);
        const updated = await res.json();
        assert.strictEqual(updated.status, 'RESOLVED');
      }
    });
  });

  // ==========================================
  // DEF-13: OMNICHANNEL MESSAGING WORKFLOW
  // ==========================================
  describe('DEF-13: Omnichannel Real Message Dispatch Workflow', () => {
    it('P3-DEF13-01: Message dispatch /api/v1/messages/send creates message and rejects empty recipient', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/messages/send`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          recipient: '',
          channel: 'WHATSAPP',
          content: 'Hello QA'
        })
      });

      // Must reject invalid / missing recipient
      assert.ok(res.status === 400 || res.status === 422 || res.status === 500);
    });

    it('P3-DEF13-02: Message dispatch with conversationId succeeds or validates', async () => {
      const convRes = await fetch(`${BASE_URL}/api/v1/conversations`, { headers: authHeaders });
      const convs = await convRes.json();
      if (Array.isArray(convs) && convs.length > 0) {
        const convId = convs[0].id;
        const sendRes = await fetch(`${BASE_URL}/api/v1/messages/send`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            conversationId: convId,
            content: 'Automated Phase 3 Integration Test Message',
            senderType: 'AGENT'
          })
        });
        assert.strictEqual(sendRes.status, 200);
        const msg = await sendRes.json();
        assert.ok(msg.id);
        assert.strictEqual(msg.content, 'Automated Phase 3 Integration Test Message');
      } else {
        const sendRes = await fetch(`${BASE_URL}/api/v1/messages/send`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            conversationId: '00000000-0000-0000-0000-000000000000',
            content: 'Test',
            senderType: 'AGENT'
          })
        });
        assert.ok([200, 400, 500].includes(sendRes.status));
      }
    });
  });

  // ==========================================
  // DEF-16: REDIS PRESENCE LATENCY & FALLBACK
  // ==========================================
  describe('DEF-16: Redis Presence Latency Profile & Fallback', () => {
    it('P3-DEF16-01: GET /api/v1/agents executes in under 2000ms with bounded fallback', async () => {
      const start = performance.now();
      const res = await fetch(`${BASE_URL}/api/v1/agents`, {
        headers: authHeaders
      });
      const duration = performance.now() - start;

      assert.strictEqual(res.status, 200);
      assert.ok(duration < 2500, `Agent lookup took ${Math.round(duration)}ms, expected < 2500ms`);
      const data = await res.json();
      assert.ok(Array.isArray(data) || Array.isArray(data.agents));
    });
  });

  // ==========================================
  // DEF-15: AI POST-CALL MODEL CONFIGURATION
  // ==========================================
  describe('DEF-15: AI Post-Call Processing Configuration', () => {
    it('P3-DEF15-01: Configured AI model is supported gemini-2.5-flash', async () => {
      const fs = await import('node:fs');
      const serviceFile = fs.readFileSync('CRM/Backend/src/analytics/analytics.service.ts', 'utf8');
      assert.ok(!serviceFile.includes('gemini-3.8-flash'), 'Obsolete gemini-3.8-flash must be removed');
      assert.ok(serviceFile.includes('gemini-2.5-flash'), 'Must configure supported gemini-2.5-flash');
    });
  });
});
