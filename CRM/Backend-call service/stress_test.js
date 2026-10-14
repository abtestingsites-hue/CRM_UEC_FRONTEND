async function run() {
  console.log("=== STARTING STRESS TEST ===");
  console.log("Firing 100 concurrent requests to GET /api/v1/leads...");
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < 100; i++) {
    promises.push(
      fetch('http://localhost:4000/api/v1/leads')
        .then(res => res.status)
        .catch(err => 500)
    );
  }

  const results = await Promise.all(promises);
  const endTime = Date.now();

  const successes = results.filter(s => s === 200).length;
  const failures = results.length - successes;
  const durationMs = endTime - startTime;

  console.log(`\n=== STRESS TEST RESULTS ===`);
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successes: ${successes}`);
  console.log(`Failures: ${failures}`);
  console.log(`Duration: ${durationMs}ms`);
  console.log(`Throughput: ${((results.length / durationMs) * 1000).toFixed(2)} req/sec`);

  if (failures > 0) {
    console.error("❌ STRESS TEST FAILED: Some requests failed.");
  } else if (durationMs > 5000) {
    console.warn("⚠️ STRESS TEST PASSED WITH WARNING: High latency detected.");
  } else {
    console.log("✅ STRESS TEST PASSED: Node event loop and Prisma handled the load efficiently.");
  }
}

run();
