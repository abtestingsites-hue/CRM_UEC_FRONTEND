import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));
const prisma = require(path.resolve('CRM/Backend/src/legacy/prisma.js'));

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

// Super Admin Auth token for elevated administrative actions
const adminToken = jwt.sign(
  {
    userId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
    agentId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
    email: 'admin@paramantra.com',
    role: 'SUPER_ADMIN',
    userType: 'SUPER_ADMIN',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const authHeaders = {
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
};

// Non-admin Agent token
const agentToken = jwt.sign(
  {
    userId: 'agent-12345',
    agentId: 'agent-12345',
    email: 'agent@paramantra.com',
    role: 'AGENT',
    userType: 'AGENT',
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const agentAuthHeaders = {
  Authorization: `Bearer ${agentToken}`,
  'Content-Type': 'application/json',
};

const SOURCE_SECRETS = {
  'anbu-sri-sai': process.env.LEAD_WEBHOOK_SECRET_ANBU_SRI_SAI || 'sec_anbu_sri_sai_eldercare_2026',
  thathapatti: process.env.LEAD_WEBHOOK_SECRET_THATHAPATTI || 'sec_thathapatti_eldercare_2026',
  'thathapatti-homecare': process.env.LEAD_WEBHOOK_SECRET_THATHAPATTI_HOMECARE || 'sec_thathapatti_homecare_2026',
  'uncf-trust': process.env.LEAD_WEBHOOK_SECRET_UNCF_TRUST || 'sec_uncf_trust_eldercare_2026',
  'universal-eldercare': process.env.LEAD_WEBHOOK_SECRET_UNIVERSAL_ELDERCARE || 'sec_universal_eldercare_2026',
  zencura: process.env.LEAD_WEBHOOK_SECRET_ZENCURA || 'sec_zencura_eldercare_2026',
  bytezcorp: process.env.LEAD_WEBHOOK_SECRET_BYTEZCORP || 'sec_bytezcorp_eldercare_2026',
};

function computeBoundHmac(secret, payload, timestamp) {
  const data = timestamp ? `${timestamp}.${payload}` : payload;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

describe('PHASE 4: ADVERSARIAL SECURITY VALIDATION AND LIVE-INTEGRATION READINESS', () => {
  const runId = Date.now();
  const createdLeadPhones = [];

  after(async () => {
    if (createdLeadPhones.length > 0) {
      try {
        await prisma.lead.deleteMany({
          where: {
            phoneNumber: { in: createdLeadPhones },
          },
        });
      } catch (err) {
        console.warn('Cleanup warning:', err.message);
      }
    }
  });

  // ============================================================================
  // 1. VALIDATE THE WEBHOOK SIGNATURE PROTOCOL & REPLAY ATTACK RESILIENCE
  // ============================================================================
  describe('Module 1: Webhook Signature Protocol & Replay Attack Resilience', () => {
    it('ADV-SIG-01: Accepts valid cryptographically bound HMAC-SHA256 signature (${timestamp}.${rawBody})', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const testPhone = `+9198801${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const timestamp = String(Date.now());
      const rawPayload = JSON.stringify({
        name: `Bound Signature Lead ${runId}`,
        phone: testPhone,
        service: '17',
      });
      const signature = computeBoundHmac(secret, rawPayload, timestamp);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': `sha256=${signature}`,
          'x-webhook-timestamp': timestamp,
        },
        body: rawPayload,
      });

      assert.strictEqual(res.status, 201, 'Expected 201 Created for valid bound signature');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'created');
      assert.ok(data.leadId);
    });

    it('ADV-SIG-02: Rejects tampered request body when signature was signed over original body (401)', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const originalPayload = JSON.stringify({ name: 'Legit Request', phone: '+919880000001' });
      const timestamp = String(Date.now());
      const signature = computeBoundHmac(secret, originalPayload, timestamp);

      // Adversary modifies body
      const tamperedPayload = JSON.stringify({ name: 'Tampered Request', phone: '+919880000002' });

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': signature,
          'x-webhook-timestamp': timestamp,
        },
        body: tamperedPayload,
      });

      assert.strictEqual(res.status, 401, 'Tampered payload must be rejected with 401');
    });

    it('ADV-SIG-03: Rejects tampered timestamp header when signature bound original timestamp (401)', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const testPayload = JSON.stringify({ name: 'Tamper Timestamp Test', phone: '+919880000003' });
      const originalTimestamp = String(Date.now());
      const signature = computeBoundHmac(secret, testPayload, originalTimestamp);

      // Adversary alters timestamp header
      const alteredTimestamp = String(Date.now() - 30000);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': signature,
          'x-webhook-timestamp': alteredTimestamp,
        },
        body: testPayload,
      });

      assert.strictEqual(res.status, 401, 'Altered timestamp must invalidate bound HMAC');
    });

    it('ADV-SIG-04: Rejects stale timestamp exceeding 5-minute replay window (401)', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const staleTimestamp = String(Date.now() - 360000); // 6 minutes ago
      const payload = JSON.stringify({ name: 'Stale Lead', phone: '+919880000004' });
      const signature = computeBoundHmac(secret, payload, staleTimestamp);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': signature,
          'x-webhook-timestamp': staleTimestamp,
        },
        body: payload,
      });

      assert.strictEqual(res.status, 401, 'Stale timestamp must be rejected with 401');
    });

    it('ADV-SIG-05: Rejects future timestamp exceeding 5-minute skew tolerance (401)', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const futureTimestamp = String(Date.now() + 360000); // 6 minutes ahead
      const payload = JSON.stringify({ name: 'Future Lead', phone: '+919880000005' });
      const signature = computeBoundHmac(secret, payload, futureTimestamp);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': signature,
          'x-webhook-timestamp': futureTimestamp,
        },
        body: payload,
      });

      assert.strictEqual(res.status, 401, 'Future timestamp drift must be rejected with 401');
    });

    it('ADV-SIG-06: Explicitly rejects unsigned timestamp-based requests when bound signature is enforced (401)', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const timestamp = String(Date.now());
      const payload = JSON.stringify({ name: 'Unbound Timestamp Lead', phone: '+919880000006' });
      // Attacker signs ONLY raw body, leaving timestamp unsigned
      const unboundSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': unboundSignature,
          'x-webhook-timestamp': timestamp,
          'x-require-bound-signature': 'true', // Enforce strict bound timestamp policy
        },
        body: payload,
      });

      assert.strictEqual(res.status, 401, 'Unsigned timestamp header must be rejected when bound policy is active');
    });

    it('ADV-SIG-07: Anti-replay protection rejects captured request resubmitted within replay window (401)', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const testPhone = `+9198807${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const timestamp = String(Date.now());
      const rawPayload = JSON.stringify({
        name: `Replay Test Lead ${runId}`,
        phone: testPhone,
        service: '17',
      });
      const signature = computeBoundHmac(secret, rawPayload, timestamp);

      // First delivery: valid
      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': signature,
          'x-webhook-timestamp': timestamp,
        },
        body: rawPayload,
      });
      assert.strictEqual(res1.status, 201, 'Initial request must succeed');

      // Immediate adversary replay: resend exact captured signature within replay window
      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': signature,
          'x-webhook-timestamp': timestamp,
        },
        body: rawPayload,
      });

      assert.strictEqual(res2.status, 401, 'Adversarial signature replay must be rejected with 401');
      const errData = await res2.json();
      assert.ok(errData.error.includes('Replay detected'), 'Error must specify replay detection');
    });

    it('ADV-SIG-08: Legacy shared-secret authentication enforces timestamp replay window (401 for stale)', async () => {
      const secret = SOURCE_SECRETS.bytezcorp;
      const staleTimestamp = String(Date.now() - 400000); // 6.6 min old

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/bytezcorp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': secret,
          'x-webhook-timestamp': staleTimestamp,
        },
        body: JSON.stringify({ name: 'Stale Shared Secret', phone: '+919880000008' }),
      });

      assert.strictEqual(res.status, 401, 'Shared secret cannot bypass replay window');
    });
  });

  // ============================================================================
  // 2. VALIDATE IDEMPOTENCY UNDER CONCURRENCY, RESTARTS & FAILURE
  // ============================================================================
  describe('Module 2: Idempotency Under Concurrency, Restarts & Failures', () => {
    it('ADV-IDEMP-01: Concurrent duplicate deliveries with identical externalLeadId resolve idempotently without duplicates', async () => {
      const secret = SOURCE_SECRETS.zencura;
      const testPhone = `+9198811${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);
      const extId = `concur_ext_${runId}_${Math.random()}`;

      const timestamp = String(Date.now());
      const rawPayload = JSON.stringify({
        fullName: `Concurrency Lead ${runId}`,
        phoneNumber: testPhone,
        serviceChoice: 'Integrative Wellness',
        externalSubmissionId: extId,
      });

      // Fire 3 simultaneous requests with identical externalLeadId
      const promises = [1, 2, 3].map((idx) => {
        const sig = computeBoundHmac(secret, rawPayload, String(Number(timestamp) + idx)); // distinct timestamps for signature anti-replay
        return fetch(`${BASE_URL}/api/v1/webhooks/leads/zencura`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-signature-256': sig,
            'x-webhook-timestamp': String(Number(timestamp) + idx),
          },
          body: rawPayload,
        });
      });

      const responses = await Promise.all(promises);
      const statuses = responses.map((r) => r.status);
      const bodies = await Promise.all(responses.map((r) => r.json()));

      // All requests must succeed (no 500 error)
      statuses.forEach((s) => assert.ok([200, 201].includes(s), `Status ${s} unexpected`));

      // Exactly one created (201), the other two acknowledged as duplicate_event (200)
      const createdCount = bodies.filter((b) => b.status === 'created').length;
      const dupCount = bodies.filter((b) => b.status === 'duplicate_event').length;

      assert.strictEqual(createdCount, 1, 'Exactly one request must create the lead');
      assert.strictEqual(dupCount, 2, 'Two requests must be recognized as duplicate events');

      // Database verification: exactly 1 lead in database
      const dbLeads = await prisma.lead.findMany({
        where: { phoneNumber: testPhone },
      });
      assert.strictEqual(dbLeads.length, 1, 'Database must have exactly 1 lead row');
    });

    it('ADV-IDEMP-02: Multi-instance / post-restart durability: PostgreSQL submission tag ensures duplicate recognized even without Redis key', async () => {
      const secret = SOURCE_SECRETS['anbu-sri-sai'];
      const testPhone = `+9198822${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);
      const extId = `restart_ext_${runId}_${Math.random()}`;

      const timestamp1 = String(Date.now());
      const rawPayload = JSON.stringify({
        fname: 'Restart',
        lname: 'Persistence',
        mobile: testPhone,
        service: 'Home Nursing Care',
        submission_id: extId,
      });
      const sig1 = computeBoundHmac(secret, rawPayload, timestamp1);

      // Initial delivery
      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/anbu-sri-sai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': sig1,
          'x-webhook-timestamp': timestamp1,
        },
        body: rawPayload,
      });
      assert.strictEqual(res1.status, 201);
      const data1 = await res1.json();
      assert.strictEqual(data1.status, 'created');

      // Verify that database note contains durable submission tag
      const dbLead = await prisma.lead.findUnique({
        where: { phoneNumber: testPhone },
      });
      assert.ok(dbLead.notes.includes(`[ExternalSubmissionId: anbu-sri-sai:${extId}]`), 'Notes must contain durable tag');

      // Subsequent retry with new timestamp (e.g. sender retry after restart)
      const timestamp2 = String(Date.now() + 5000);
      const sig2 = computeBoundHmac(secret, rawPayload, timestamp2);

      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/anbu-sri-sai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature-256': sig2,
          'x-webhook-timestamp': timestamp2,
        },
        body: rawPayload,
      });
      assert.strictEqual(res2.status, 200);
      const data2 = await res2.json();
      assert.strictEqual(data2.status, 'duplicate_event', 'Duplicate recognized across restarts');
      assert.strictEqual(data2.leadId, data1.leadId, 'Lead ID must match original');
    });

    it('ADV-IDEMP-03: Repeat enquiry with identical phone number updates existing lead notes instead of 500 collision', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const testPhone = `+9198833${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const ts1 = String(Date.now());
      const p1 = JSON.stringify({ name: 'Repeat Enquiry', phone: testPhone, service: '17' });
      const s1 = computeBoundHmac(secret, p1, ts1);

      // 1. Initial enquiry creates lead
      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-signature-256': s1, 'x-webhook-timestamp': ts1 },
        body: p1,
      });
      assert.strictEqual(res1.status, 201);

      // 2. Repeat enquiry with different service interest from same phone number
      const ts2 = String(Date.now() + 2000);
      const p2 = JSON.stringify({ name: 'Repeat Enquiry', phone: testPhone, service: '20' });
      const s2 = computeBoundHmac(secret, p2, ts2);

      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-signature-256': s2, 'x-webhook-timestamp': ts2 },
        body: p2,
      });
      assert.strictEqual(res2.status, 200);
      const data2 = await res2.json();
      assert.strictEqual(data2.status, 'existing_lead_updated');

      // Verify updated notes
      const dbLead = await prisma.lead.findUnique({ where: { phoneNumber: testPhone } });
      assert.ok(dbLead.notes.includes('Repeat enquiry from Website: thathapatti.com'));
    });

    it('ADV-IDEMP-04: Concurrency race condition recovery: Simultaneous new leads with same phone both resolve without 500', async () => {
      const secret = SOURCE_SECRETS['uncf-trust'];
      const testPhone = `+9198844${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const ts = String(Date.now());
      const p1 = JSON.stringify({ name: 'Race Lead A', phone: testPhone, message: 'Message A' });
      const p2 = JSON.stringify({ name: 'Race Lead B', phone: testPhone, message: 'Message B' });
      const s1 = computeBoundHmac(secret, p1, ts);
      const s2 = computeBoundHmac(secret, p2, String(Number(ts) + 1));

      const [r1, r2] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/webhooks/leads/uncf-trust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-signature-256': s1, 'x-webhook-timestamp': ts },
          body: p1,
        }),
        fetch(`${BASE_URL}/api/v1/webhooks/leads/uncf-trust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-signature-256': s2, 'x-webhook-timestamp': String(Number(ts) + 1) },
          body: p2,
        }),
      ]);

      assert.ok([200, 201].includes(r1.status));
      assert.ok([200, 201].includes(r2.status));
      assert.notStrictEqual(r1.status, 500);
      assert.notStrictEqual(r2.status, 500);

      // Verify only 1 record exists in database
      const count = await prisma.lead.count({ where: { phoneNumber: testPhone } });
      assert.strictEqual(count, 1, 'No duplicate record created during concurrency race');
    });
  });

  // ============================================================================
  // 3. VALIDATE IMPORT INTEGRITY, INTERRUPTION & CHECKPOINT RESUMPTION
  // ============================================================================
  describe('Module 3: Historical Import Integrity, Interruption & Checkpoints', () => {
    it('ADV-HIST-01: Heterogeneous batch import validates records, skips duplicates, and flags errors', async () => {
      const testPhoneA = `+9198851${Math.floor(10000 + Math.random() * 90000)}`;
      const testPhoneB = `+9198852${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhoneA, testPhoneB);

      const batch = [
        { name: 'Valid Lead 1', phone: testPhoneA, message: 'First valid' },
        { name: 'Invalid Lead', message: 'No phone' }, // invalid
        { name: 'Valid Lead 2', phone: testPhoneB, message: 'Second valid' },
        { name: 'Duplicate Phone in Batch', phone: testPhoneA, message: 'Batch duplicate' }, // batch dup
      ];

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/uncf-trust/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ records: batch, dryRun: false }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.totalProvided, 4);
      assert.strictEqual(data.validRecords, 3);
      assert.strictEqual(data.invalidRecords, 1);
      assert.strictEqual(data.duplicatesSkipped, 1);
      assert.strictEqual(data.createdCount, 2);
    });

    it('ADV-HIST-02: Interrupted batch halts at specified index and persists last successful checkpoint', async () => {
      const p1 = `+9198861${Math.floor(10000 + Math.random() * 90000)}`;
      const p2 = `+9198862${Math.floor(10000 + Math.random() * 90000)}`;
      const p3 = `+9198863${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(p1, p2, p3);

      const batch = [
        { name: 'Interruption 0', phone: p1 },
        { name: 'Interruption 1', phone: p2 },
        { name: 'Interruption 2', phone: p3 },
      ];

      // Simulate interruption at index 2 (after processing index 0 and 1)
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ records: batch, dryRun: false, simulateInterruptionAtIndex: 2 }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, false, 'Interrupted batch returns false success');
      assert.strictEqual(data.checkpointCursor, 'index:1', 'Checkpoint must reflect last successful index (1)');
      assert.strictEqual(data.createdCount, 2, 'Only records 0 and 1 were created');

      // Verify that record 2 was NOT created
      const dbLead3 = await prisma.lead.findUnique({ where: { phoneNumber: p3 } });
      assert.strictEqual(dbLead3, null, 'Unprocessed record must not exist in DB');
    });

    it('ADV-HIST-03: Resuming batch from saved checkpoint completes remaining records without duplicates', async () => {
      const p3 = `+9198863${Math.floor(10000 + Math.random() * 90000)}`;
      const p1 = createdLeadPhones[createdLeadPhones.length - 3];
      const p2 = createdLeadPhones[createdLeadPhones.length - 2];
      createdLeadPhones.push(p3);

      const batch = [
        { name: 'Interruption 0', phone: p1 },
        { name: 'Interruption 1', phone: p2 },
        { name: 'Interruption 2', phone: p3 },
      ];

      // Resume from checkpoint 'index:1'
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ records: batch, dryRun: false, checkpoint: 'index:1' }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.createdCount, 1, 'Only remaining record 2 should be created');
      assert.strictEqual(data.checkpointCursor, 'index:2', 'Checkpoint advanced to index:2');

      // Verify record 3 now exists
      const dbLead3 = await prisma.lead.findUnique({ where: { phoneNumber: p3 } });
      assert.ok(dbLead3, 'Record 3 must now exist after resumption');
    });

    it('ADV-HIST-04: Dry-run simulation performs zero database writes and leaves checkpoint unchanged', async () => {
      const dryPhone = `+9198871${Math.floor(10000 + Math.random() * 90000)}`;
      const batch = [{ name: 'Dry Run Lead', phone: dryPhone, service: 'Elder Care' }];

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ records: batch, dryRun: true }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.dryRun, true);
      assert.strictEqual(data.createdCount, 0);

      // Verify zero DB writes
      const dbCheck = await prisma.lead.findUnique({ where: { phoneNumber: dryPhone } });
      assert.strictEqual(dbCheck, null, 'Dry run must not write to database');
    });

    it('ADV-HIST-05: Preserves original historical submission timestamp in structured notes without altering CRM createdAt', async () => {
      const histPhone = `+9198881${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(histPhone);
      const originalTimestamp = '2024-03-15T10:30:00Z';

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/universal-eldercare/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          records: [{ name: 'Historical Timestamp Lead', phone: histPhone, submittedAt: originalTimestamp }],
          dryRun: false,
        }),
      });

      assert.strictEqual(res.status, 200);
      const dbLead = await prisma.lead.findUnique({ where: { phoneNumber: histPhone } });
      assert.ok(dbLead.notes.includes(`[Original Website Submission: ${originalTimestamp}]`));
      
      // Verify createdAt is recent (CRM creation time)
      const createdDate = new Date(dbLead.createdAt);
      assert.ok(Date.now() - createdDate.getTime() < 60000, 'createdAt must represent actual CRM insert time');
    });
  });

  // ============================================================================
  // 4. VALIDATE ACCESS CONTROL, REVERSE PROXY RATE LIMITING & SECRET HYGIENE
  // ============================================================================
  describe('Module 4: Access Control, Reverse Proxy Rate Limiting & Secret Hygiene', () => {
    it('ADV-SEC-01: Anonymous requests to administrative endpoints are rejected with HTTP 401', async () => {
      const endpoints = [
        `${BASE_URL}/api/v1/webhooks/leads/sources/status`,
        `${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/test`,
        `${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`,
      ];

      for (const url of endpoints) {
        const method = url.includes('/status') ? 'GET' : 'POST';
        const res = await fetch(url, { method });
        assert.strictEqual(res.status, 401, `Expected 401 for anonymous access to ${url}`);
      }
    });

    it('ADV-SEC-02: Non-admin AGENT user rejected with HTTP 403 on management endpoints', async () => {
      const endpoints = [
        `${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/test`,
        `${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`,
      ];

      for (const url of endpoints) {
        const res = await fetch(url, { method: 'POST', headers: agentAuthHeaders, body: JSON.stringify({}) });
        assert.strictEqual(res.status, 403, `Expected 403 for AGENT user on ${url}`);
      }
    });

    it('ADV-SEC-03: Super Admin authorized on all management endpoints (HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/status`, {
        method: 'GET',
        headers: authHeaders,
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.totalSources, 7);
    });

    it('ADV-SEC-04: Status endpoint exposes zero secrets, private tokens, or sensitive credentials', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/status`, {
        method: 'GET',
        headers: authHeaders,
      });
      const data = await res.json();
      const stringified = JSON.stringify(data);

      Object.values(SOURCE_SECRETS).forEach((sec) => {
        assert.strictEqual(stringified.includes(sec), false, 'Status response must not expose webhook secrets');
      });
      assert.strictEqual(stringified.includes('password'), false);
      assert.strictEqual(stringified.includes('privateKey'), false);
    });

    it('ADV-SEC-05: Rate limiting is active behind reverse proxy (X-Forwarded-For)', async () => {
      // Rapid flood from reverse-proxy IP (65 requests to test throttler limit of 60/min)
      const proxyIp = '198.51.100.42';
      let throttled = false;

      for (let i = 0; i < 65; i++) {
        const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': proxyIp,
          },
          body: JSON.stringify({}),
        });

        if (res.status === 429) {
          throttled = true;
          break;
        }
      }

      assert.strictEqual(throttled, true, 'Throttler must trigger HTTP 429 after exceeding limit');
    });

    it('ADV-SEC-06: Distinct reverse proxy client IP retains independent rate limit quota', async () => {
      // Different client IP behind reverse proxy should not be blocked
      const freshProxyIp = '198.51.100.99';
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': freshProxyIp,
        },
        body: JSON.stringify({}),
      });

      // Should be 401 (auth failure), NOT 429 (throttled)
      assert.strictEqual(res.status, 401, 'Fresh IP must receive 401 auth challenge, not 429 throttling');
    });
  });
});
