const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Delete test conversations that were made under 'CHAT' but are actually Meta users
    const customers = await prisma.customer.findMany({
      where: { name: { startsWith: 'INSTAGRAM' } }
    });

    for (const c of customers) {
      // Find old chat conversations
      const oldConvs = await prisma.conversation.findMany({
        where: { customerId: c.id, channel: 'CHAT' }
      });
      
      for (const oc of oldConvs) {
        await prisma.message.deleteMany({ where: { conversationId: oc.id } });
        await prisma.conversation.delete({ where: { id: oc.id } });
        console.log('Deleted legacy duplicate CHAT conversation:', oc.id);
      }
    }
    console.log('Cleanup complete');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
