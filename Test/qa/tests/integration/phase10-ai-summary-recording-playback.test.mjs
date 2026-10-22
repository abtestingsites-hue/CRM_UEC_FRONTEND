// Test/qa/tests/integration/phase10-ai-summary-recording-playback.test.mjs
// P0 Bug Remediation Test Suite: AI Summary Recording Playback Lifecycle

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('CRM/Backend/package.json'));
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('CRM/Backend/.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'crm-secure-jwt-secret-key-2026';
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

describe('P0 AI SUMMARY RECORDING PLAYBACK VERIFICATION SUITE', () => {
  let adminToken;
  let unauthorizedAgentToken;
  let expiredToken;
  let testSessionCallId = TEST_CALL_ID;

  before(() => {
    adminToken = generateToken({ role: 'SUPER_ADMIN' });
    unauthorizedAgentToken = generateToken({
      sub: '99999999-9999-4999-a999-999999999999',
      userId: '99999999-9999-4999-a999-999999999999',
      role: 'AGENT',
    });
    expiredToken = jwt.sign(
      {
        sub: '00000000-0000-4000-a000-000000000001',
        userId: '00000000-0000-4000-a000-000000000001',
        role: 'SUPER_ADMIN',
      },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
  });

  // ==========================================
  // SECTION 1: AI Summaries API Contract
  // ==========================================
  describe('1. AI Summary API Payload and Recording Metadata', () => {
    it('AISUM-01: GET /api/v1/analytics/summaries returns 200 with enriched callId and recording fields', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/analytics/summaries`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200, 'Must return 200 OK');
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Response must be an array of summaries');
      assert.ok(data.length > 0, 'Database must contain summaries');

      const first = data[0];
      assert.ok(first.id, 'Must contain summary id');
      assert.ok(first.callId || first.callSessionId, 'Must contain callId or callSessionId');
      assert.ok(first.recordingStatus, 'Must contain recordingStatus');
      assert.ok(first.callSession, 'Must contain callSession object');
      assert.ok(first.callSession.id, 'callSession must have id');
      assert.ok('recordingUrl' in first, 'Must include recordingUrl key');
      assert.ok('recordingDuration' in first, 'Must include recordingDuration key');

      // Check if ready items have properly formed URLs
      const readyItem = data.find((x) => x.recordingStatus === 'READY');
      if (readyItem) {
        testSessionCallId = readyItem.callId || readyItem.callSessionId;
        assert.ok(readyItem.recordingUrl, 'READY items must contain a valid recordingUrl');
        assert.ok(readyItem.recordingUrl.includes('/telephony/calls/'), 'recordingUrl must point to telephony streaming endpoint');
        assert.ok(readyItem.recordingUrl.includes('token='), 'recordingUrl must include signed playback token');
      }
    });

    it('AISUM-02: GET /api/v1/analytics/summaries is strictly side-effect free', async () => {
      const initialRes = await fetch(`${BASE_URL}/api/v1/analytics/summaries`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const initialData = await initialRes.json();
      const initialCount = initialData.length;

      // Make 3 rapid GET calls
      await Promise.all([
        fetch(`${BASE_URL}/api/v1/analytics/summaries`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${BASE_URL}/api/v1/analytics/summaries`, { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch(`${BASE_URL}/api/v1/analytics/summaries`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      ]);

      const afterRes = await fetch(`${BASE_URL}/api/v1/analytics/summaries`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const afterData = await afterRes.json();
      assert.strictEqual(afterData.length, initialCount, 'GET requests must not create duplicate records');
    });
  });

  // ==========================================
  // SECTION 2: Dedicated Playback URL Refresh Endpoint
  // ==========================================
  describe('2. Secure Playback URL Refresh Endpoint (/telephony/calls/:callId/playback-url)', () => {
    it('REFRESH-01: Authorized Admin can fetch fresh playback URL and signed token', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/playback-url`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200, 'Must return 200 OK');
      const data = await res.json();
      assert.strictEqual(data.success, true, 'success must be true');
      assert.strictEqual(data.callId, testSessionCallId, 'callId must match');
      assert.strictEqual(data.recordingStatus, 'READY', 'recordingStatus must be READY');
      assert.ok(data.recordingUrl, 'Must return fresh recordingUrl');
      assert.ok(data.recordingUrl.includes('?token='), 'URL must contain signed JWT token');
      assert.strictEqual(data.expiresIn, 7200, 'Token lifespan must be 7200 seconds (2h)');
    });

    it('REFRESH-02: Reject unauthenticated refresh request with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/playback-url`);
      assert.strictEqual(res.status, 401, 'Must reject unauthenticated requests');
    });

    it('REFRESH-03: Reject unauthorized agent lacking ownership with 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/playback-url`, {
        headers: { Authorization: `Bearer ${unauthorizedAgentToken}` },
      });
      assert.strictEqual(res.status, 403, 'Must forbid unauthorized agents from requesting playback URLs');
    });

    it('REFRESH-04: Non-existent call ID returns 404', async () => {
      const fakeCallId = '00000000-0000-4000-a000-000000000099';
      const res = await fetch(`${BASE_URL}/telephony/calls/${fakeCallId}/playback-url`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 404, 'Must return 404 for non-existent calls');
    });

    it('REFRESH-05: Malformed non-UUID call ID returns 404', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/invalid-uuid/playback-url`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 404, 'Must return 404 for malformed IDs');
    });
  });

  // ==========================================
  // SECTION 3: Audio Streaming and Range Handling
  // ==========================================
  describe('3. Audio Streaming, Range Requests, and Security Guards', () => {
    it('STREAM-01: Valid byte-range request returns 206 Partial Content with audio/mp4', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/recording?token=${adminToken}`, {
        headers: { Range: 'bytes=0-1023' },
      });
      assert.strictEqual(res.status, 206, 'Must return 206 Partial Content');
      assert.strictEqual(res.headers.get('content-type'), 'audio/mp4', 'Must return audio/mp4 Content-Type');
      assert.strictEqual(res.headers.get('accept-ranges'), 'bytes', 'Must return Accept-Ranges: bytes');
      assert.ok(res.headers.get('content-range')?.startsWith('bytes 0-1023/'), 'Content-Range must be correct');
      assert.strictEqual(res.headers.get('content-length'), '1024', 'Content-Length must be 1024');

      const buf = await res.arrayBuffer();
      assert.strictEqual(buf.byteLength, 1024, 'Received buffer must be exactly 1024 bytes');
    });

    it('STREAM-02: HEAD request returns 200/206 with correct headers and zero body', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/recording?token=${adminToken}`, {
        method: 'HEAD',
        headers: { Range: 'bytes=0-100' },
      });
      assert.ok([200, 206].includes(res.status), 'HEAD request must succeed');
      assert.strictEqual(res.headers.get('accept-ranges'), 'bytes');
      const text = await res.text();
      assert.strictEqual(text, '', 'HEAD request must have empty body');
    });

    it('STREAM-03: Invalid byte-range request returns 416 Range Not Satisfiable', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/recording?token=${adminToken}`, {
        headers: { Range: 'bytes=99999999-99999999' },
      });
      assert.strictEqual(res.status, 416, 'Must return 416 for unsatisfiable range');
      assert.ok(res.headers.get('content-range')?.startsWith('bytes */'), 'Must return valid 416 Content-Range header');
    });

    it('STREAM-04: Unauthenticated playback request returns 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/recording`);
      assert.strictEqual(res.status, 401, 'Must reject unauthenticated stream request');
    });

    it('STREAM-05: Expired token returns 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/recording?token=${expiredToken}`);
      assert.strictEqual(res.status, 401, 'Must reject expired token');
    });

    it('STREAM-06: Cross-call token spoofing is rejected with 403 Forbidden', async () => {
      const crossCallToken = jwt.sign(
        {
          sub: '00000000-0000-4000-a000-000000000001',
          userId: '00000000-0000-4000-a000-000000000001',
          role: 'AGENT',
          callId: '00000000-0000-0000-0000-000000000000',
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await fetch(`${BASE_URL}/telephony/calls/${testSessionCallId}/recording?token=${crossCallToken}`);
      assert.strictEqual(res.status, 403, 'Must reject token belonging to a different call ID');
    });
  });
});
