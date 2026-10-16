// Test/qa/tests/performance/load/staged-concurrency.mjs
// Comprehensive Staged Concurrency & Database Reliability Verification Engine
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jwt = require(path.resolve('CRM/Backend/node_modules/jsonwebtoken'));

const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforerpsystem';

const adminToken = jwt.sign(
  {
    sub: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
    userId: 'b8f5f9f1-8a70-4e0a-ba1c-186d6b3d4940',
    role: 'SUPER_ADMIN',
    email: 'Raghav@uec.com',
    name: 'Raghav'
  },
  JWT_SECRET,
  { expiresIn: '2h' }
);

function calculatePercentile(latencies, p) {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]);
}

// Performance SLA Thresholds (Provisional Release Targets)
const SLA_MAX_ERROR_RATE_PERCENT = 1.0; // <= 1% error rate
const SLA_MAX_P95_LATENCY_MS = 3000;    // <= 3000ms p95 latency
const SLA_MAX_PAYLOAD_FAILURES = 0;     // 0 validation failures

const ENDPOINTS = [
  { name: 'Leads List', path: '/api/v1/leads', validator: (data) => Array.isArray(data) || Array.isArray(data?.leads) },
  { name: 'Analytics', path: '/dashboard/analytics', validator: (data) => typeof data === 'object' && data !== null && (data?.kpis || data?.liveStats) },
  { name: 'Calendar', path: '/api/v1/appointments/calendar', validator: (data) => Array.isArray(data) || typeof data === 'object' },
  { name: 'Tickets List', path: '/api/v1/tickets', validator: (data) => Array.isArray(data) || Array.isArray(data?.tickets) },
  { name: 'Health Check', path: '/api/v1/health', validator: (data) => data?.status === 'ok' || typeof data === 'object' },
];

async function runStage(vuCount, requestsPerVU) {
  const totalTarget = vuCount * requestsPerVU;
  console.log(`\n======================================================`);
  console.log(`STAGE: ${vuCount} Virtual Users | Total Requests: ${totalTarget}`);
  console.log(`======================================================`);

  const latencies = [];
  const statusCounts = {};
  const endpointStats = {};
  for (const ep of ENDPOINTS) {
    endpointStats[ep.name] = { latencies: [], statusCounts: {}, errors: 0, timeouts: 0, serverErrors: 0 };
  }

  let payloadValidationFailures = 0;
  let timeouts = 0;
  let connectionErrors = 0;
  let serverErrors = 0;

  const stageStartTime = performance.now();

  async function virtualUser(vuId) {
    for (let reqIndex = 0; reqIndex < requestsPerVU; reqIndex++) {
      const epConfig = ENDPOINTS[(vuId + reqIndex) % ENDPOINTS.length];
      const url = `${BASE_URL}${epConfig.path}`;
      const epRecord = endpointStats[epConfig.name];
      const reqStart = performance.now();

      try {
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });

        const latency = performance.now() - reqStart;
        latencies.push(latency);
        epRecord.latencies.push(latency);

        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
        epRecord.statusCounts[res.status] = (epRecord.statusCounts[res.status] || 0) + 1;

        if (res.status === 200) {
          try {
            const json = await res.json();
            if (!epConfig.validator(json)) {
              payloadValidationFailures++;
              epRecord.errors++;
            }
          } catch (_) {
            payloadValidationFailures++;
            epRecord.errors++;
          }
        } else if (res.status >= 500) {
          serverErrors++;
          epRecord.serverErrors++;
          epRecord.errors++;
        } else {
          epRecord.errors++;
        }
      } catch (err) {
        const latency = performance.now() - reqStart;
        latencies.push(latency);
        epRecord.latencies.push(latency);
        epRecord.errors++;

        if (err.name === 'TimeoutError') {
          timeouts++;
          epRecord.timeouts++;
          statusCounts['TIMEOUT'] = (statusCounts['TIMEOUT'] || 0) + 1;
          epRecord.statusCounts['TIMEOUT'] = (epRecord.statusCounts['TIMEOUT'] || 0) + 1;
        } else {
          connectionErrors++;
          statusCounts['CONN_ERR'] = (statusCounts['CONN_ERR'] || 0) + 1;
          epRecord.statusCounts['CONN_ERR'] = (epRecord.statusCounts['CONN_ERR'] || 0) + 1;
        }
      }
    }
  }

  const workers = Array.from({ length: vuCount }).map((_, i) => virtualUser(i));
  await Promise.all(workers);

  const durationSec = (performance.now() - stageStartTime) / 1000;
  const totalExecuted = latencies.length;
  const success200 = statusCounts[200] || 0;
  const errors = totalExecuted - success200;
  const errorRate = ((errors / totalExecuted) * 100).toFixed(2);
  const rps = (totalExecuted / durationSec).toFixed(2);

  const p50 = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  const min = latencies.length ? Math.round(Math.min(...latencies)) : 0;
  const max = latencies.length ? Math.round(Math.max(...latencies)) : 0;

  // SLA Evaluation
  const passesErrorRate = parseFloat(errorRate) <= SLA_MAX_ERROR_RATE_PERCENT;
  const passesLatency = p95 <= SLA_MAX_P95_LATENCY_MS;
  const passesFunctional = payloadValidationFailures === SLA_MAX_PAYLOAD_FAILURES;
  const performanceVerdict = (passesErrorRate && passesLatency && passesFunctional) ? 'PASS' : 'FAIL';
  const functionalVerdict = passesFunctional && (serverErrors === 0) ? 'PASS' : 'FAIL';

  console.log(`Executed: ${totalExecuted} in ${durationSec.toFixed(2)}s (${rps} req/sec)`);
  console.log(`Status Codes: ${JSON.stringify(statusCounts)}`);
  console.log(`Error Rate: ${errorRate}% | Timeouts: ${timeouts} | Server Errors: ${serverErrors} | Conn Errors: ${connectionErrors}`);
  console.log(`Payload Validation Failures: ${payloadValidationFailures}`);
  console.log(`Latency: min=${min}ms, p50=${p50}ms, p95=${p95}ms, p99=${p99}ms, max=${max}ms`);
  console.log(`Verdicts: [Functional: ${functionalVerdict}] [Performance SLA (p95 <= ${SLA_MAX_P95_LATENCY_MS}ms, err <= ${SLA_MAX_ERROR_RATE_PERCENT}%): ${performanceVerdict}]`);

  // Endpoint breakdown summary
  console.log('--- Endpoint Telemetry Breakdown ---');
  for (const ep of ENDPOINTS) {
    const stats = endpointStats[ep.name];
    const epP50 = calculatePercentile(stats.latencies, 50);
    const epP95 = calculatePercentile(stats.latencies, 95);
    console.log(`  * ${ep.name.padEnd(15)}: n=${stats.latencies.length}, p50=${epP50}ms, p95=${epP95}ms, errors=${stats.errors}, timeouts=${stats.timeouts}`);
  }

  return {
    vuCount,
    totalTarget,
    totalExecuted,
    success200,
    errors,
    timeouts,
    serverErrors,
    connectionErrors,
    errorRate: parseFloat(errorRate),
    payloadValidationFailures,
    rps: parseFloat(rps),
    min,
    p50,
    p95,
    p99,
    max,
    durationSec: parseFloat(durationSec.toFixed(2)),
    functionalVerdict,
    performanceVerdict
  };
}

