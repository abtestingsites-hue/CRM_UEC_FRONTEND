// qa/tests/performance/load/load-test.mjs
// Node.js Automated Load Testing Engine with percentile calculations (p50, p90, p95, p99)
const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';

const ENDPOINTS = [
  { path: '/', weight: 3 },
  { path: '/telephony/health', weight: 4 },
  { path: '/api/v1/leads', weight: 3 }
];

function pickEndpoint() {
  const totalWeight = ENDPOINTS.reduce((acc, e) => acc + e.weight, 0);
  let random = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    if (random < ep.weight) return ep.path;
    random -= ep.weight;
  }
  return ENDPOINTS[0].path;
}

function calculatePercentile(latencies, p) {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]);
}

async function runStage(concurrency, totalRequests) {
  console.log(`\n--- Running Stage: Concurrency = ${concurrency} VUs | Target Requests = ${totalRequests} ---`);
  const latencies = [];
  const statusCounts = {};
  let completed = 0;
  let activeWorkers = 0;
  const startTime = performance.now();

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const path = pickEndpoint();
      const url = `${BASE_URL}${path}`;
      const reqStart = performance.now();
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        const latency = performance.now() - reqStart;
        latencies.push(latency);
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
      } catch (err) {
        const latency = performance.now() - reqStart;
        latencies.push(latency);
        const errKey = err.name === 'TimeoutError' ? 'TIMEOUT' : 'ERROR';
        statusCounts[errKey] = (statusCounts[errKey] || 0) + 1;
      }
    }
  }

  const workers = Array.from({ length: concurrency }).map(() => worker());
  await Promise.all(workers);

  const totalDurationSec = (performance.now() - startTime) / 1000;
  const rps = (latencies.length / totalDurationSec).toFixed(2);
  const p50 = calculatePercentile(latencies, 50);
  const p90 = calculatePercentile(latencies, 90);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  const successCount = (statusCounts[200] || 0) + (statusCounts[201] || 0);
  const errorCount = latencies.length - successCount;
  const errorRate = ((errorCount / latencies.length) * 100).toFixed(2);

  console.log(`Duration: ${totalDurationSec.toFixed(2)}s | Total Requests: ${latencies.length} | Throughput: ${rps} req/sec`);
  console.log(`HTTP Statuses: ${JSON.stringify(statusCounts)} | Error Rate: ${errorRate}%`);
  console.log(`Latency (ms): p50=${p50}ms | p90=${p90}ms | p95=${p95}ms | p99=${p99}ms`);

  return { concurrency, totalRequests, totalDurationSec, rps, p50, p90, p95, p99, errorRate, statusCounts };
}

async function main() {
  console.log(`====================================================`);
  console.log(`PARAMANTRA / ELDERCARE CRM - AUTOMATED LOAD TEST`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`====================================================`);

  const stage1 = await runStage(5, 50);   // Baseline: 5 VUs
  const stage2 = await runStage(10, 100); // Moderate: 10 VUs
  const stage3 = await runStage(25, 150); // Elevated: 25 VUs

  console.log(`\n====================================================`);
  console.log(`LOAD TEST SUMMARY MATRIX:`);
  console.log(`Stage 1 (5 VUs):  RPS: ${stage1.rps} | p95: ${stage1.p95}ms | Errors: ${stage1.errorRate}%`);
  console.log(`Stage 2 (10 VUs): RPS: ${stage2.rps} | p95: ${stage2.p95}ms | Errors: ${stage2.errorRate}%`);
  console.log(`Stage 3 (25 VUs): RPS: ${stage3.rps} | p95: ${stage3.p95}ms | Errors: ${stage3.errorRate}%`);
  console.log(`====================================================\n`);
}

main().catch(err => console.error(err));
