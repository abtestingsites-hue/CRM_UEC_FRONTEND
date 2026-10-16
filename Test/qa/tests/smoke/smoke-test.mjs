// qa/tests/smoke/smoke-test.mjs
// Automated Smoke Test for Paramantra / ElderCare CRM Backend
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

async function runSmokeTests() {
  console.log(`====================================================`);
  console.log(`PARAMANTRA / ELDERCARE CRM - AUTOMATED SMOKE SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`====================================================\n`);

  const results = [];

  const tests = [
    {
      id: 'SMK-01',
      name: 'Root Health / Ping Check',
      url: `${BASE_URL}/`,
      expectedStatus: 200,
      validate: (body) => body.includes('Hello World')
    },
    {
      id: 'SMK-02',
      name: 'Telephony Service Health Check',
      url: `${BASE_URL}/telephony/health`,
      expectedStatus: 200,
      validate: (body) => {
        const json = JSON.parse(body);
        return json.status === 'ok' && json.provider === 'vobiz';
      }
    },
    {
      id: 'SMK-03',
      name: 'API Gateway Health Check (/api/v1/health)',
      url: `${BASE_URL}/api/v1/health`,
      expectedStatus: 200, // Defect DEF-08 resolved
      validate: () => true
    },
    {
      id: 'SMK-04',
      name: 'Frontend Lead Route Compatibility (/leads)',
      url: `${BASE_URL}/leads`,
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 200, // Defect DEF-05 resolved
      validate: () => true
    },
    {
      id: 'SMK-05',
      name: 'Backend Canonical Lead Route (/api/v1/leads)',
      url: `${BASE_URL}/api/v1/leads`,
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 200,
      validate: () => true
    },
    {
      id: 'SMK-06',
      name: 'Agents API Endpoint (/api/v1/agents)',
      url: `${BASE_URL}/api/v1/agents`,
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 200,
      validate: (body) => {
        const json = JSON.parse(body);
        return Array.isArray(json) || Array.isArray(json.agents);
      }
    },
    {
      id: 'SMK-07',
      name: 'Dashboard Analytics Route (/dashboard/analytics)',
      url: `${BASE_URL}/dashboard/analytics`,
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 200, // Defect DEF-06 resolved
      validate: () => true
    },
    {
      id: 'SMK-08',
      name: 'Appointments Calendar Route (/calendar)',
      url: `${BASE_URL}/calendar`,
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 200, // Defect DEF-07 resolved
      validate: () => true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const start = performance.now();
    try {
      const res = await fetch(t.url, { 
        headers: t.headers || {},
        signal: AbortSignal.timeout(10000) 
      });
      const durationMs = Math.round(performance.now() - start);
      const text = await res.text();
      const statusOk = res.status === t.expectedStatus;
      let bodyOk = true;

      if (statusOk) {
        try {
          bodyOk = t.validate(text);
        } catch {
          bodyOk = false;
        }
      }

      if (statusOk && bodyOk) {
        console.log(`[PASS] ${t.id} - ${t.name} (Status: ${res.status}, Latency: ${durationMs}ms)`);
        results.push({ id: t.id, name: t.name, status: 'PASS', httpStatus: res.status, durationMs });
        passed++;
      } else {
        console.log(`[FAIL] ${t.id} - ${t.name} (Expected: ${t.expectedStatus}, Got: ${res.status}, Latency: ${durationMs}ms)`);
        results.push({ id: t.id, name: t.name, status: 'FAIL', httpStatus: res.status, durationMs, error: `Status mismatch: expected ${t.expectedStatus}, received ${res.status}` });
        failed++;
      }
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      console.log(`[FAIL] ${t.id} - ${t.name} (Error: ${err.message}, Latency: ${durationMs}ms)`);
      results.push({ id: t.id, name: t.name, status: 'FAIL', durationMs, error: err.message });
      failed++;
    }
  }

  console.log(`\n====================================================`);
  console.log(`SMOKE SUMMARY: Total: ${tests.length} | Passed: ${passed} | Failed: ${failed} | Pass Rate: ${Math.round((passed / tests.length) * 100)}%`);
  console.log(`====================================================\n`);

  return results;
}

runSmokeTests();
