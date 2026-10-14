const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Super Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@eldercare.com',
      passwordHash: 'hashed_password_placeholder',
      role: 'SUPER_ADMIN',
      agentProfile: {
        create: {
          name: 'Super Admin',
          department: 'Management',
          status: 'AVAILABLE'
        }
      }
    }
  });

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Martha Kent',
      phone: '+15550192831',
      email: 'martha@example.com',
      emergencyContact: '+15559876543',
      notes: {
        create: { content: 'Requires wheelchair assistance. Severe allergy to penicillin. Diabetic.' }
      },
      servicePlans: {
        create: { planType: 'Premium Home Care', startDate: new Date() }
      }
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Robert Bruce',
      phone: '+15551234567',
      email: 'robert@example.com',
      notes: {
        create: { content: 'Needs weekly nurse visits.' }
      }
    }
  });

  // Create Conversations & Messages
  const conv1 = await prisma.conversation.create({
    data: {
      customerId: customer1.id,
      channel: 'VOICE',
      priority: 'EMERGENCY',
      status: 'OPEN',
      unreadCount: 1,
      messages: {
        create: [
          { senderType: 'SYSTEM', content: 'Incoming WebRTC Call from Martha Kent.', status: 'DELIVERED' }
        ]
      },
      aiSummary: {
        create: {
          summaryText: 'Caller has repeatedly requested rescheduling of the home nurse. Recommended to escalate to supervisor if not resolved today.',
          sentimentScore: 'Frustrated',
          riskLevel: 'HIGH'
        }
      }
    }
  });

  const conv2 = await prisma.conversation.create({
    data: {
      customerId: customer2.id,
      channel: 'WHATSAPP',
      priority: 'NORMAL',
      status: 'OPEN',
      unreadCount: 2,
      messages: {
        create: [
          { senderType: 'CUSTOMER', content: 'Hi, I need help with my care plan.', status: 'READ' },
          { senderType: 'AGENT', content: 'Hello Robert, how can I assist you today?', status: 'READ' },
          { senderType: 'CUSTOMER', content: 'Can I reschedule my home visit?', status: 'DELIVERED' }
        ]
      }
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
