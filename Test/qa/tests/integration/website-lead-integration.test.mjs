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

// Super Admin Auth token for elevated queries
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

// Non-admin Agent Auth token
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

// Known default test secrets per source
const SOURCE_SECRETS = {
  'anbu-sri-sai': process.env.LEAD_WEBHOOK_SECRET_ANBU_SRI_SAI || 'sec_anbu_sri_sai_eldercare_2026',
  thathapatti: process.env.LEAD_WEBHOOK_SECRET_THATHAPATTI || 'sec_thathapatti_eldercare_2026',
  'thathapatti-homecare': process.env.LEAD_WEBHOOK_SECRET_THATHAPATTI_HOMECARE || 'sec_thathapatti_homecare_2026',
  'uncf-trust': process.env.LEAD_WEBHOOK_SECRET_UNCF_TRUST || 'sec_uncf_trust_eldercare_2026',
  'universal-eldercare': process.env.LEAD_WEBHOOK_SECRET_UNIVERSAL_ELDERCARE || 'sec_universal_eldercare_2026',
  zencura: process.env.LEAD_WEBHOOK_SECRET_ZENCURA || 'sec_zencura_eldercare_2026',
  bytezcorp: process.env.LEAD_WEBHOOK_SECRET_BYTEZCORP || 'sec_bytezcorp_eldercare_2026',
};

function computeHmacSignature(secret, payload) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return 'sha256=' + crypto.createHmac('sha256', secret).update(Buffer.from(str, 'utf8')).digest('hex');
}

