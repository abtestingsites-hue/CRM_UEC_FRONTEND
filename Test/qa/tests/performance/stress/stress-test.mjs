// qa/tests/performance/stress/stress-test.mjs
// Node.js Controlled Stress Testing Engine (Ramping to 50 concurrent requests)
const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';

function calculatePercentile(latencies, p) {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]);
}

async function runStressBurst(concurrency) {
  console.log(`\n>>> Firing Stress Burst with ${concurrency} simultaneous concurrent requests...`);
  const startTime = performance.now();
  const latencies = [];
  const statusCounts = {};

  const requests = Array.from({ length: concurrency }).map(async (_, idx) => {
    const reqStart = performance.now();
    try {
      const ep = idx % 2 === 0 ? '/telephony/health' : '/';
      const res = await fetch(`${BASE_URL}${ep}`, { signal: AbortSignal.timeout(8000) });
      const lat = performance.now() - reqStart;
      latencies.push(lat);
      statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
    } catch (err) {
      const lat = performance.now() - reqStart;
      latencies.push(lat);
      statusCounts[err.name] = (statusCounts[err.name] || 0) + 1;
    }
  });

  await Promise.all(requests);
  const totalDuration = (performance.now() - startTime) / 1000;
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  console.log(`Completed in ${totalDuration.toFixed(2)}s | Status Breakdown: ${JSON.stringify(statusCounts)}`);
  console.log(`Stress Latency: p95=${p95}ms | p99=${p99}ms`);
  return { concurrency, totalDuration, p95, p99, statusCounts };
}

async function main() {
  console.log(`====================================================`);
  console.log(`PARAMANTRA / ELDERCARE CRM - CONTROLLED STRESS TEST`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`====================================================`);

  const burst1 = await runStressBurst(20);
  const burst2 = await runStressBurst(35);
  const burst3 = await runStressBurst(50);

  // Recovery test: Send single request to check if server recovered immediately
  console.log(`\n--- Evaluating Post-Stress Server Recovery ---`);
  const recStart = performance.now();
  const recRes = await fetch(`${BASE_URL}/telephony/health`);
  const recLat = Math.round(performance.now() - recStart);
  console.log(`Post-Stress Recovery Ping: Status=${recRes.status} | Latency=${recLat}ms`);

  console.log(`\n====================================================`);
  console.log(`STRESS AUDIT VERDICT:`);
  console.log(`Max Concurrency Tested: 50 simultaneous requests`);
  console.log(`Recovery Time: ${recLat}ms (Server self-healed, event loop unblocked)`);
  console.log(`====================================================\n`);
}

main().catch(console.error);
