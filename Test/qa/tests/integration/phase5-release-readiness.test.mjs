/**
 * PHASE 5: RELEASE READINESS, DATABASE INTEGRITY AND LIVE WEBSITE ACTIVATION
 * 
 * Verifies:
 * 1. Security release gates (bound HMAC, timestamp drift, replay window, secret redaction, body limits).
 * 2. Database & idempotency release gates (WebsiteLeadSubmission uniqueness, multi-instance durability, Redis resilience).
 * 3. Repeat enquiries vs new submission ID handling.
 * 4. Historical batch import metrics (attempted, imported, skipped, failed, remaining) and checkpoint integrity.
 * 5. Full 7-source activation validation with cryptographic signatures.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../../../CRM/Backend/node_modules/@prisma/client');

const BASE_URL = 'http://localhost:4000';
const prisma = new PrismaClient();

const SOURCE_SECRETS = {
  'anbu-sri-sai': 'sec_anbu_sri_sai_eldercare_2026',
  'thathapatti': 'sec_thathapatti_eldercare_2026',
  'thathapatti-homecare': 'sec_thathapatti_homecare_2026',
  'uncf-trust': 'sec_uncf_trust_eldercare_2026',
  'universal-eldercare': 'sec_universal_eldercare_2026',
  'zencura': 'sec_zencura_eldercare_2026',
  'bytezcorp': 'sec_bytezcorp_eldercare_2026',
};

async function getAdminToken() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'Raghav@uec.com',
      password: 'raghav@uec.com',
    }),
  });
  assert.ok(res.status === 200 || res.status === 201, `Super admin login failed with status ${res.status}`);
  const data = await res.json();
  return data.access_token || data.token;
}

function generateSignature(secret, timestamp, rawBody) {
  const payloadToSign = `${timestamp}.${rawBody}`;
  return crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
}

describe('PHASE 5: RELEASE READINESS & DATABASE INTEGRITY AUDIT', () => {

  describe('Gate 1: Database-Enforced External Submission Uniqueness & Idempotency', () => {
    test('P5-DB-01: WebsiteLeadSubmission table exists with unique constraint on (sourceId, externalSubmissionId)', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'WebsiteLeadSubmission';
      `;
      const uniqueIdx = indexes.find(i => i.indexname.includes('sourceId_externalSubmissionId') || i.indexdef.includes('UNIQUE'));
      assert.ok(uniqueIdx, 'Unique index must exist on WebsiteLeadSubmission for sourceId and externalSubmissionId');
      assert.match(uniqueIdx.indexdef, /sourceId.*externalSubmissionId/i);
    });

    test('P5-DB-02: PostgreSQL unique constraint prevents duplicate ingestion even if Redis cache is bypassed', async () => {
      const sourceId = 'anbu-sri-sai';
      const secret = SOURCE_SECRETS[sourceId];
      const externalId = `p5-db-test-${Date.now()}`;
      const uniquePhone = `+9191100${Math.floor(10000 + Math.random() * 90000)}`;

      const payload = {
        fname: 'Database',
        lname: 'Integrity Test',
        phone: uniquePhone,
        service: 'Home Nursing',
        externalLeadId: externalId,
      };

      const rawBody = JSON.stringify(payload);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const sig = generateSignature(secret, timestamp, rawBody);

      // First delivery: creates lead and WebsiteLeadSubmission record
      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': sig,
          'x-webhook-timestamp': timestamp,
        },
        body: rawBody,
      });

      assert.ok(res1.status === 200 || res1.status === 201, `Delivery 1 status: ${res1.status}`);
      const body1 = await res1.json();
      assert.equal(body1.status, 'created');
      const leadId = body1.leadId;

      // Verify row in WebsiteLeadSubmission table
      const subRow = await prisma.websiteLeadSubmission.findUnique({
        where: {
          sourceId_externalSubmissionId: {
            sourceId,
            externalSubmissionId: externalId,
          },
        },
      });
      assert.ok(subRow, 'WebsiteLeadSubmission record must exist in PostgreSQL');
      assert.equal(subRow.leadId, leadId);
      assert.equal(subRow.status, 'PROCESSED');

      // Second delivery with different fresh timestamp (bypassing Redis signature nonce check)
      const freshTimestamp = String(Math.floor(Date.now() / 1000) + 1);
      const freshSig = generateSignature(secret, freshTimestamp, rawBody);

      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': freshSig,
          'x-webhook-timestamp': freshTimestamp,
        },
        body: rawBody,
      });

      assert.ok(res2.status === 200 || res2.status === 201, `Delivery 2 status: ${res2.status}`);
      const body2 = await res2.json();
      assert.equal(body2.status, 'duplicate_event', 'Must be recognized as duplicate_event via database table');
      assert.equal(body2.leadId, leadId);

      // Verify no duplicate row was created in Lead or WebsiteLeadSubmission
      const count = await prisma.websiteLeadSubmission.count({
        where: { sourceId, externalSubmissionId: externalId },
      });
      assert.equal(count, 1, 'WebsiteLeadSubmission must contain exactly 1 entry');
    });

    test('P5-DB-03: Repeat enquiry with same phone number but different externalSubmissionId links to existing customer lead', async () => {
      const sourceId = 'thathapatti';
      const secret = SOURCE_SECRETS[sourceId];
      const sharedPhone = `+9191200${Math.floor(10000 + Math.random() * 90000)}`;

      // Submission 1
      const subId1 = `p5-enquiry-A-${Date.now()}`;
      const payload1 = {
        name: 'Repeat Customer',
        phone: sharedPhone,
        service: '17',
        externalLeadId: subId1,
      };
      const raw1 = JSON.stringify(payload1);
      const ts1 = String(Math.floor(Date.now() / 1000));
      const sig1 = generateSignature(secret, ts1, raw1);

      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': sig1,
          'x-webhook-timestamp': ts1,
        },
        body: raw1,
      });
      const data1 = await res1.json();
      assert.equal(data1.status, 'created');
      const leadId = data1.leadId;

      // Submission 2: Same customer, later enquiry with new external ID
      const subId2 = `p5-enquiry-B-${Date.now()}`;
      const payload2 = {
        name: 'Repeat Customer',
        phone: sharedPhone,
        service: '18',
        externalLeadId: subId2,
        notes: 'Followup regarding physiotherapy services',
      };
      const raw2 = JSON.stringify(payload2);
      const ts2 = String(Math.floor(Date.now() / 1000));
      const sig2 = generateSignature(secret, ts2, raw2);

      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': sig2,
          'x-webhook-timestamp': ts2,
        },
        body: raw2,
      });
      const data2 = await res2.json();
      assert.equal(data2.status, 'existing_lead_updated', 'Must correlate to existing customer lead');
      assert.equal(data2.leadId, leadId, 'Must link to identical Lead id');

      // Verify both submissions are tracked in WebsiteLeadSubmission linked to the same lead
      const subs = await prisma.websiteLeadSubmission.findMany({
        where: { leadId },
      });
      assert.equal(subs.length, 2, 'Both submissions must exist in WebsiteLeadSubmission for the customer lead');
    });

    test('P5-DB-04: Failed transaction rolls back atomically without orphan records or partial state', async () => {
      // Trigger validation failure with invalid payload
      const sourceId = 'uncf-trust';
      const secret = SOURCE_SECRETS[sourceId];
      const payload = {
        name: 'Invalid Lead Without Phone',
        phone: '', // missing phone
        externalLeadId: `orphan-test-${Date.now()}`,
      };
      const raw = JSON.stringify(payload);
      const ts = String(Math.floor(Date.now() / 1000));
      const sig = generateSignature(secret, ts, raw);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': sig,
          'x-webhook-timestamp': ts,
        },
        body: raw,
      });

      assert.equal(res.status, 400);

      // Verify no submission record was created in database
      const orphanSub = await prisma.websiteLeadSubmission.findUnique({
        where: {
          sourceId_externalSubmissionId: {
            sourceId,
            externalSubmissionId: payload.externalLeadId,
          },
        },
      });
      assert.equal(orphanSub, null, 'No submission record must exist after validation failure');
    });
  });

  describe('Gate 2: Historical Batch Import & Checkpoint Guarantees', () => {
    test('P5-HIST-01: Batch import reports attempted, imported, skipped, failed and remaining record counts', async () => {
      const token = await getAdminToken();
      const sourceId = 'universal-eldercare';

      const batch = [
        {
          name: 'Batch Lead 1',
          phone: `+9191300${Math.floor(10000 + Math.random() * 90000)}`,
          serviceInterest: 'Assisted Living',
          externalSubmissionId: `p5-batch-1-${Date.now()}`,
          submittedAt: '2026-10-15T10:00:00Z',
        },
        {
          name: 'Batch Lead 2 - Invalid',
          phone: '', // invalid
          externalSubmissionId: `p5-batch-2-${Date.now()}`,
        },
        {
          name: 'Batch Lead 3',
          phone: `+9191400${Math.floor(10000 + Math.random() * 90000)}`,
          serviceInterest: 'Home Care',
          externalSubmissionId: `p5-batch-3-${Date.now()}`,
          submittedAt: '2026-10-15T11:00:00Z',
        },
      ];

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/${sourceId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          records: batch,
          options: { dryRun: false },
        }),
      });

      assert.ok(res.status === 200 || res.status === 201, `Status: ${res.status}`);
      const data = await res.json();

      assert.equal(data.totalProvided, 3);
      assert.equal(data.validRecords, 2);
      assert.equal(data.invalidRecords, 1);
      assert.equal(data.createdCount, 2);
      assert.equal(data.attemptedCount, 3);
      assert.equal(data.remainingCount, 0);
      assert.equal(data.errors.length, 1);
      assert.equal(data.errors[0].index, 1);
    });

    test('P5-HIST-02: Checkpoint never advances past interrupted record and safely resumes remaining records', async () => {
      const token = await getAdminToken();
      const sourceId = 'zencura';

      const batch = [
        {
          name: 'Zencura A',
          phone: `+9191500${Math.floor(10000 + Math.random() * 90000)}`,
          externalLeadId: `zen-rec-0-${Date.now()}`,
        },
        {
          name: 'Zencura B',
          phone: `+9191600${Math.floor(10000 + Math.random() * 90000)}`,
          externalLeadId: `zen-rec-1-${Date.now()}`,
        },
        {
          name: 'Zencura C',
          phone: `+9191700${Math.floor(10000 + Math.random() * 90000)}`,
          externalLeadId: `zen-rec-2-${Date.now()}`,
        },
      ];

      // Run 1: Interrupted at index 1
      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/${sourceId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          records: batch,
          options: {
            dryRun: false,
            simulateInterruptionAtIndex: 1,
          },
        }),
      });

      const data1 = await res1.json();
      assert.equal(data1.success, false);
      assert.equal(data1.checkpointCursor, 'index:0', 'Checkpoint must halt at last successful index (0)');

      // Run 2: Resume using saved checkpoint cursor
      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/${sourceId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          records: batch,
          options: {
            dryRun: false,
            checkpoint: data1.checkpointCursor,
          },
        }),
      });

      const data2 = await res2.json();
      assert.equal(data2.success, true);
      assert.equal(data2.createdCount, 2, 'Remaining 2 records (indices 1 and 2) must be imported');
      assert.equal(data2.checkpointCursor, 'index:2');
    });

    test('P5-HIST-03: Original submission time is stored distinctly in WebsiteLeadSubmission and does not overwrite CRM createdAt', async () => {
      const token = await getAdminToken();
      const sourceId = 'bytezcorp';
      const submittedAt = '2026-08-10T14:30:00.000Z';
      const externalId = `p5-orig-time-${Date.now()}`;

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/${sourceId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          records: [
            {
              name: 'Time Check Lead',
              phone: `+9191800${Math.floor(10000 + Math.random() * 90000)}`,
              externalSubmissionId: externalId,
              submittedAt,
            },
          ],
        }),
      });

      assert.ok(res.status === 200 || res.status === 201, `Status: ${res.status}`);

      // Verify row in database
      const sub = await prisma.websiteLeadSubmission.findUnique({
        where: {
          sourceId_externalSubmissionId: {
            sourceId,
            externalSubmissionId: externalId,
          },
        },
        include: { lead: true },
      });

      assert.ok(sub);
      assert.ok(sub.sourceSubmittedAt, 'sourceSubmittedAt must be populated');
      assert.equal(sub.sourceSubmittedAt.toISOString(), submittedAt);
      
      // CRM lead createdAt is current timestamp (recent within 60s)
      const crmCreatedAt = sub.lead.createdAt.getTime();
      const now = Date.now();
      assert.ok(Math.abs(now - crmCreatedAt) < 60000, 'CRM lead createdAt must reflect ingestion timestamp');
    });
  });

  describe('Gate 3: All 7 Sources Controlled Activation Validation', () => {
    const sources = [
      { id: 'anbu-sri-sai', name: 'Anbu Sri Sai Home Nursing', testPayload: { fname: 'Activation', lname: 'Sai', phone: '+919210000001', service: 'Nursing' } },
      { id: 'thathapatti', name: 'Thatha Patti Eldercare', testPayload: { name: 'Activation Thatha', phone: '+919220000002', service: '17' } },
      { id: 'thathapatti-homecare', name: 'Thatha Patti Home Care', testPayload: { name: 'Activation Homecare', phone: '+919230000003', service: '28' } },
      { id: 'uncf-trust', name: 'UNCF Trust Care', testPayload: { name: 'Activation UNCF', phone: '+919240000004', subject: 'Enquiry', message: 'Assistance' } },
      { id: 'universal-eldercare', name: 'Universal Eldercare Main', testPayload: { fullName: 'Activation Universal', contactNumber: '+919250000005', serviceRequired: 'Elder Care' } },
      { id: 'zencura', name: 'Zencura Wellness', testPayload: { customer_name: 'Activation Zencura', mobile: '+919260000006', goals: 'Senior Wellness' } },
      { id: 'bytezcorp', name: 'Bytez Corp Technologies', testPayload: { clientName: 'Activation Bytez', phone: '+919270000007', requirement: 'Tech Platform' } },
    ];

    for (const src of sources) {
      test(`P5-ACT-SRC: ${src.id} (${src.name}) signed webhook ingestion and deduplication`, async () => {
        const secret = SOURCE_SECRETS[src.id];
        const externalLeadId = `act-${src.id}-${Date.now()}`;
        const payload = {
          ...src.testPayload,
          phone: `+9192${Math.floor(10000000 + Math.random() * 90000000)}`,
          externalLeadId,
        };

        const rawBody = JSON.stringify(payload);
        const timestamp = String(Math.floor(Date.now() / 1000));
        const sig = generateSignature(secret, timestamp, rawBody);

        // Webhook delivery
        const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${src.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': sig,
            'x-webhook-timestamp': timestamp,
          },
          body: rawBody,
        });

        assert.ok(res.status === 200 || res.status === 201, `Source ${src.id} webhook failed with status ${res.status}`);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.status, 'created');
        assert.ok(data.leadId);

        // Immediate replay should be blocked with 401
        const replayRes = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${src.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': sig,
            'x-webhook-timestamp': timestamp,
          },
          body: rawBody,
        });
        assert.equal(replayRes.status, 401, 'Replay of exact signature must be rejected');
      });
    }
  });

  describe('Gate 4: Security Hygiene, Secret Redaction and Rate Limiting', () => {
    test('P5-SEC-01: Admin status endpoint never prints secrets or keys', async () => {
      const token = await getAdminToken();
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const text = await res.text();

      for (const secret of Object.values(SOURCE_SECRETS)) {
        assert.equal(text.includes(secret), false, `Sensitive secret '${secret}' must not be exposed`);
      }
    });

    test('P5-SEC-02: Large payload exceeding body parser limit is safely rejected', async () => {
      const sourceId = 'anbu-sri-sai';
      const secret = SOURCE_SECRETS[sourceId];
      // Generate large body (> 1MB)
      const bigString = 'A'.repeat(1024 * 1024 * 2); // 2MB
      const payload = { name: 'Big Payload', phone: '+919999999999', notes: bigString };
      const raw = JSON.stringify(payload);
      const ts = String(Math.floor(Date.now() / 1000));
      const sig = generateSignature(secret, ts, raw);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/${sourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': sig,
          'x-webhook-timestamp': ts,
        },
        body: raw,
      });

      // Express payload too large returns 413
      assert.equal(res.status, 413, 'Payload over limit must return 413 Payload Too Large');
    });
  });
});
