const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== STARTING RACE CONDITION TEST ===");
  try {
    // 1. Create a dummy lead
    const dummyLead = await prisma.lead.create({
      data: {
        customerName: 'Race Condition Test Lead',
        phoneNumber: '+19999999999' + Date.now(), // unique
        status: 'NEW',
        source: 'Automated Test'
      }
    });

    console.log(`Created dummy lead ID: ${dummyLead.id}`);

    const API_URL = 'http://localhost:4000/api/v1/leads/' + dummyLead.id + '/claim';

    // 1.5 Get a real Agent ID to avoid FK constraint errors
    const realAgent = await prisma.agent.findFirst();
    if (!realAgent) {
      console.log("No agents found in DB. Please seed the database first.");
      process.exit(1);
    }
    const agentId = realAgent.id;

    // 2. Prepare 10 concurrent requests
    const promises = [];
    for (let i = 1; i <= 10; i++) {
      promises.push(
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId })
        }).then(async res => {
          const status = res.status;
          const body = await res.json();
          return { agentId, status, body };
        }).catch(err => {
          return { agentId, status: 500, error: err.message };
        })
      );
    }

    // 3. Execute all simultaneously
    console.log("Firing 10 simultaneous claim requests...");
    const results = await Promise.all(promises);

    // 4. Analyze results
    console.log("Responses:");
    results.forEach(r => console.log(`- ${r.agentId}: HTTP ${r.status} ${JSON.stringify(r.body || r.error)}`));

    const successes = results.filter(r => r.status === 200);
    const conflicts = results.filter(r => r.status === 409 || r.status === 400);
    
    console.log("\n=== TEST RESULTS ===");
    console.log(`Total Requests: ${results.length}`);
    console.log(`Successes (200 OK): ${successes.length} (Expected: 1)`);
    console.log(`Conflicts (409/400): ${conflicts.length} (Expected: 9)`);
    
    if (successes.length === 1) {
      console.log("✅ RACE CONDITION PREVENTED! Redis locking is working perfectly.");
      console.log(`Winning Agent: ${successes[0].agentId}`);
    } else if (successes.length > 1) {
      console.log("❌ CRITICAL FAIL: Multiple agents claimed the lead!");
    } else {
      console.log("❌ FAIL: No agent could claim the lead.");
    }

    // Cleanup
    await prisma.leadConversionLog.deleteMany({ where: { leadId: dummyLead.id } });
    await prisma.lead.delete({ where: { id: dummyLead.id } });
    console.log("Cleaned up dummy lead.");

  } catch (err) {
    console.error("Test Script Error:", err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
