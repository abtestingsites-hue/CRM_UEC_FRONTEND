const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const coimbatoreSummaries = [
  {
    summary: "Customer from R.S. Puram inquired about 24/7 in-home nursing for their elderly father. They requested a callback tomorrow with pricing details.",
    sentiment: "POSITIVE",
    escalationRisk: "LOW",
    recommendations: "Send pricing brochure and call back tomorrow morning."
  },
  {
    summary: "Called the lead in Peelamedu regarding physiotherapy sessions. They are interested but find the current pricing slightly high. Negotiating a package deal.",
    sentiment: "NEUTRAL",
    escalationRisk: "MEDIUM",
    recommendations: "Offer a 10% discount if they book a monthly package."
  },
  {
    summary: "Customer in Gandhipuram was unhappy with the delayed arrival of the nurse yesterday due to traffic. Assured them it won't happen again.",
    sentiment: "NEGATIVE",
    escalationRisk: "HIGH",
    recommendations: "Assign a nurse closer to Gandhipuram to avoid transit delays."
  },
  {
    summary: "Followed up with lead in Vadavalli. They confirmed they want to start the elderly companion service from next Monday.",
    sentiment: "POSITIVE",
    escalationRisk: "LOW",
    recommendations: "Finalize the contract and assign an agent by Friday."
  },
  {
    summary: "Inquiry from Singanallur for post-operative care. Explained the available plans. Customer is comparing with another agency.",
    sentiment: "NEUTRAL",
    escalationRisk: "LOW",
    recommendations: "Follow up in 2 days to check their decision."
  }
];

async function seedCalls() {
  console.log("Seeding Coimbatore Call Logs and Summaries...");

  // Get some customers
  const customers = await prisma.customer.findMany({ take: 10 });
  if (customers.length === 0) {
    console.error("No customers found! Run the previous seed script first.");
    return;
  }

  // Get some agents
  const agents = await prisma.agent.findMany({ take: 3 });
  if (agents.length === 0) {
    console.warn("No agents found, call logs will not be assigned to specific agents.");
  }

  let createdLogs = 0;

  for (let i = 0; i < 15; i++) {
    const customer = customers[i % customers.length];
    const agent = agents.length > 0 ? agents[i % agents.length] : null;
    const summaryData = coimbatoreSummaries[i % coimbatoreSummaries.length];
    
    const callSid = `webrtc_coimbatore_${Date.now()}_${i}`;
    const direction = i % 2 === 0 ? 'INBOUND' : 'OUTBOUND';
    const duration = Math.floor(Math.random() * 300) + 60; // 1 to 6 minutes
    
    // Create Call Log
    const callLog = await prisma.callLog.create({
      data: {
        customerId: customer.id,
        agentId: agent ? agent.id : null,
        exotelCallSid: callSid,
        status: 'ENDED',
        duration: duration,
        recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Dummy audio
        direction: direction,
        // Make dates slightly in the past
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Create AI Summary Note
    await prisma.customerNote.create({
      data: {
        customerId: customer.id,
        createdBy: agent ? agent.id : null,
        content: `[Call: ${callSid}] AI Call Summary: ${JSON.stringify(summaryData)}`,
      }
    });

    createdLogs++;
  }

  console.log(`Created ${createdLogs} Call Logs with AI Summaries.`);
  
  await prisma.$disconnect();
  console.log("Call Seeding complete!");
}

seedCalls();
