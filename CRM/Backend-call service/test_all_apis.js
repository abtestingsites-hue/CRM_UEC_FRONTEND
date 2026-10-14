const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://localhost:4000/api/v1';
const report = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  results: []
};

async function logResult(name, method, endpoint, isSuccess, errorMsg = null) {
  report.totalTests++;
  if (isSuccess) report.passed++;
  else report.failed++;

  const result = {
    test: name,
    method,
    endpoint,
    status: isSuccess ? 'PASSED' : 'FAILED',
    error: errorMsg
  };
  report.results.push(result);
  console.log(`[${result.status}] ${name} (${method} ${endpoint}) ${errorMsg ? '- ' + errorMsg : ''}`);
}

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE API TEST SUITE ===\n");

  let agentId = null;
  let testLeadId = null;
  let testFollowupId = null;

  try {
    // Setup: Get an agent
    const realAgent = await prisma.agent.findFirst({ include: { user: true } });
    if (!realAgent) throw new Error("No agent found in DB for testing.");
    agentId = realAgent.id;

    // 1. Auth Test (Simulated by checking agent endpoint, login requires passwords we might not have in plaintext)
    try {
      const res = await fetch(`${API_BASE}/agents`);
      await logResult("Fetch Agents Directory", "GET", "/agents", res.status === 200);
    } catch (e) {
      await logResult("Fetch Agents Directory", "GET", "/agents", false, e.message);
    }

    // 2. Fetch Conversations
    try {
      const res = await fetch(`${API_BASE}/conversations`);
      await logResult("Fetch Conversations", "GET", "/conversations", res.status === 200);
    } catch (e) {
      await logResult("Fetch Conversations", "GET", "/conversations", false, e.message);
    }

    // 3. Fetch Leads
    try {
      const res = await fetch(`${API_BASE}/leads`);
      await logResult("Fetch Leads", "GET", "/leads", res.status === 200);
    } catch (e) {
      await logResult("Fetch Leads", "GET", "/leads", false, e.message);
    }

    // 4. Lead Analytics
    try {
      const res = await fetch(`${API_BASE}/leads/analytics/dashboard`);
      await logResult("Lead Analytics", "GET", "/leads/analytics/dashboard", res.status === 200);
    } catch (e) {
      await logResult("Lead Analytics", "GET", "/leads/analytics/dashboard", false, e.message);
    }

    // 5. Fetch Followups
    try {
      const res = await fetch(`${API_BASE}/followups`);
      await logResult("Fetch Followups", "GET", "/followups", res.status === 200);
    } catch (e) {
      await logResult("Fetch Followups", "GET", "/followups", false, e.message);
    }

    // 6. Create Lead
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Comprehensive Test Lead',
          phoneNumber: '+190000000' + Math.floor(Math.random() * 10000),
          agentId: realAgent.user.id
        })
      });
      const data = await res.json();
      testLeadId = data.lead?.id;
      await logResult("Create Manual Lead", "POST", "/leads", res.status === 200 && testLeadId);
    } catch (e) {
      await logResult("Create Manual Lead", "POST", "/leads", false, e.message);
    }

    if (testLeadId) {
      // 7. Claim Lead
      try {
        const res = await fetch(`${API_BASE}/leads/${testLeadId}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId })
        });
        await logResult("Claim Lead", "POST", `/leads/:id/claim`, res.status === 200);
      } catch (e) {
        await logResult("Claim Lead", "POST", `/leads/:id/claim`, false, e.message);
      }

      // 8. Convert Lead
      try {
        const res = await fetch(`${API_BASE}/leads/${testLeadId}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: 'Test Positive',
            sentiment: 'POSITIVE',
            agentId,
            appointmentDate: new Date(Date.now() + 86400000).toISOString(),
            appointmentPurpose: 'Consultation'
          })
        });
        const data = await res.json();
        await logResult("Convert Lead (Positive)", "POST", `/leads/:id/convert`, res.status === 200 && data.sentiment === 'POSITIVE');
      } catch (e) {
        await logResult("Convert Lead (Positive)", "POST", `/leads/:id/convert`, false, e.message);
      }

      // Find created followup
      const followups = await prisma.leadFollowup.findMany({ where: { leadId: testLeadId } });
      if (followups.length > 0) {
        testFollowupId = followups[0].id;
        
        // 9. Complete Followup
        try {
          const res = await fetch(`${API_BASE}/followups/${testFollowupId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED', notes: 'Done' })
          });
          await logResult("Complete Followup", "PUT", `/followups/:id/status`, res.status === 200);
        } catch (e) {
          await logResult("Complete Followup", "PUT", `/followups/:id/status`, false, e.message);
        }
      } else {
        await logResult("Complete Followup", "PUT", `/followups/:id/status`, false, "No followup was created in previous step");
      }
    }

  } catch (err) {
    console.error("Critical test failure:", err);
  } finally {
    // Cleanup
    if (testLeadId) {
      await prisma.leadFollowup.deleteMany({ where: { leadId: testLeadId } });
      await prisma.leadConversionLog.deleteMany({ where: { leadId: testLeadId } });
      await prisma.lead.delete({ where: { id: testLeadId } });
    }
    await prisma.$disconnect();

    // Output raw report JSON to disk for the agent to parse and write to markdown
    const fs = require('fs');
    fs.writeFileSync('test_report.json', JSON.stringify(report, null, 2));
    
    console.log(`\n=== SUITE COMPLETE ===`);
    console.log(`Passed: ${report.passed}/${report.totalTests}`);
    process.exit(0);
  }
}

runTests();
