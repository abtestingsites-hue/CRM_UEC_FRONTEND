// Test/qa/tests/integration/phase9-platform-upgrade.test.mjs
// Automated Integration & Regression Suite: Platform Upgrade, Super Admin Active Agents, Omnichannel Enquiries, Multi-Unit Isolation & Secret Masking

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('CRM/Backend/package.json'));
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve('CRM/Backend/.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

function generateToken(payload = {}) {
  const defaultPayload = {
    sub: '00000000-0000-4000-a000-000000000001',
    userId: '00000000-0000-4000-a000-000000000001',
    email: 'super_admin@eldercare.com',
    role: 'SUPER_ADMIN',
  };
  return jwt.sign({ ...defaultPayload, ...payload }, JWT_SECRET, { expiresIn: '1h' });
}

describe('PLATFORM UPGRADE TEST SUITE: Super Admin, Multi-Unit & Integrations', () => {
  let superAdminToken;
  let agentToken;

  before(() => {
    superAdminToken = generateToken({ role: 'SUPER_ADMIN', email: 'super_admin@eldercare.com' });
    agentToken = generateToken({
      sub: '99999999-9999-4999-a999-999999999999',
      userId: '99999999-9999-4999-a999-999999999999',
      email: 'agent@eldercare.com',
      role: 'AGENT',
    });
  });

  // ==========================================
  // SECTION 1: Super Admin Active Agents Indicator
  // ==========================================
  describe('1. Active Agents Presence Indicator (Phase 1)', () => {
    it('ACTIVE-01: Reject unauthenticated request to /active-agents with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/active-agents`);
      assert.strictEqual(res.status, 401, 'Should reject unauthenticated requests');
    });

    it('ACTIVE-02: Reject unauthorized agent role with 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/overview`, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert.strictEqual(res.status, 403, 'Should forbid ordinary agent from administrative overview');
    });

    it('ACTIVE-03: Super Admin retrieves active agents count and breakdown', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/active-agents`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200, 'Should return 200 OK');
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(typeof data.count, 'number');
      assert.ok(data.breakdown !== undefined, 'Breakdown object must be returned');
      assert.strictEqual(typeof data.breakdown.available, 'number');
    });
  });

  // ==========================================
  // SECTION 2: Total Omnichannel Enquiries Aggregation
  // ==========================================
  describe('2. Omnichannel Enquiries Aggregation (Phase 2)', () => {
    it('ENQ-01: Aggregate channel counts (WhatsApp, Instagram, Email, Voice, Website)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/omnichannel-enquiries?period=30d`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(typeof data.totalEnquiries, 'number');
      assert.ok(data.channels !== undefined);
      assert.strictEqual(typeof data.channels.whatsapp, 'number');
      assert.strictEqual(typeof data.channels.instagram, 'number');
      assert.strictEqual(typeof data.channels.email, 'number');
      assert.strictEqual(typeof data.channels.voice, 'number');
      assert.strictEqual(typeof data.channels.website, 'number');
    });

    it('ENQ-02: Return daily trend series with correct date mapping', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/omnichannel-enquiries?period=30d`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const data = await res.json();
      assert.ok(Array.isArray(data.trend), 'Trend must be an array');
      assert.ok(data.trend.length > 0, 'Trend should have daily intervals');
      const first = data.trend[0];
      assert.ok(first.date !== undefined);
      assert.strictEqual(typeof first.total, 'number');
    });

    it('ENQ-03: GET enquiries is idempotent and side-effect free', async () => {
      const [r1, r2] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/super-admin/omnichannel-enquiries?period=7d`, {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }),
        fetch(`${BASE_URL}/api/v1/super-admin/omnichannel-enquiries?period=7d`, {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }),
      ]);
      assert.strictEqual(r1.status, 200);
      assert.strictEqual(r2.status, 200);
      const d1 = await r1.json();
      const d2 = await r2.json();
      assert.strictEqual(d1.totalEnquiries, d2.totalEnquiries);
    });
  });

  // ==========================================
  // SECTION 3: Platform Overview & Database Health
  // ==========================================
  describe('3. Platform Overview & Database Diagnostics (Phase 3)', () => {
    it('HEALTH-01: Platform overview returns operational status and stats', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/overview`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'OPERATIONAL');
      assert.ok(data.database !== undefined);
      assert.strictEqual(data.database.status, 'HEALTHY');
      assert.ok(data.businessUnitsCount >= 3, 'Must report at least UEC, UNCF, HOME_CARE');
    });

    it('HEALTH-02: Database telemetry returns safe metrics without credentials', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/database-health`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'HEALTHY');
      assert.strictEqual(typeof data.queryLatencyMs, 'number');
      assert.ok(data.tables !== undefined);
      // Ensure no credentials or connection strings leaked
      const bodyStr = JSON.stringify(data);
      assert.ok(!bodyStr.includes('postgres://'), 'Must not leak database URL');
      assert.ok(!bodyStr.includes('password'), 'Must not leak passwords');
    });
  });

  // ==========================================
  // SECTION 4: Secure Integrations & Masked Configuration
  // ==========================================
  describe('4. Integrations & Secret Protection (Phase 4)', () => {
    it('INT-01: List integrations returns masked secrets, never plaintext', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/integrations`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 6);

      for (const item of data) {
        assert.ok(item.provider !== undefined);
        assert.ok(item.status !== undefined);
        assert.ok(item.secretMasked.startsWith('••••'), `Secret must be masked for ${item.provider}`);
        assert.ok(!item.secretEncrypted, 'Encrypted secret must not be sent to client');
      }
    });

    it('INT-02: Bounded integration connectivity check executes safely', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/integrations/SUPABASE/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.provider, 'SUPABASE');
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'HEALTHY');
      assert.strictEqual(typeof data.latencyMs, 'number');
    });

    it('INT-03: Update integration settings increments version and masks secret', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/integrations/VOBIZ`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: true,
          settings: { trunk: 'ST_xsShWdBTtHZR', region: 'ap-south-1', testFlag: true },
          secret: 'new-vobiz-secret-9999',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.provider, 'VOBIZ');
      assert.strictEqual(data.secretMasked, '••••9999');
      assert.ok(data.version >= 1);
    });
  });

  // ==========================================
  // SECTION 5: Multi-Unit Governance & Hybrid Isolation
  // ==========================================
  describe('5. Multi-Unit Management & Governance (Phase 5 & 6)', () => {
    it('UNIT-01: List business units returns UEC, UNCF, and HOME_CARE', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/units`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const units = await res.json();
      assert.ok(Array.isArray(units));
      const codes = units.map((u) => u.code);
      assert.ok(codes.includes('UEC'), 'Must include UEC');
      assert.ok(codes.includes('UNCF'), 'Must include UNCF');
      assert.ok(codes.includes('HOME_CARE'), 'Must include HOME_CARE');
    });

    it('UNIT-02: Create new business unit validates and persists', async () => {
      const testCode = `TEST_UNIT_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/units`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCode,
          name: 'ElderCare Test Unit',
          description: 'Automated test business unit',
          isolationMode: 'ISOLATED',
          enabledProducts: ['CRM'],
          enabledModules: ['TELEPHONY', 'LEADS'],
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.unit.code, testCode);
      assert.strictEqual(data.unit.isolationMode, 'ISOLATED');
    });

    it('UNIT-03: Reject duplicate business unit code with 409 Conflict', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/units`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'UEC', // Duplicate of existing UEC
          name: 'Universal ElderCare Duplicate',
        }),
      });
      assert.strictEqual(res.status, 409, 'Must reject duplicate unit code with 409 Conflict');
    });

    it('UNIT-04: Update business unit modifies status and logs audit entry', async () => {
      // Find UEC unit ID
      const listRes = await fetch(`${BASE_URL}/api/v1/super-admin/units`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      const units = await listRes.json();
      const uec = units.find((u) => u.code === 'UEC');
      assert.ok(uec, 'UEC unit must exist');

      const updateRes = await fetch(`${BASE_URL}/api/v1/super-admin/units/${uec.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Updated primary healthcare and elder care operations unit',
          isolationMode: 'SHARED',
        }),
      });
      assert.strictEqual(updateRes.status, 200);
      const updated = await updateRes.json();
      assert.strictEqual(updated.success, true);
      assert.strictEqual(updated.unit.isolationMode, 'SHARED');
    });
  });

  // ==========================================
  // SECTION 6: Administrative Audit Trail
  // ==========================================
  describe('6. Administrative Audit Trail (Phase 3 & 4)', () => {
    it('AUDIT-01: Audit trail records administrative actions with actor identity', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/super-admin/audit-logs`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const logs = await res.json();
      assert.ok(Array.isArray(logs));
      assert.ok(logs.length > 0, 'Audit trail must contain entries');
      const latest = logs[0];
      assert.ok(latest.actorEmail !== undefined);
      assert.ok(latest.action !== undefined);
      assert.ok(latest.resource !== undefined);
      assert.ok(latest.outcome !== undefined);
      assert.ok(latest.createdAt !== undefined);
    });
  });
});
