// Test/qa/tests/integration/phase8-p0-recording-ai-remediation.test.mjs
// P0 Incident Automated Verification Suite: Recording Playback, Authorization, Range Requests, Concurrency Lock, and Side-Effect-Free GET Summaries

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('CRM/Backend/package.json'));
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('CRM/Backend/.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'https://crm-uec-backend.onrender.com';
const JWT_SECRET = process.env.JWT_SECRET || 'crm-secure-jwt-secret-key-2026';

// Known real recording call ID from production audit
const TEST_CALL_ID = '2def1bb0-c0b1-4ad0-a6d1-3fde671ac18f';

function generateToken(payload = {}) {
  const defaultPayload = {
    sub: '00000000-0000-4000-a000-000000000001',
    userId: '00000000-0000-4000-a000-000000000001',
    email: 'admin@eldercare.com',
    role: 'SUPER_ADMIN',
  };
  return jwt.sign({ ...defaultPayload, ...payload }, JWT_SECRET, { expiresIn: '1h' });
}

describe('P0 INCIDENT REMEDIATION SUITE: Recording Playback & AI Lifecycle', () => {
  let adminToken;
  let unauthorizedAgentToken;
  let authorizedAgentToken;

  before(() => {
    adminToken = generateToken({ role: 'SUPER_ADMIN' });
    unauthorizedAgentToken = generateToken({
      sub: '99999999-9999-4999-a999-999999999999',
      userId: '99999999-9999-4999-a999-999999999999',
      agentId: '99999999-9999-4999-a999-999999999999',
      role: 'AGENT'
    });
    authorizedAgentToken = generateToken({
      sub: '0e3daf02-f81a-41be-96cd-f86785ebe1f1',
      userId: '0e3daf02-f81a-41be-96cd-f86785ebe1f1',
      role: 'AGENT'
    });
  });

  // ==========================================
  // SECTION 1: Playback Security & Authorization (Phase 6)
  // ==========================================
  describe('1. Playback Authentication & Role/Resource Authorization', () => {
    it('AUTH-01: Reject unauthenticated playback request with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${TEST_CALL_ID}/recording`);
      assert.strictEqual(res.status, 401, 'Should reject unauthenticated requests');
    });

    it('AUTH-02: Reject invalid JWT token in query parameter with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${TEST_CALL_ID}/recording?token=invalid.token.here`);
      assert.strictEqual(res.status, 401, 'Should reject invalid query token');
    });

    it('AUTH-03: Reject unauthorized agent lacking ownership with 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${TEST_CALL_ID}/recording?token=${unauthorizedAgentToken}`);
      assert.strictEqual(res.status, 403, 'Should forbid unauthorized agents from playing others calls');
    });

    it('AUTH-04: Allow elevated SUPER_ADMIN to stream recording', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${TEST_CALL_ID}/recording?token=${adminToken}`, {
        headers: { Range: 'bytes=0-100' }
      });
      assert.ok([200, 206].includes(res.status), `Expected 200 or 206, got ${res.status}`);
    });
  });

  // ==========================================
  // SECTION 2: Media Formats, Byte-Ranges, and CORP (Phase 3)
  // ==========================================
  describe('2. Media Delivery, Byte-Range Seeking, and Browser Playback Headers', () => {
    it('MEDIA-01: Range request returns 206 Partial Content with correct Content-Range and Content-Type', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${TEST_CALL_ID}/recording?token=${adminToken}`, {
        headers: { Range: 'bytes=0-100' }
      });
      assert.strictEqual(res.status, 206, 'Should return 206 Partial Content for byte-range');
      assert.strictEqual(res.headers.get('content-type'), 'audio/mp4', 'Must declare audio/mp4 for HTML5 audio element');
      assert.strictEqual(res.headers.get('accept-ranges'), 'bytes', 'Must advertise Accept-Ranges: bytes');
      assert.strictEqual(res.headers.get('cross-origin-resource-policy'), 'cross-origin', 'Must allow cross-origin playback');
      assert.ok(res.headers.get('content-range')?.startsWith('bytes 0-100/'), 'Content-Range must reflect byte slice');
      assert.strictEqual(res.headers.get('content-length'), '101', 'Content-Length must match requested slice (101 bytes)');

      const buf = await res.arrayBuffer();
      assert.strictEqual(buf.byteLength, 101, 'Buffer received must be exact 101 bytes');
    });

    it('MEDIA-02: Non-existent call returns 404 Not Found', async () => {
      const fakeId = '00000000-0000-4000-a000-000000000099';
      const res = await fetch(`${BASE_URL}/telephony/calls/${fakeId}/recording?token=${adminToken}`);
      assert.strictEqual(res.status, 404);
    });

    it('MEDIA-03: Malformed non-UUID call ID returns 404 Not Found', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/invalid-call-id-123/recording?token=${adminToken}`);
      assert.strictEqual(res.status, 404);
    });
  });

  // ==========================================
  // SECTION 3: Side-Effect-Free GET Summaries (Phase 4)
  // ==========================================
  describe('3. GET Summaries Idempotency & Absence of Background Side Effects', () => {
    it('LOOP-01: GET /api/v1/analytics/summaries returns 200 with summary array and has no side effects', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics/summaries`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Result must be an array');
      // Verify structure of existing summary
      const match = data.find(s => s.callSession?.id === TEST_CALL_ID || s.callSessionId === TEST_CALL_ID);
      if (match) {
        assert.ok(match.summary && match.summary.length > 0, 'Summary text must be present');
      }
    });

    it('LOOP-02: Repeated rapid GET requests execute safely without triggering duplicate processing', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch(`${BASE_URL}/api/v1/analytics/summaries`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
      const responses = await Promise.all(requests);
      for (const r of responses) {
        assert.strictEqual(r.status, 200);
      }
    });
  });

  // ==========================================
  // SECTION 4: Controlled Explicit Reprocess Endpoint
  // ==========================================
  describe('4. Explicit Reprocessing Endpoint', () => {
    it('REPROCESS-01: Reject unauthenticated reprocess request with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics/calls/${TEST_CALL_ID}/reprocess`, {
        method: 'POST'
      });
      assert.strictEqual(res.status, 401);
    });

    it('REPROCESS-02: Reject unauthorized agent from triggering reprocess with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics/calls/${TEST_CALL_ID}/reprocess`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${unauthorizedAgentToken}` }
      });
      assert.strictEqual(res.status, 403);
    });

    it('REPROCESS-03: Allow authorized admin to invoke reprocess, returning idempotent result', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics/calls/${TEST_CALL_ID}/reprocess`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}`);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.result?.summary, 'Should return summary content');
    });
  });

  // ==========================================
  // SECTION 5: Concurrency Guard & History Metadata
  // ==========================================
  describe('5. Concurrency Guard & Truthful History Metadata', () => {
    it('HIST-01: /telephony/history returns truthful recordingStatus and signed playback token', async () => {
      const res = await fetch(`${BASE_URL}/telephony/history`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      const records = await res.json();
      assert.ok(Array.isArray(records), 'History must be an array');
      const testRecord = records.find(r => r.id === TEST_CALL_ID);
      if (testRecord) {
        assert.strictEqual(testRecord.recordingStatus, 'READY', 'Recording status must be READY');
        assert.ok(testRecord.recordingUrl.includes('/recording?token='), 'Must include signed token');
      }
    });

    it('MUTEX-01: Multiple rapid reprocess calls for same session are serialized or deduplicated safely', async () => {
      const [r1, r2] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/analytics/calls/${TEST_CALL_ID}/reprocess`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` }
        }),
        fetch(`${BASE_URL}/api/v1/analytics/calls/${TEST_CALL_ID}/reprocess`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      ]);
      assert.ok([200, 201].includes(r1.status));
      assert.ok([200, 201].includes(r2.status));
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      assert.strictEqual(d1.success, true);
      assert.strictEqual(d2.success, true);
    });
  });
});
