const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  const custs = await prisma.customer.findMany({ where: { phone: { in: ['17841400000000000', '1506298557957662', '1489331312567409', '1920612218643451', '12334'] } } });
  for (const cust of custs) {
     const convs = await prisma.conversation.findMany({ where: { customerId: cust.id } });
     for (const c of convs) {
       await prisma.message.deleteMany({ where: { conversationId: c.id } });
       await prisma.aiSummary.deleteMany({ where: { conversationId: c.id } });
     }
     await prisma.conversation.deleteMany({ where: { customerId: cust.id } });
     await prisma.customer.delete({ where: { id: cust.id } });
     console.log('Deleted mock customer', cust.phone);
  }
}
clean().then(() => process.exit(0)).catch(console.error);
