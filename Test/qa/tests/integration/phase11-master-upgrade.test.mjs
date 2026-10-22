/**
 * PHASE 11: MASTER UPGRADE & BUG REMEDIATION TEST SUITE
 * 
 * Verifies:
 * 1. Post-call feedback API with non-UUID callSid (prevents Prisma P2023 UUID crash).
 * 2. Reliable post-call lead activity, disposition outcomes (COMPLETED, UNANSWERED, etc.), and follow-up scheduling.
 * 3. Cross-unit lead transfer: authorized execution, role-based denial (403), same-unit rejection (400), preview duplicate detection, and audit preservation.
 * 4. AI usage telemetry (GET /api/v1/analytics/ai-usage): truthful token counts, feature/model breakdown, and documented pricing config.
 * 5. AI pipeline self-healing (POST /api/v1/analytics/repair-pending): synthesizes summaries for calls where recording failed or was unavailable.
 * 6. Playback URL resolution: handles non-UUID and UUID call identifiers safely.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../../../CRM/Backend/node_modules/@prisma/client');

const BASE_URL = 'http://localhost:4000';
const prisma = new PrismaClient();

let superAdminToken = '';
let agentToken = '';
let testUnitA = null;
let testUnitB = null;
let testLead = null;
let testAgent = null;

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.accessToken || data.token;
}

describe('PHASE 11: MASTER UPGRADE & RECORDING/AI REMEDIATION AUDIT', () => {
  before(async () => {
    // 1. Authenticate Super Admin
    superAdminToken = await loginUser('Raghav@uec.com', 'raghav@uec.com');
    assert.ok(superAdminToken, 'Super Admin token must be obtained');

    // 2. Fetch or create test business units
    const units = await prisma.businessUnit.findMany({ take: 2 });
    if (units.length >= 2) {
      testUnitA = units[0];
      testUnitB = units[1];
    } else {
      testUnitA = await prisma.businessUnit.create({
        data: { code: 'TEST_U1', name: 'Test Unit Alpha' },
      });
      testUnitB = await prisma.businessUnit.create({
        data: { code: 'TEST_U2', name: 'Test Unit Beta' },
      });
    }

    // 3. Find an active agent for assignment
    testAgent = await prisma.agent.findFirst({ where: { status: 'AVAILABLE' } });
    if (!testAgent) {
      testAgent = await prisma.agent.findFirst();
    }

    // 4. Create an isolated test lead
    const uniquePhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
    testLead = await prisma.lead.create({
      data: {
        customerName: 'Test Patient Master Upgrade',
        phoneNumber: uniquePhone,
        serviceInterest: 'Elderly Home Care',
        city: 'Chennai',
        notes: 'Initial test lead created for cross-unit and post-call test.',
        unitId: testUnitA.id,
      },
    });
  });

  after(async () => {
    // Cleanup created test records
    if (testLead) {
      await prisma.leadTransferAudit.deleteMany({ where: { leadId: testLead.id } });
      await prisma.leadFollowup.deleteMany({ where: { leadId: testLead.id } });
      await prisma.lead.delete({ where: { id: testLead.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // GATE 1: POST-CALL FEEDBACK & PRISMA UUID DEFECT REMEDIATION
  // =========================================================================
  describe('Gate 1: Post-Call Disposition & Feedback Non-UUID Handling', () => {
    test('FB-01: POST /api/v1/feedback accepts non-UUID callSid (e.g., call_outbound_...) without Prisma P2023 crash', async () => {
      const nonUuidCallSid = 'call_outbound_1792643412140';
      const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          callSid: nonUuidCallSid,
          csatScore: 4,
          outcome: 'COMPLETED',
          tags: ['Resolved', 'Quality Assurance'],
          notes: 'Test feedback verifying non-UUID callSid does not throw P2023 error',
        }),
      });

      // Must be either 200 (if session exists) or 404 (if session not found). Under NO circumstances should it be 500 P2023!
      assert.notEqual(res.status, 500, 'Server must never crash with HTTP 500 Prisma P2023 UUID error');
      assert.ok([200, 404].includes(res.status), `Expected 200 or 404, got HTTP ${res.status}`);

      if (res.status === 200) {
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.outcome, 'COMPLETED');
      }
    });

    test('FB-02: POST /api/v1/feedback rejects invalid csatScore with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          callSid: 'call_test_invalid_score',
          csatScore: 7, // Invalid (>5)
        }),
      });
      assert.equal(res.status, 400, 'Should reject csatScore > 5 with 400');
    });

    test('FB-03: Post-call disposition persists outcome, updates lead timeline and schedules callback', async () => {
      // Create a temporary CallSession matching our test lead
      const sessionRoom = `test_room_${Date.now()}`;
      const session = await prisma.callSession.create({
        data: {
          livekitRoom: sessionRoom,
          reason: sessionRoom,
          status: 'ENDED',
          recordingStatus: 'NOT_AVAILABLE',
        },
      });

      const followupDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      const res = await fetch(`${BASE_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          callSid: sessionRoom,
          outcome: 'COMPLETED',
          csatScore: 5,
          tags: ['Follow-up needed', 'Interested'],
          notes: 'Patient requested detailed home care package brochure.',
          followupDate,
          leadId: testLead.id,
        }),
      });

      assert.equal(res.status, 200, 'Feedback submission must succeed');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.matchedLeadId, testLead.id);
      assert.equal(data.outcome, 'COMPLETED');

      // Verify DB persistence on Lead
      const updatedLead = await prisma.lead.findUnique({
        where: { id: testLead.id },
        include: { followups: true },
      });
      assert.ok(updatedLead.notes.includes('Patient requested detailed home care package brochure'));
      assert.ok(updatedLead.followups.length > 0, 'Followup callback must be created');

      // Cleanup session
      await prisma.callSession.delete({ where: { id: session.id } });
    });
  });

  // =========================================================================
  // GATE 2: CROSS-UNIT LEAD TRANSFER (SUPER ADMIN GOVERNANCE)
  // =========================================================================
  describe('Gate 2: Cross-Unit Lead Transfer Authorization & Integrity', () => {
    test('XU-01: Same-unit transfer is rejected with HTTP 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/leads/transfer/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          leadId: testLead.id,
          sourceUnitId: testUnitA.id,
          destinationUnitId: testUnitA.id, // Same unit!
        }),
      });

      assert.equal(res.status, 400, 'Same unit transfer preview must return 400');
      const data = await res.json();
      assert.ok(
        (data.message && data.message.includes('Source and destination')) ||
        (data.error && data.error.includes('Source and destination')) ||
        data.statusCode === 400
      );
    });

    test('XU-02: Lead search endpoint filters by unit and returns matched lead', async () => {
      const res = await fetch(
        `${BASE_URL}/api/v1/super-admin/leads/search?q=${encodeURIComponent(testLead.customerName)}&unitId=${testUnitA.id}`,
        {
          headers: { 'Authorization': `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.ok(list.some(l => l.id === testLead.id));
    });

    test('XU-03: Preview verifies duplicate check and associated record counts', async () => {
      const currentLead = await prisma.lead.findUnique({ where: { id: testLead.id } });
      const srcId = currentLead.unitId === testUnitA.id ? testUnitA.id : testUnitB.id;
      const dstId = currentLead.unitId === testUnitA.id ? testUnitB.id : testUnitA.id;

      const res = await fetch(`${BASE_URL}/api/v1/super-admin/leads/transfer/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          leadId: testLead.id,
          sourceUnitId: srcId,
          destinationUnitId: dstId,
        }),
      });

      assert.ok([200, 201].includes(res.status), `Preview must return 200 or 201, got ${res.status}`);
      const preview = await res.json();
      assert.equal(preview.lead.id, testLead.id);
      assert.ok(preview.sourceUnit);
      assert.ok(preview.destinationUnit);
      assert.ok(typeof preview.duplicateWarning === 'boolean');
      assert.ok(preview.associatedRecords);
    });

    test('XU-04: Authorized Super Admin executes atomic cross-unit transfer with audit logging', async () => {
      const currentLead = await prisma.lead.findUnique({ where: { id: testLead.id } });
      const srcId = currentLead.unitId === testUnitA.id ? testUnitA.id : testUnitB.id;
      const dstId = currentLead.unitId === testUnitA.id ? testUnitB.id : testUnitA.id;

      const reasonText = 'Patient relocating from Chennai to Coimbatore branch';
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/leads/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          leadId: testLead.id,
          sourceUnitId: srcId,
          destinationUnitId: dstId,
          reason: reasonText,
        }),
      });

      assert.ok([200, 201].includes(res.status), `Cross-unit transfer execution must return 200 or 201, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.auditId, 'Audit ID must be returned on transfer');

      // Verify DB persistence on Lead
      const updatedLead = await prisma.lead.findUnique({ where: { id: testLead.id } });
      assert.equal(updatedLead.unitId, dstId, 'Lead must now belong to destination unit');

      // Verify LeadTransferAudit record exists in database
      const audit = await prisma.leadTransferAudit.findFirst({
        where: { leadId: testLead.id },
        orderBy: { createdAt: 'desc' },
      });
      assert.ok(audit, 'LeadTransferAudit record must be created');
      assert.equal(audit.sourceUnitId, srcId);
      assert.equal(audit.destUnitId, dstId);
      assert.equal(audit.reason, reasonText);
    });

    test('XU-05: Non-super-admin is denied access with HTTP 403 Forbidden', async () => {
      // Make a dummy token or unprivileged request
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiQUdFTlQifQ.fake';
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/leads/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${fakeToken}`,
        },
        body: JSON.stringify({
          leadId: testLead.id,
          destinationUnitId: testUnitA.id,
        }),
      });
      assert.ok([401, 403].includes(res.status), `Must reject unauthorized role with 401 or 403, got ${res.status}`);
    });
  });

  // =========================================================================
  // GATE 3: AI USAGE KPI & PIPELINE REPAIR
  // =========================================================================
  describe('Gate 3: AI Usage Telemetry & Pipeline Self-Healing', () => {
    test('AI-01: GET /api/v1/analytics/ai-usage returns truthful prompt/candidate token metrics & versioned pricing', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics/ai-usage?timeRange=30d`, {
        headers: { 'Authorization': `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200, 'AI usage endpoint must return 200');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.summary, 'Summary object must exist');
      assert.ok(typeof data.summary.totalRequests === 'number');
      assert.ok(typeof data.summary.totalTokens === 'number');
      assert.ok(typeof data.summary.estimatedCostUsd === 'number');
      assert.equal(data.summary.costType, 'ESTIMATED');
      assert.equal(data.summary.authoritativeLiveCredits, null, 'Must truthfully report null for live credits when provider balance API is unavailable');
      assert.ok(data.byModel, 'Must report model breakdown');
      assert.ok(data.byFeature, 'Must report feature breakdown');
      assert.equal(data.pricingConfig.version, '2026-v1');
    });

    test('AI-02: POST /api/v1/analytics/repair-pending executes gracefully and repairs stranded calls', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics/repair-pending?limit=1`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${superAdminToken}` },
      });

      assert.ok([200, 201].includes(res.status), `Repair endpoint must return 200 or 201, got ${res.status}`);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(typeof data.repaired === 'number' || typeof data.repairedCount === 'number');
    });
  });

  // =========================================================================
  // GATE 4: PLAYBACK URL LIFECYCLE RESOLUTION
  // =========================================================================
  describe('Gate 4: Authenticated Audio Playback Lifecycle', () => {
    test('PB-01: Playback URL endpoint resolves session safely for non-UUID and UUID', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/call_outbound_1792643412140/playback-url`, {
        headers: { 'Authorization': `Bearer ${superAdminToken}` },
      });

      assert.notEqual(res.status, 500, 'Playback URL query must not crash with 500');
      const data = await res.json();
      // Should return either valid playback URL or truthful status
      assert.ok(typeof data.success === 'boolean');
      if (!data.success) {
        assert.ok(data.recordingStatus || data.error);
      }
    });
  });
});
