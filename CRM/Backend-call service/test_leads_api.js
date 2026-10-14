const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== STARTING LEADS API TEST ===");
  try {
    const realAgent = await prisma.agent.findFirst({ include: { user: true } });
    if (!realAgent || !realAgent.user) {
      console.log("No agents with valid user found in DB.");
      process.exit(1);
    }
    const agentId = realAgent.id;
    const userId = realAgent.user.id;

    // 1. Create a lead manually via API
    console.log("1. Testing Manual Lead Creation...");
    const createRes = await fetch('http://localhost:4000/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'API Test Lead',
        phoneNumber: '+15555555555' + Date.now(), // unique phone
        source: 'API Test',
        agentId: userId
      })
    });
    const createdLead = await createRes.json();
    if (!createdLead.success) {
      console.error(createdLead);
      throw new Error("Failed to create lead");
    }
    console.log("✅ Lead Created:", createdLead.lead.id);

    const leadId = createdLead.lead.id;

    // 2. Test Conversion (Positive)
    console.log("2. Testing Lead Conversion (Positive)...");
    const convertRes = await fetch(`http://localhost:4000/api/v1/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'Test positive notes',
        sentiment: 'POSITIVE',
        agentId,
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        appointmentPurpose: 'Test Followup'
      })
    });
    
    const converted = await convertRes.json();
    if (converted.sentiment !== 'POSITIVE') throw new Error("Conversion failed to return POSITIVE");
    console.log("✅ Lead Converted:", converted.lead.status);

    // 3. Verify Followup was created
    console.log("3. Verifying Follow-up Creation...");
    const followups = await prisma.leadFollowup.findMany({ where: { leadId } });
    if (followups.length === 0) throw new Error("Follow-up was not created");
    console.log("✅ Follow-up created successfully.");

    // Cleanup
    await prisma.leadFollowup.deleteMany({ where: { leadId } });
    await prisma.leadConversionLog.deleteMany({ where: { leadId } });
    await prisma.lead.delete({ where: { id: leadId } });
    console.log("✅ Cleanup successful.");
    
    console.log("=== API TESTS PASSED ===");
  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
