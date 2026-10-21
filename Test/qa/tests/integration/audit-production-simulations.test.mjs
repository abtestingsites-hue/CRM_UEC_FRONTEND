// Test/qa/tests/integration/audit-production-simulations.test.mjs
// Audit & Verification Test Suite for Production Simulation Elimination
// Verifies that mocked, hardcoded, simulated, or fake-success behaviors in production paths
// have been replaced with real database persistence, genuine error handling, and authentic metrics.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));
const prisma = require(path.resolve('CRM/Backend/src/legacy/prisma.js'));

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

describe('Audit: Elimination of Production Simulations & Fake-Success Fallbacks', () => {
  let testCustomer = null;
  let testUser = null;
  let testCallSession = null;
  const testRunId = crypto.randomUUID().slice(0, 8);

  before(async () => {
    // Setup authentic test fixtures directly in Prisma
    testCustomer = await prisma.customer.create({
      data: {
        name: `Audit Customer ${testRunId}`,
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        email: `audit-${testRunId}@testcrm.io`
      }
    });

    // Resolve an existing user or agent to link
    testUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: `test-agent-${testRunId}@paramantra.com`,
          name: 'Test Super Admin',
          role: 'SUPER_ADMIN',
          passwordHash: 'dummyhash'
        }
      });
    }

    testCallSession = await prisma.callSession.create({
      data: {
        customerId: testCustomer.id,
        calleeUserId: testUser.id,
        status: 'IN_PROGRESS',
        reason: 'Audit Simulation Verification Call',
        transferHistory: {
          transfers: []
        }
      }
    });
  });

  after(async () => {
    // Cleanup created test records
    try {
      if (testCallSession?.id) {
        await prisma.callSession.deleteMany({ where: { id: testCallSession.id } });
      }
      if (testCustomer?.id) {
        await prisma.customerNote.deleteMany({ where: { customerId: testCustomer.id } });
        await prisma.customer.deleteMany({ where: { id: testCustomer.id } });
      }
    } catch (err) {
      console.warn('Test cleanup warning:', err.message);
    }
  });

  // ==============================================================
  // 1. TELEPHONY HEALTH STATUS GATE
  // ==============================================================
  describe('Module 1: Telephony Health & Dynamic Configuration Status', () => {
    it('TEL-01: /telephony/health returns authentic configuration status (not hardcoded dummy)', async () => {
      const res = await fetch(`${BASE_URL}/telephony/health`);
      assert.strictEqual(res.status, 200, 'Telephony health check must return HTTP 200');
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.provider, 'vobiz');
      // Must reflect actual env status: configured or missing_credentials
      assert.ok(
        data.livekit === 'connected' || data.livekit === 'configured' || data.livekit === 'missing_credentials',
        `LiveKit status must be connected, configured, or missing_credentials, got ${data.livekit}`
      );
      assert.ok(
        data.vobiz === 'configured' || data.vobiz === 'missing_credentials',
        `Vobiz status must be configured or missing_credentials, got ${data.vobiz}`
      );
    });
  });

  // ==============================================================
  // 2. APPROVALS WORKFLOW (No Fake Success on missing records)
  // ==============================================================
  describe('Module 2: Approvals Negative & Positive Handling', () => {
    it('APP-01: PUT /api/v1/approvals/:id/review returns 404 for non-existent approval ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await fetch(`${BASE_URL}/api/v1/approvals/${nonExistentId}/review`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'APPROVED',
          notes: 'Reviewing non-existent approval'
        })
      });

      assert.strictEqual(res.status, 404, 'Must return 404 NotFoundException instead of fake { success: true }');
      const body = await res.json();
      assert.ok(body.message || body.error, 'Must contain descriptive error message');
    });

    it('APP-02: GET /api/v1/approvals returns authentic list without fabricated records', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/approvals`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200, 'Approvals list must return 200');
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Approvals must be an array');
    });
  });

  // ==============================================================
  // 3. CALL TRANSFER (Real DB Persistence & Negative 404)
  // ==============================================================
  describe('Module 3: Call Transfer Real Persistence & Negative 404', () => {
    it('XFER-01: POST /api/v1/calls/:sid/transfer returns 404 on non-existent call SID', async () => {
      const fakeSid = '00000000-0000-0000-0000-000000000000';
      const res = await fetch(`${BASE_URL}/api/v1/calls/${fakeSid}/transfer`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          targetDepartment: 'Care Support'
        })
      });

      assert.strictEqual(res.status, 404, 'Transfer on non-existent session must return 404');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('not found') || data.error.includes('Missing'));
    });

    it('XFER-02: POST /api/v1/calls/:sid/transfer updates transferHistory in real Prisma DB', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/calls/${testCallSession.id}/transfer`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          targetUserId: testUser.id,
          targetDepartment: 'Elder Care Escalation'
        })
      });

      assert.strictEqual(res.status, 200, 'Valid transfer must return 200');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.callSid, testCallSession.id);

      // Verify authentic database persistence in Prisma
      const updated = await prisma.callSession.findUnique({
        where: { id: testCallSession.id }
      });

      assert.ok(updated, 'CallSession must exist in DB');
      const history = updated.transferHistory;
      assert.ok(history, 'transferHistory must exist');
      assert.ok(Array.isArray(history.transfers), 'transferHistory.transfers must be an array');
      assert.ok(history.transfers.length > 0, 'Must contain at least one transfer record');
      const latest = history.transfers[history.transfers.length - 1];
      assert.strictEqual(latest.targetDepartment, 'Elder Care Escalation');
      assert.ok(latest.transferredAt, 'Must record transferredAt timestamp');
    });
  });

  // ==============================================================
  // 4. POST-CALL CSAT & FEEDBACK (Real DB Notes & Validation)
  // ==============================================================
  describe('Module 4: Post-Call CSAT & Customer Notes Real Persistence', () => {
    it('CSAT-01: POST /api/v1/feedback returns 400 on invalid csatScore', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          callSid: testCallSession.id,
          csatScore: 10 // Invalid: must be 1-5
        })
      });

      assert.strictEqual(res.status, 400, 'CSAT score out of range must return 400');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('between 1 and 5'));
    });

    it('CSAT-02: POST /api/v1/feedback returns 404 for missing call session', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          callSid: '00000000-0000-0000-0000-000000000000',
          csatScore: 5,
          feedbackText: 'Test review'
        })
      });

      assert.strictEqual(res.status, 404, 'Non-existent session must return 404 (no fake success)');
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('CSAT-03: POST /api/v1/feedback persists CustomerNote and updates transferHistory.feedback', async () => {
      const feedbackContent = `Authentic Customer Feedback ${testRunId}`;
      const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          callSid: testCallSession.id,
          csatScore: 5,
          feedbackText: feedbackContent
        })
      });

      assert.strictEqual(res.status, 200, 'Feedback submission must return 200');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.csatScore, 5);

      // Verify Prisma database persistence: CustomerNote
      const note = await prisma.customerNote.findFirst({
        where: {
          customerId: testCustomer.id,
          content: { contains: feedbackContent }
        }
      });

      assert.ok(note, 'CustomerNote must be authentically persisted in database');
      assert.ok(note.content.includes('CSAT: 5/5'), 'CustomerNote must contain formatted score');

      // Verify Prisma database persistence: CallSession.transferHistory.feedback
      const sessionInDb = await prisma.callSession.findUnique({
        where: { id: testCallSession.id }
      });
      assert.strictEqual(sessionInDb.transferHistory?.feedback?.score, 5);
      assert.strictEqual(sessionInDb.transferHistory?.feedback?.text, feedbackContent);
    });
  });

  // ==============================================================
  // 5. DASHBOARD ANALYTICS REAL AGGREGATION
  // ==============================================================
  describe('Module 5: Dashboard Analytics Authentic Aggregation', () => {
    it('DASH-01: GET /dashboard/analytics returns real aggregated metrics without fake fallbacks', async () => {
      const res = await fetch(`${BASE_URL}/dashboard/analytics`, {
        headers: authHeaders
      });

      assert.strictEqual(res.status, 200, 'Dashboard analytics must return 200');
      const data = await res.json();

      // Top-level KPI counts
      assert.strictEqual(typeof data.totalCalls, 'number', 'totalCalls must be a number');
      assert.strictEqual(typeof data.activeAgents, 'number', 'activeAgents must be a number');
      assert.strictEqual(typeof data.openTickets, 'number', 'openTickets must be a number');
      assert.ok(data.sentiment, 'sentiment breakdown object must be present');

      // Detailed metrics object
      assert.ok(data.metrics, 'data.metrics must be present');
      assert.strictEqual(typeof data.metrics.unreadMessages, 'number', 'unreadMessages must be a number');
      assert.strictEqual(typeof data.metrics.assignedTickets, 'number', 'assignedTickets must be a number');
      assert.ok(Array.isArray(data.metrics.agentLeaderboard), 'agentLeaderboard must be an array');
      assert.ok(Array.isArray(data.metrics.omnichannelShare), 'omnichannelShare must be an array');
      assert.ok(Array.isArray(data.metrics.callsPerHour), 'callsPerHour must be an array');
      assert.strictEqual(data.metrics.callsPerHour.length, 24, 'callsPerHour must contain 24 hours');
    });
  });

  // ==============================================================
  // 6. AI POST-CALL PROCESSING HONEST ERROR REPORTING
  // ==============================================================
  describe('Module 6: AI Post-Call Pipeline Honest Failure Mode', () => {
    it('AI-01: ai.js generateCallSummary returns honest failure mode instead of fake neutral sentiment', async () => {
      const aiModule = require(path.resolve('CRM/Backend/src/legacy/ai.js'));

      // If called with empty / invalid input, it must not fake success
      const result = await aiModule.generateCallSummary('');

      assert.strictEqual(result.success, false, 'Empty transcript processing must return success: false');
      assert.strictEqual(result.failed, true, 'Must indicate failed: true');
      assert.ok(result.error, 'Must supply informative error description');
      assert.strictEqual(result.summary, null, 'Must not fabricate a fake summary');
    });
  });

  // ==============================================================
  // 7. CARRIER WEBHOOK REAL DYNAMIC ROUTING
  // ==============================================================
  describe('Module 7: Carrier Webhook Input Validation & Dynamic Host Resolution', () => {
    it('VOB-01: POST /vobiz/incoming rejects missing From caller number with 400', async () => {
      const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          CallUUID: 'test-call-uuid-without-from'
        }).toString()
      });

      assert.strictEqual(res.status, 400, 'Missing From must return 400 Bad Request');
      const text = await res.text();
      assert.ok(text.includes('Missing required From') || text.includes('From caller number is required'));
    });

    it('VOB-02: POST /vobiz/incoming resolves host dynamically without hardcoded ngrok URL', async () => {
      const customHost = 'crm-production.paramantra.com';
      const res = await fetch(`${BASE_URL}/vobiz/incoming`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-Host': customHost,
          'X-Forwarded-Proto': 'https'
        },
        body: new URLSearchParams({
          From: '+919876543210',
          To: '+918000000000',
          CallUUID: 'test-call-uuid-dynamic'
        }).toString()
      });

      assert.strictEqual(res.status, 200, 'Carrier webhook with From must return 200 XML');
      const xml = await res.text();
      assert.ok(xml.includes('<Response>'), 'Must return valid Vobiz XML');
      // Must not contain hardcoded mock ngrok url
      assert.ok(!xml.includes('your-ngrok-url'), 'Must not contain hardcoded "your-ngrok-url" placeholder');
      assert.ok(xml.includes(customHost), `Callback URL must dynamically resolve to ${customHost}`);
    });
  });
});
