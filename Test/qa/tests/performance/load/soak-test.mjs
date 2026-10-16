// Test/qa/tests/performance/load/soak-test.mjs
// PHASE 07 — Sustained Capacity & Endurance Benchmark (Soak Test)

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

const ENDPOINTS = [
  '/api/v1/leads',
  '/dashboard/analytics',
  '/api/v1/appointments/calendar',
  '/api/v1/tickets',
  '/telephony/health'
];

async function runEnduranceBenchmark(vuCount = 25, iterations = 8) {
  console.log('======================================================');
  console.log(`PHASE 07: SUSTAINED CAPACITY & SOAK BENCHMARK`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Concurrency: ${vuCount} Virtual Users | Iterations: ${iterations}`);
  console.log(`Total Requests: ${vuCount * iterations}`);
  console.log('======================================================\n');

  const allLatencies = [];
  const statusCounts = {};
  let totalErrors = 0;
  let totalTimeouts = 0;
  const cycleMetrics = [];

  const startTime = performance.now();

  for (let cycle = 1; cycle <= iterations; cycle++) {
    const cycleStart = performance.now();
    const cycleLatencies = [];

    const workers = Array.from({ length: vuCount }).map(async (_, vuIdx) => {
      const ep = ENDPOINTS[(vuIdx + cycle) % ENDPOINTS.length];
      const reqStart = performance.now();
      try {
        const res = await fetch(`${BASE_URL}${ep}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        });
        const lat = performance.now() - reqStart;
        allLatencies.push(lat);
        cycleLatencies.push(lat);
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
        if (res.status >= 400) totalErrors++;
      } catch (err) {
        const lat = performance.now() - reqStart;
        allLatencies.push(lat);
        cycleLatencies.push(lat);
        totalErrors++;
        if (err.name === 'TimeoutError') totalTimeouts++;
        const key = err.name || 'FETCH_ERR';
        statusCounts[key] = (statusCounts[key] || 0) + 1;
      }
    });

    await Promise.all(workers);
    const cycleDuration = (performance.now() - cycleStart) / 1000;
    const cycleP50 = calculatePercentile(cycleLatencies, 50);
    const cycleP95 = calculatePercentile(cycleLatencies, 95);

    cycleMetrics.push({
      cycle,
      duration: cycleDuration.toFixed(2),
      p50: `${cycleP50}ms`,
      p95: `${cycleP95}ms`,
      errors: totalErrors
    });

    console.log(`Cycle ${cycle}/${iterations}: ${vuCount} requests in ${cycleDuration.toFixed(2)}s | p50=${cycleP50}ms, p95=${cycleP95}ms`);
    // Brief 500ms pacing between cycles
    await new Promise(r => setTimeout(r, 500));
  }

  const totalDuration = (performance.now() - startTime) / 1000;
  const overallP50 = calculatePercentile(allLatencies, 50);
  const overallP95 = calculatePercentile(allLatencies, 95);
  const overallP99 = calculatePercentile(allLatencies, 99);
  const totalRequests = allLatencies.length;
  const rps = (totalRequests / totalDuration).toFixed(2);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);

  console.log('\n======================================================');
  console.log('ENDURANCE & SOAK BENCHMARK SUMMARY');
  console.log('======================================================');
  console.table(cycleMetrics);
  console.log(`Total Executed: ${totalRequests} requests`);
  console.log(`Overall Duration: ${totalDuration.toFixed(2)}s | Sustained RPS: ${rps} req/sec`);
  console.log(`Status Codes: ${JSON.stringify(statusCounts)}`);
  console.log(`Error Rate: ${errorRate}% | Timeouts: ${totalTimeouts}`);
  console.log(`Overall Latency: p50=${overallP50}ms | p95=${overallP95}ms | p99=${overallP99}ms`);

  const slaPassed = parseFloat(errorRate) <= 1.0 && overallP95 <= 3000;
  console.log(`\nSustained Capacity Verdict (25 VUs): ${slaPassed ? 'CERTIFIED PASS' : 'FAIL'}`);

  return { slaPassed, totalRequests, errorRate, rps, overallP50, overallP95, overallP99 };
}

runEnduranceBenchmark().catch(err => {
  console.error('Endurance test failure:', err);
  process.exit(1);
});
