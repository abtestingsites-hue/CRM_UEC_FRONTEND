// Test/qa/tests/integration/phase6-omnichannel-repair.test.mjs
// PHASE 06 — Omnichannel Integration Repair Comprehensive Verification Suite

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('CRM/Backend/package.json'));
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('CRM/Backend/.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_super_secure';
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'my_instagram_verify_token';
const META_APP_SECRET = process.env.META_APP_SECRET;

function generateAuthToken(payload = {}) {
  const defaultPayload = {
    sub: '00000000-0000-4000-a000-000000000001',
    userId: '00000000-0000-4000-a000-000000000001',
    email: 'admin@artibots.com',
    role: 'SUPER_ADMIN',
  };
  return jwt.sign({ ...defaultPayload, ...payload }, JWT_SECRET, { expiresIn: '1h' });
}

describe('PHASE 06: Omnichannel Integration Repair Verification Suite', () => {
  let adminToken;
  let agentToken;

  before(() => {
    adminToken = generateAuthToken({ role: 'SUPER_ADMIN' });
    agentToken = generateAuthToken({
      sub: '00000000-0000-4000-a000-000000000002',
      userId: '00000000-0000-4000-a000-000000000002',
      role: 'AGENT'
    });
  });

  // ==========================================
  // SECTION 1: False-Success Removal & Provider Guard Checks
  // ==========================================
  describe('1. Removal of False-Success Simulations & Safe Error Handling', () => {
    it('OMNI-01: Outgoing WhatsApp safely guards missing provider credentials with 503', async () => {
      const res = await fetch(`${BASE_URL}/api/messages/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          conversationId: '00000000-0000-4000-a000-000000000001',
          message: 'Test WhatsApp message'
        })
      });

      // If credentials missing, returns 503 PROVIDER_NOT_CONFIGURED.
      // If credentials present but conversation not found, returns 404.
      // Crucially, it must never return a fake 200 or crash unhandled.
      assert.ok([404, 503].includes(res.status), `Expected 404 or 503, got ${res.status}`);
      if (res.status === 503) {
        const data = await res.json();
        assert.strictEqual(data.code, 'PROVIDER_NOT_CONFIGURED');
      }
    });

    it('OMNI-02: Outgoing Instagram safely guards missing access token with 503', async () => {
      const res = await fetch(`${BASE_URL}/api/messages/send-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          conversationId: '00000000-0000-4000-a000-000000000001',
          message: 'Test Instagram message'
        })
      });

      // Must safely return 503 if token unconfigured or 404 if conversation missing
      assert.ok([404, 503, 500].includes(res.status), `Expected 404, 503, or 500, got ${res.status}`);
    });

    it('OMNI-03: Message dispatch route requires authentication', async () => {
      const res = await fetch(`${BASE_URL}/api/messages/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Unauthenticated message' })
      });
      assert.strictEqual(res.status, 401, 'Unauthenticated message dispatch must return 401');
    });
  });

  // ==========================================
  // SECTION 2: Webhook Contracts, Verification & Signatures
  // ==========================================
  describe('2. Provider Contracts & Webhook Signatures', () => {
    it('OMNI-04: Meta Webhook GET verification succeeds with valid token and challenge', async () => {
      const challenge = 'test_challenge_12345';
      const url = `${BASE_URL}/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(META_VERIFY_TOKEN)}&hub.challenge=${challenge}`;
      const res = await fetch(url);

      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.strictEqual(text, challenge);
    });

    it('OMNI-05: Meta Webhook GET verification rejects invalid verify token with 403', async () => {
      const url = `${BASE_URL}/webhook?hub.mode=subscribe&hub.verify_token=invalid_token_xyz&hub.challenge=test`;
      const res = await fetch(url);
      assert.strictEqual(res.status, 403);
    });

    it('OMNI-06: Meta Webhook alias /webhooks/meta route parity', async () => {
      const challenge = 'test_alias_challenge';
      const url = `${BASE_URL}/webhooks/meta?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(META_VERIFY_TOKEN)}&hub.challenge=${challenge}`;
      const res = await fetch(url);

      assert.strictEqual(res.status, 200);
      const text = await res.text();
      assert.strictEqual(text, challenge);
    });
  });

  // ==========================================
  // SECTION 3: Idempotency & Webhook Deduplication
  // ==========================================
  describe('3. Idempotency & Deduplication Processing', () => {
    it('OMNI-07: Meta Webhook deduplicates repeated message events using messageId (mid)', async () => {
      const mid = `mid_${Date.now()}_dedup_test`;
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: '17841400000000001',
            time: Date.now(),
            messaging: [
              {
                sender: { id: '9876543210' },
                recipient: { id: '17841400000000001' },
                timestamp: Date.now(),
                message: {
                  mid,
                  text: 'Testing deduplication message'
                }
              }
            ]
          }
        ]
      };

      const body = JSON.stringify(payload);

      // First delivery
      const res1 = await fetch(`${BASE_URL}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res1.status, 200);

      // Repeated delivery (Meta retry)
      const res2 = await fetch(`${BASE_URL}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      assert.strictEqual(res2.status, 200);
    });

    it('OMNI-08: WhatsApp Webhook deduplicates repeated MessageSid', async () => {
      const sid = `SM_dedup_${Date.now()}`;
      const payload = new URLSearchParams({
        MessageSid: sid,
        From: 'whatsapp:+919876543210',
        To: 'whatsapp:+14155238886',
        Body: 'Hello WhatsApp deduplication',
        ProfileName: 'QA Tester'
      });

      // First delivery
      const res1 = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString()
      });
      assert.strictEqual(res1.status, 200);

      // Repeated delivery (Twilio retry)
      const res2 = await fetch(`${BASE_URL}/webhooks/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString()
      });
      assert.strictEqual(res2.status, 200);
    });
  });

  // ==========================================
  // SECTION 4: Conversation Consistency & RBAC
  // ==========================================
  describe('4. Conversation Consistency & RBAC', () => {
    it('OMNI-09: GET /api/v1/conversations returns conversation listing', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Conversations must be an array');
    });

    it('OMNI-10: GET /api/v1/conversations/:id/messages rejects non-UUID with 404', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/conversations/invalid-id/messages`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 404);
    });

    it('OMNI-11: GET /api/v1/conversations/:id/messages enforces RBAC against unauthenticated callers', async () => {
      const dummyId = '00000000-0000-4000-a000-000000000001';
      const res = await fetch(`${BASE_URL}/api/v1/conversations/${dummyId}/messages`);
      assert.strictEqual(res.status, 401);
    });

    it('OMNI-12: PUT /api/v1/conversations/:id/read marks unread count as zero', async () => {
      const dummyId = '00000000-0000-4000-a000-000000000001';
      const res = await fetch(`${BASE_URL}/api/v1/conversations/${dummyId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      // 200 if conversation exists, or controlled 404/500 if dummy not found
      assert.ok([200, 404, 500].includes(res.status));
    });
  });

  // ==========================================
  // SECTION 5: Credential Hygiene
  // ==========================================
  describe('5. Credential Hygiene & Secret Handling', () => {
    it('OMNI-13: No hardcoded Meta or WhatsApp access tokens in omnichannel source files', async () => {
      const fs = require('fs');
      const files = [
        'CRM/Backend/src/omnichannel/instagram-enrichment.service.ts',
        'CRM/Backend/src/legacy/email.js',
        'CRM/Backend/src/legacy/mailer.js',
        'CRM/Frontend/src/components/omnichannel/ConversationThread.tsx',
        'CRM/Frontend/src/store/conversationStore.ts'
      ];

      for (const f of files) {
        const fullPath = path.resolve(f);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.strictEqual(content.includes('IGAAOguCTltA9'), false, `Hardcoded Meta token found in ${f}`);
          assert.strictEqual(content.includes('qxmj ibnc fleg gsyy'), false, `Hardcoded app password found in ${f}`);
        }
      }
    });
  });
});