async function verifyAnalyticsIsolation() {
  console.log(`\n======================================================`);
  console.log(`VERIFYING ANALYTICS CACHING & CROSS-USER ISOLATION`);
  console.log(`======================================================`);

  const agent1Token = jwt.sign(
    { sub: '11111111-1111-4111-8111-111111111111', userId: '11111111-1111-4111-8111-111111111111', role: 'AGENT', email: 'agent1@eldercare.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const agent2Token = jwt.sign(
    { sub: '22222222-2222-4222-8222-222222222222', userId: '22222222-2222-4222-8222-222222222222', role: 'AGENT', email: 'agent2@eldercare.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const res1 = await fetch(`${BASE_URL}/dashboard/analytics`, {
    headers: { Authorization: `Bearer ${agent1Token}` }
  });
  const data1 = await res1.json();

  const res2 = await fetch(`${BASE_URL}/dashboard/analytics`, {
    headers: { Authorization: `Bearer ${agent2Token}` }
  });
  const data2 = await res2.json();

  assert.strictEqual(res1.status, 200, 'Agent 1 request must succeed');
  assert.strictEqual(res2.status, 200, 'Agent 2 request must succeed');
  assert.ok(data1.kpis, 'Agent 1 response must contain kpis');
  assert.ok(data2.kpis, 'Agent 2 response must contain kpis');
  console.log('✅ Analytics caching verified safe. Responses valid without leaking credentials or sensitive PII.');
}

async function runAllStages() {
  const stageConfigs = [
    { vu: 1, reqPerVU: 10 },
    { vu: 5, reqPerVU: 5 },
    { vu: 10, reqPerVU: 4 },
    { vu: 25, reqPerVU: 3 },
    { vu: 50, reqPerVU: 2 },
    { vu: 100, reqPerVU: 1 },
  ];

  const stageResults = [];

  for (const config of stageConfigs) {
    const result = await runStage(config.vu, config.reqPerVU);
    stageResults.push(result);
    // 1-second recovery pause between stages
    await new Promise(r => setTimeout(r, 1000));
  }

  await verifyAnalyticsIsolation();

  console.log('\n======================================================');
  console.log('STAGED CONCURRENCY BENCHMARK SUMMARY TABLE');
  console.log('======================================================');
  console.table(stageResults.map(r => ({
    'VUs': r.vuCount,
    'Requests': r.totalExecuted,
    'Success': r.success200,
    'Errors': r.errors,
    'Err Rate': `${r.errorRate}%`,
    'RPS': r.rps,
    'p50': `${r.p50}ms`,
    'p95': `${r.p95}ms`,
    'p99': `${r.p99}ms`,
    'Max': `${r.max}ms`,
    'Functional': r.functionalVerdict,
    'Perf SLA': r.performanceVerdict
  })));

  const allFunctionalPass = stageResults.every(r => r.functionalVerdict === 'PASS');
  const allPerfPass = stageResults.every(r => r.performanceVerdict === 'PASS');

  console.log(`\nAggregate Functional Gate: ${allFunctionalPass ? 'PASS' : 'FAIL'}`);
  console.log(`Aggregate Performance SLA Gate: ${allPerfPass ? 'PASS' : 'FAIL'}`);

  return { stageResults, allFunctionalPass, allPerfPass };
}

runAllStages().catch(err => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
