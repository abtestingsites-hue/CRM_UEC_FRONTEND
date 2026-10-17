// Test/qa/tests/integration/def10-unwired-modules.test.mjs
// Regression test suite for DEF-10: Dead Placeholder Modules & Static Mock Forms with Unwired Buttons

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';

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

const agentToken = jwt.sign({
  userId: 'c5c515de-587b-4a56-b4a8-53b51af275e9',
  agentId: 'c5c515de-587b-4a56-b4a8-53b51af275e9',
  email: 'agent@paramantra.com',
  role: 'AGENT',
  userType: 'AGENT'
}, JWT_SECRET, { expiresIn: '1h' });

const adminHeaders = {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
};

const agentHeaders = {
  'Authorization': `Bearer ${agentToken}`,
  'Content-Type': 'application/json'
};

describe('DEF-10: Automation Rules & Settings Department API Integration', () => {
  let createdWorkflowId = null;
  let createdDepartmentId = null;

  // ==========================================
  // 1. WORKFLOW AUTOMATION CRUD
  // ==========================================
  describe('Workflow Automation CRUD Endpoints', () => {
    it('DEF10-AUTO-01: POST /api/v1/automations creates a new automation rule with persistence', async () => {
      const payload = {
        name: `Auto Welcome Test ${Date.now()}`,
        description: 'Auto reply to new omnichannel conversations',
        triggerType: 'NEW_CONVERSATION',
        actionType: 'AUTO_REPLY',
        actionConfig: {
          replyContent: 'Hello from QA automated test!',
          channels: ['whatsapp', 'email'],
          priority: 'P2'
        },
        isActive: true
      };

      const res = await fetch(`${BASE_URL}/api/v1/automations`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 201, 'Must return 201 Created');
      const data = await res.json();
      assert.ok(data.id, 'Created automation must have an ID');
      assert.strictEqual(data.name, payload.name);
      assert.strictEqual(data.triggerType, payload.triggerType);
      assert.strictEqual(data.isActive, true);
      createdWorkflowId = data.id;
    });

    it('DEF10-AUTO-02: GET /api/v1/automations returns list including the newly created rule', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/automations`, {
        headers: adminHeaders
      });

      assert.strictEqual(res.status, 200, 'Must return 200 OK');
      const list = await res.json();
      assert.ok(Array.isArray(list), 'Response must be an array');
      const found = list.find(w => w.id === createdWorkflowId);
      assert.ok(found, 'Created workflow must exist in the returned collection');
    });

    it('DEF10-AUTO-03: PATCH /api/v1/automations/:id/toggle flips isActive status', async () => {
      assert.ok(createdWorkflowId, 'Workflow ID required');
      const res = await fetch(`${BASE_URL}/api/v1/automations/${createdWorkflowId}/toggle`, {
        method: 'PATCH',
        headers: adminHeaders
      });

      assert.strictEqual(res.status, 200, 'Must return 200 OK');
      const data = await res.json();
      assert.strictEqual(data.isActive, false, 'isActive should be toggled to false');

      // Toggle back
      const res2 = await fetch(`${BASE_URL}/api/v1/automations/${createdWorkflowId}/toggle`, {
        method: 'PATCH',
        headers: adminHeaders
      });
      assert.strictEqual(res2.status, 200);
      const data2 = await res2.json();
      assert.strictEqual(data2.isActive, true, 'isActive should be toggled back to true');
    });

    it('DEF10-AUTO-04: PUT /api/v1/automations/:id updates rule configuration', async () => {
      assert.ok(createdWorkflowId, 'Workflow ID required');
      const res = await fetch(`${BASE_URL}/api/v1/automations/${createdWorkflowId}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          name: 'Updated Rule Name By QA',
          description: 'Updated description'
        })
      });

      assert.strictEqual(res.status, 200, 'Must return 200 OK');
      const data = await res.json();
      assert.strictEqual(data.name, 'Updated Rule Name By QA');
      assert.strictEqual(data.description, 'Updated description');
    });

    it('DEF10-AUTO-05: DELETE /api/v1/automations/:id removes rule cleanly', async () => {
      assert.ok(createdWorkflowId, 'Workflow ID required');
      const res = await fetch(`${BASE_URL}/api/v1/automations/${createdWorkflowId}`, {
        method: 'DELETE',
        headers: adminHeaders
      });

      assert.strictEqual(res.status, 200, 'Must return 200 OK');
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // Verify it's gone
      const verifyRes = await fetch(`${BASE_URL}/api/v1/automations`, {
        headers: adminHeaders
      });
      const list = await verifyRes.json();
      const found = list.find(w => w.id === createdWorkflowId);
      assert.strictEqual(found, undefined, 'Workflow must be deleted');
    });
  });

  // ==========================================
  // 2. SETTINGS: DEPARTMENTS CRUD
  // ==========================================
  describe('Settings Department CRUD Endpoints', () => {
    it('DEF10-DEPT-01: POST /api/v1/departments creates a new department record', async () => {
      const payload = {
        name: `QA Department ${Date.now()}`,
        description: 'Test Department for QA Verification'
      };

      const res = await fetch(`${BASE_URL}/api/v1/departments`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 201, 'Must return 201 Created');
      const data = await res.json();
      assert.ok(data.id, 'Department must have an ID');
      assert.strictEqual(data.name, payload.name);
      createdDepartmentId = data.id;
    });

    it('DEF10-DEPT-02: GET /api/v1/departments returns list including new department', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/departments`, {
        headers: adminHeaders
      });

      assert.strictEqual(res.status, 200, 'Must return 200 OK');
      const list = await res.json();
      assert.ok(Array.isArray(list), 'Must return array');
      const found = list.find(d => d.id === createdDepartmentId);
      assert.ok(found, 'Department must exist in list');
    });

    it('DEF10-DEPT-03: DELETE /api/v1/departments/:id deletes department', async () => {
      assert.ok(createdDepartmentId, 'Department ID required');
      const res = await fetch(`${BASE_URL}/api/v1/departments/${createdDepartmentId}`, {
        method: 'DELETE',
        headers: adminHeaders
      });

      assert.strictEqual(res.status, 200, 'Must return 200 OK');
    });
  });

  // ==========================================
  // 3. SECURITY & RBAC GUARDS
  // ==========================================
  describe('Security & RBAC Enforcement on Unwired Modules', () => {
    it('DEF10-SEC-01: Unauthenticated callers are rejected with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Malicious' })
      });

      assert.strictEqual(res.status, 401, 'Must reject anonymous caller with 401');
    });

    it('DEF10-SEC-02: Non-elevated AGENT role cannot mutate automations or departments (403)', async () => {
      const resAuto = await fetch(`${BASE_URL}/api/v1/automations`, {
        method: 'POST',
        headers: agentHeaders,
        body: JSON.stringify({ name: 'Agent Rule' })
      });
      assert.strictEqual(resAuto.status, 403, 'Must reject standard AGENT with 403 Forbidden');

      const resDept = await fetch(`${BASE_URL}/api/v1/departments`, {
        method: 'POST',
        headers: agentHeaders,
        body: JSON.stringify({ name: 'Agent Dept' })
      });
      assert.strictEqual(resDept.status, 403, 'Must reject standard AGENT with 403 Forbidden');
    });
  });
});