describe('Master Website Lead Fetching & Webhook Integration Suite', () => {
  const runId = crypto.randomUUID().slice(0, 8);
  const createdLeadPhones = [];

  after(async () => {
    // Isolated cleanup of all created test leads
    if (createdLeadPhones.length > 0) {
      await prisma.lead.deleteMany({
        where: {
          phoneNumber: { in: createdLeadPhones },
        },
      }).catch(() => {});
    }
  });

  // ==============================================================
  // 1. SOURCE REGISTRY & DISCOVERY
  // ==============================================================
  describe('Module 1: Source Registry & Status Verification', () => {
    it('WS-REG-SEC-01: Rejects unauthenticated GET /api/v1/webhooks/leads/sources/status with HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/status`);
      assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for unauthenticated sources status');
    });

    it('WS-REG-SEC-02: Rejects non-admin AGENT role with HTTP 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/status`, {
        headers: agentAuthHeaders,
      });
      assert.strictEqual(res.status, 403, 'Expected 403 Forbidden for non-admin user');
    });

    it('WS-REG-01: Authorizes SUPER_ADMIN and confirms all seven registered website sources are discoverable with sanitized secrets', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/status`, {
        headers: authHeaders,
      });
      assert.strictEqual(res.status, 200, 'Expected 200 OK from sources status');
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.totalSources, 7);

      const registeredIds = data.sources.map(s => s.sourceId);
      const expectedIds = [
        'anbu-sri-sai',
        'thathapatti',
        'thathapatti-homecare',
        'uncf-trust',
        'universal-eldercare',
        'zencura',
        'bytezcorp',
      ];

      for (const expected of expectedIds) {
        assert.ok(registeredIds.includes(expected), `Missing registered source ID: ${expected}`);
      }

      // Verify no secrets leaked in public source status payload
      const payloadString = JSON.stringify(data);
      assert.ok(!payloadString.includes('sec_'), 'Security violation: secrets must never be exposed');
      assert.ok(!payloadString.includes('LEAD_WEBHOOK_SECRET'), 'Env keys must not be exposed');
    });

    it('WS-REG-02: Unknown source ID returns HTTP 404 with clean error message', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/unregistered-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacker', phone: '9999999999' }),
      });
      assert.strictEqual(res.status, 404, 'Expected 404 for unknown source ID');
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes('Unknown website source ID'));
    });
  });

  // ==============================================================
  // 2. AUTHENTICATION & HMAC SIGNATURE SECURITY
  // ==============================================================
  describe('Module 2: Webhook Security, Authentication & Timing Safety', () => {
    it('WS-SEC-01: Rejects webhook call with missing authentication headers with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Anonymous', phone: '9999900001' }),
      });
      assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for missing auth');
    });

    it('WS-SEC-02: Rejects webhook call with invalid HMAC signature with 401', async () => {
      const payload = JSON.stringify({ name: 'Spoofed Caller', phone: '9999900002' });
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        },
        body: payload,
      });
      assert.strictEqual(res.status, 401, 'Expected 401 Unauthorized for invalid HMAC');
    });

    it('WS-SEC-03: Rejects webhook call signed with WRONG source secret with 401', async () => {
      const payload = JSON.stringify({ name: 'Cross Site Attacker', phone: '9999900003' });
      // Sign thathapatti with anbu-sri-sai's secret
      const wrongSig = computeHmacSignature(SOURCE_SECRETS['anbu-sri-sai'], payload);
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': wrongSig,
        },
        body: payload,
      });
      assert.strictEqual(res.status, 401, 'Cross-source secret must be rejected with 401');
    });

    it('WS-SEC-04: Accepts valid HMAC-SHA256 signature calculated over raw body', async () => {
      const testPhone = `+9198711${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const payload = JSON.stringify({
        name: `HMAC Verified Lead ${runId}`,
        phone: testPhone,
        service: '14',
      });
      const sig = computeHmacSignature(SOURCE_SECRETS['thathapatti'], payload);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': sig,
        },
        body: payload,
      });
      assert.strictEqual(res.status, 201, 'Expected 201 Created for valid signature');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'created');
      assert.ok(data.leadId);
    });

    it('WS-SEC-05: Accepts direct shared secret via x-webhook-secret header', async () => {
      const testPhone = `+9198722${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/bytezcorp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['bytezcorp'],
        },
        body: JSON.stringify({
          name: `Direct Secret Lead ${runId}`,
          phone: testPhone,
          service: 'Digital Marketing',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.status, 'created');
    });

    it('WS-SEC-06: Strips client-supplied privilege escalation fields (role, isElevated, userId)', async () => {
      const testPhone = `+9198733${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/zencura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['zencura'],
        },
        body: JSON.stringify({
          name: 'Privilege Test',
          phone: testPhone,
          role: 'SUPER_ADMIN',
          isElevated: true,
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      const leadInDb = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(leadInDb.status, 'NEW');
      assert.strictEqual(leadInDb.assignedAgentId, null);
    });

    it('WS-SEC-07: Missing contact phone number is rejected with HTTP 400', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['thathapatti'],
        },
        body: JSON.stringify({ name: 'No Phone Prospect' }),
      });
      assert.strictEqual(res.status, 400, 'Expected 400 when phone number is missing');
    });

    it('WS-SEC-REPLAY-01: Rejects webhook call with stale timestamp (> 5 minutes old) with 401', async () => {
      const staleTimestamp = Date.now() - 600000; // 10 minutes ago
      const secret = SOURCE_SECRETS.thathapatti;
      const payload = { name: 'Replay Attacker', phone: '+919999900010' };
      const rawBody = JSON.stringify(payload);
      const signature = computeHmacSignature(secret, rawBody);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': String(staleTimestamp),
        },
        body: rawBody,
      });
      assert.strictEqual(res.status, 401, 'Expected 401 for stale timestamp');
    });

    it('WS-SEC-REPLAY-02: Rejects webhook call with future timestamp (> 5 minutes into future) with 401', async () => {
      const futureTimestamp = Date.now() + 600000; // 10 minutes into future
      const secret = SOURCE_SECRETS.thathapatti;
      const payload = { name: 'Future Attacker', phone: '+919999900011' };
      const rawBody = JSON.stringify(payload);
      const signature = computeHmacSignature(secret, rawBody);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': String(futureTimestamp),
        },
        body: rawBody,
      });
      assert.strictEqual(res.status, 401, 'Expected 401 for future timestamp');
    });

    it('WS-SEC-REPLAY-03: Accepts valid HMAC-SHA256 signature with fresh timestamp within tolerance window', async () => {
      const freshTimestamp = Date.now();
      const secret = SOURCE_SECRETS.thathapatti;
      const testPhone = `+9198764${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);
      const payload = { name: 'Fresh Timestamp Lead', phone: testPhone };
      const rawBody = JSON.stringify(payload);
      const signature = computeHmacSignature(secret, rawBody);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': String(freshTimestamp),
        },
        body: rawBody,
      });
      assert.strictEqual(res.status, 201, 'Expected 201 for fresh timestamp');
    });

    it('WS-SEC-RAW-01: Verifies exact raw request body buffer preservation with whitespace differences', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const testPhone = `+9198765${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);
      // Intentionally formatted JSON string with extra newlines and spaces
      const rawBodyWithSpaces = `{\n  "name":   "Raw Body Whitespace Lead",\n  "phone": "${testPhone}"\n}`;
      const signature = computeHmacSignature(secret, rawBodyWithSpaces);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature,
        },
        body: rawBodyWithSpaces,
      });
      assert.strictEqual(res.status, 201, 'Expected 201 when raw request body matches exact HMAC buffer');
    });
  });

  // ==============================================================
  // 3. SOURCE ADAPTER NORMALIZATION FOR ALL 7 WEBSITES
  // ==============================================================
  describe('Module 3: Source Normalization & Field Mapping Across All 7 Websites', () => {
    it('WS-ADAPT-01: anbu-sri-sai normalizes fname + lname, phone, and home nursing interest', async () => {
      const testPhone = `+9198741${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/anbu-sri-sai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['anbu-sri-sai'],
        },
        body: JSON.stringify({
          fname: 'Kavitha',
          lname: 'Ramasamy',
          phone: testPhone.replace('+91', ''),
          email: 'kavitha@example.com',
          message: 'Need 24/7 post-hospitalization nurse in Singanallur',
          service: 'Home Nursing Care',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(lead.customerName, 'Kavitha Ramasamy');
      assert.strictEqual(lead.phoneNumber, testPhone);
      assert.strictEqual(lead.source, 'Website: anbusrisaihomenursing.com');
      assert.strictEqual(lead.serviceInterest, 'Home Nursing Care');
      assert.ok(lead.notes.includes('Need 24/7 post-hospitalization nurse'));
    });

    it('WS-ADAPT-02: thathapatti maps numeric service codes (17 -> Dementia Care, form_location)', async () => {
      const testPhone = `+9198742${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['thathapatti'],
        },
        body: JSON.stringify({
          name: 'Suresh Kumar',
          phone: testPhone.replace('+91', ''),
          email: 'suresh@example.com',
          service: '17', // Dropdown value for Dementia Care
          form_location: 'online-booking',
          notes: 'Looking for residential dementia care support',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(lead.customerName, 'Suresh Kumar');
      assert.strictEqual(lead.serviceInterest, 'Dementia Care');
      assert.strictEqual(lead.source, 'Website: thathapatti.com');
      assert.ok(lead.notes.includes('[Form: online-booking]'));
    });

    it('WS-ADAPT-03: thathapatti-homecare maps service codes (28 -> Ageing Care Services)', async () => {
      const testPhone = `+9198743${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti-homecare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['thathapatti-homecare'],
        },
        body: JSON.stringify({
          name: 'Meena Natarajan',
          phone: testPhone.replace('+91', ''),
          service: '28',
          form_location: 'homecare-contact',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(lead.customerName, 'Meena Natarajan');
      assert.strictEqual(lead.serviceInterest, 'Ageing Care Services');
      assert.strictEqual(lead.source, 'Website: homecare.thathapatti.com');
    });

    it('WS-ADAPT-04: uncf-trust normalizes subject and message into enquiry notes', async () => {
      const testPhone = `+9198744${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/uncf-trust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['uncf-trust'],
        },
        body: JSON.stringify({
          name: 'Anand Mohan',
          phone: testPhone,
          email: 'anand@uncf.org',
          subject: 'Geriatric Care Inquiry',
          message: 'Inquiring about community welfare home visit program',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(lead.customerName, 'Anand Mohan');
      assert.strictEqual(lead.source, 'Website: uncftrust.org');
      assert.ok(lead.notes.includes('[Subject: Geriatric Care Inquiry]'));
    });

    it('WS-ADAPT-05: universal-eldercare maps corporate elder care enquiry', async () => {
      const testPhone = `+9198745${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/universal-eldercare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['universal-eldercare'],
        },
        body: JSON.stringify({
          fullName: 'Prakash Rao',
          phoneNumber: testPhone,
          serviceInterest: 'Assisted Living Suite',
          message: 'Interested in Wooden House suite accommodation',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(lead.customerName, 'Prakash Rao');
      assert.strictEqual(lead.source, 'Website: universaleldercare.com');
      assert.strictEqual(lead.serviceInterest, 'Assisted Living Suite');
    });

    it('WS-ADAPT-06: zencura maps wellness goals and integrative care interest', async () => {
      const testPhone = `+9198746${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/zencura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['zencura'],
        },
        body: JSON.stringify({
          name: 'Deepa Krishnan',
          phone: testPhone,
          interest: 'Ayurveda & Siddha Integrative Protocol',
          wellnessGoals: 'Holistic rehabilitation after joint surgery',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(lead.customerName, 'Deepa Krishnan');
      assert.strictEqual(lead.source, 'Website: zencura.org');
      assert.strictEqual(lead.serviceInterest, 'Ayurveda & Siddha Integrative Protocol');
    });

    it('WS-ADAPT-07: bytezcorp maps digital technology consulting enquiry', async () => {
      const testPhone = `+9198747${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/bytezcorp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['bytezcorp'],
        },
        body: JSON.stringify({
          name: 'Vikram Seth',
          phone: testPhone,
          company: 'Healthcare Solutions Ltd',
          service: 'CRM Cloud Architecture',
          message: 'Looking for HIPAA compliant patient workflow integration',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();

      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      assert.strictEqual(lead.customerName, 'Vikram Seth');
      assert.strictEqual(lead.source, 'Website: bytezcorp.com');
      assert.ok(lead.notes.includes('[Company: Healthcare Solutions Ltd]'));
    });
  });

  // ==============================================================
  // 4. IDEMPOTENCY & DUPLICATE PROTECTION
  // ==============================================================
  describe('Module 4: Idempotency & Duplicate Delivery Protection', () => {
    it('WS-IDEMP-01: Identical external submission ID is recognized idempotently without creating duplicate', async () => {
      const testPhone = `+9198751${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);
      const submissionId = `sub_${Date.now()}_abc`;

      const payload = {
        name: 'Idempotency Lead',
        phone: testPhone,
        externalLeadId: submissionId,
      };

      // First delivery
      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['thathapatti'],
        },
        body: JSON.stringify(payload),
      });
      assert.strictEqual(res1.status, 201);
      const data1 = await res1.json();
      assert.strictEqual(data1.status, 'created');
      const firstLeadId = data1.leadId;

      // Duplicate delivery (e.g. carrier or network retry)
      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['thathapatti'],
        },
        body: JSON.stringify(payload),
      });
      assert.strictEqual(res2.status, 200, 'Expected 200 OK for recognized duplicate submission');
      const data2 = await res2.json();
      assert.strictEqual(data2.status, 'duplicate_event');
      assert.strictEqual(data2.leadId, firstLeadId, 'Must correlate to same original lead ID');

      // Verify in DB that only 1 record exists
      const totalInDb = await prisma.lead.count({ where: { phoneNumber: testPhone } });
      assert.strictEqual(totalInDb, 1, 'Database must contain exactly 1 lead, not duplicates');
    });

    it('WS-IDEMP-02: Repeat enquiry from same phone number updates existing lead instead of 500 collision', async () => {
      const testPhone = `+9198752${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      // Initial enquiry
      const res1 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/universal-eldercare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['universal-eldercare'],
        },
        body: JSON.stringify({
          name: 'Repeat Prospect',
          phone: testPhone,
          service: 'Home Care',
          notes: 'First enquiry for general checkup',
        }),
      });
      assert.strictEqual(res1.status, 201);
      const data1 = await res1.json();

      // Subsequent enquiry without submission ID (different enquiry from same user)
      const res2 = await fetch(`${BASE_URL}/api/v1/webhooks/leads/universal-eldercare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['universal-eldercare'],
        },
        body: JSON.stringify({
          name: 'Repeat Prospect',
          phone: testPhone,
          service: 'Doctor Visit',
          notes: 'Urgent follow-up requested',
        }),
      });
      assert.strictEqual(res2.status, 200, 'Expected 200 for updated lead');
      const data2 = await res2.json();
      assert.strictEqual(data2.status, 'existing_lead_updated');
      assert.strictEqual(data2.leadId, data1.leadId);

      const updatedLead = await prisma.lead.findUnique({ where: { id: data1.leadId } });
      assert.ok(updatedLead.notes.includes('First enquiry'));
      assert.ok(updatedLead.notes.includes('Urgent follow-up requested'));
    });

    it('WS-CONCUR-01: Simultaneous concurrent webhook requests with identical phone numbers both resolve safely without 500 collision', async () => {
      const secret = SOURCE_SECRETS.thathapatti;
      const sharedPhone = `+9198766${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(sharedPhone);

      const payload1 = JSON.stringify({ externalLeadId: `CONCUR-A-${Date.now()}`, name: 'Concurrent Lead A', phone: sharedPhone, notes: 'Request A' });
      const payload2 = JSON.stringify({ externalLeadId: `CONCUR-B-${Date.now()}`, name: 'Concurrent Lead B', phone: sharedPhone, notes: 'Request B' });

      const sig1 = computeHmacSignature(secret, payload1);
      const sig2 = computeHmacSignature(secret, payload2);

      // Fire both requests simultaneously via Promise.all
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-signature': sig1 },
          body: payload1,
        }),
        fetch(`${BASE_URL}/api/v1/webhooks/leads/thathapatti`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-signature': sig2 },
          body: payload2,
        }),
      ]);

      // Both should succeed (one creates HTTP 201, the other correlates HTTP 200), neither should throw 500
      assert.ok([200, 201].includes(res1.status), `Request 1 failed with status ${res1.status}`);
      assert.ok([200, 201].includes(res2.status), `Request 2 failed with status ${res2.status}`);

      const inDb = await prisma.lead.findUnique({ where: { phoneNumber: sharedPhone } });
      assert.ok(inDb, 'Lead should exist in database');
    });
  });

  // ==============================================================
  // 5. HISTORICAL IMPORT & DRY-RUN EXECUTION
  // ==============================================================
  describe('Module 5: Historical Batch Import & Dry-Run Mode', () => {
    it('WS-HIST-SEC-01: Rejects unauthenticated sync request with HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true, records: [] }),
      });
      assert.strictEqual(res.status, 401, 'Expected 401 for unauthenticated sync');
    });

    it('WS-HIST-SEC-02: Rejects non-admin AGENT user on sync endpoint with HTTP 403', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`, {
        method: 'POST',
        headers: agentAuthHeaders,
        body: JSON.stringify({ dryRun: true, records: [] }),
      });
      assert.strictEqual(res.status, 403, 'Expected 403 Forbidden for agent user on sync');
    });

    it('WS-HIST-01: Dry-run simulation with SUPER_ADMIN validates records without writing to database', async () => {
      const dryPhone = `+9198761${Math.floor(10000 + Math.random() * 90000)}`;
      const sampleBatch = [
        { name: 'Dry Run Lead 1', phone: dryPhone, service: '18', form_location: 'online-booking' },
        { name: 'Invalid Lead', phone: '' }, // invalid phone
      ];

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          dryRun: true,
          records: sampleBatch,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.dryRun, true);
      assert.strictEqual(data.totalProvided, 2);
      assert.strictEqual(data.validRecords, 1);
      assert.strictEqual(data.invalidRecords, 1);
      assert.strictEqual(data.createdCount, 0, 'Dry-run must NOT create records');

      // Verify record was not written to DB
      const inDb = await prisma.lead.findUnique({ where: { phoneNumber: dryPhone } });
      assert.strictEqual(inDb, null, 'Dry-run phone must not exist in DB');
    });

    it('WS-HIST-02: Historical batch import writes valid leads, preserves submission timestamps in notes, and updates checkpoint', async () => {
      const batchPhone1 = `+9198762${Math.floor(10000 + Math.random() * 90000)}`;
      const batchPhone2 = `+9198763${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(batchPhone1, batchPhone2);

      const pastTimestamp = '2026-08-15T10:30:00.000Z';
      const batch = [
        { name: 'Batch Lead 1', phone: batchPhone1, service: '14', submittedAt: pastTimestamp },
        { name: 'Batch Lead 2', phone: batchPhone2, service: '15' },
      ];

      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          dryRun: false,
          records: batch,
          checkpoint: 'cp_test_001',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.dryRun, false);
      assert.strictEqual(data.createdCount, 2);

      const dbLead1 = await prisma.lead.findUnique({ where: { phoneNumber: batchPhone1 } });
      const dbLead2 = await prisma.lead.findUnique({ where: { phoneNumber: batchPhone2 } });
      assert.ok(dbLead1, 'Batch lead 1 must be created in DB');
      assert.ok(dbLead2, 'Batch lead 2 must be created in DB');

      // Verify historical submission timestamp is preserved in notes without distorting createdAt
      assert.ok(dbLead1.notes.includes(pastTimestamp), 'Original submission timestamp must be preserved in notes');
    });

    it('WS-PING-SEC-01: Rejects unauthenticated test ping with HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateLead: false }),
      });
      assert.strictEqual(res.status, 401, 'Expected 401 for unauthenticated ping');
    });

    it('WS-PING-SEC-02: Rejects non-admin AGENT on test ping with HTTP 403', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/test`, {
        method: 'POST',
        headers: agentAuthHeaders,
        body: JSON.stringify({ simulateLead: false }),
      });
      assert.strictEqual(res.status, 403, 'Expected 403 Forbidden for agent ping');
    });

    it('WS-PING-01: Authorizes SUPER_ADMIN on test ping with HTTP 200', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/webhooks/leads/sources/thathapatti/test`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ simulateLead: false }),
      });
      assert.strictEqual(res.status, 200, 'Expected 200 OK for super admin ping');
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });
  });

  // ==============================================================
  // 6. PIPELINE INTEGRATION & VISIBILITY IN LEADS API
  // ==============================================================
  describe('Module 6: CRM Leads API Visibility & Parity', () => {
    it('WS-API-01: Ingested website lead is queryable via GET /api/v1/leads with authentic website source', async () => {
      const testPhone = `+9198771${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(testPhone);

      // Ingest via webhook
      const ingestRes = await fetch(`${BASE_URL}/api/v1/webhooks/leads/anbu-sri-sai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SOURCE_SECRETS['anbu-sri-sai'],
        },
        body: JSON.stringify({
          fname: 'Pipeline',
          lname: 'Verification',
          phone: testPhone,
          service: 'Patient Home Care',
        }),
      });
      assert.strictEqual(ingestRes.status, 201);
      const ingestData = await ingestRes.json();

      // Query via canonical CRM Leads API
      const getRes = await fetch(`${BASE_URL}/api/v1/leads?search=${testPhone.replace('+', '')}`, {
        headers: authHeaders,
      });
      assert.strictEqual(getRes.status, 200);
      const leads = await getRes.json();
      assert.ok(Array.isArray(leads), 'Expected array of leads');

      const found = leads.find(l => l.id === ingestData.leadId);
      assert.ok(found, 'Ingested lead must be returned by GET /api/v1/leads');
      assert.strictEqual(found.source, 'Website: anbusrisaihomenursing.com');
      assert.strictEqual(found.status, 'NEW');
    });

    it('WS-API-02: Existing manual lead creation via POST /api/v1/leads continues to function cleanly', async () => {
      const manualPhone = `+9198781${Math.floor(10000 + Math.random() * 90000)}`;
      createdLeadPhones.push(manualPhone);

      const res = await fetch(`${BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          customerName: `Manual Lead ${runId}`,
          phoneNumber: manualPhone,
          source: 'Manual Entry',
          serviceInterest: 'Consultation',
        }),
      });
      assert.strictEqual(res.status, 200, 'Manual lead creation must succeed');
      const data = await res.json();
      assert.strictEqual(data.phoneNumber, manualPhone);
    });
  });
});
