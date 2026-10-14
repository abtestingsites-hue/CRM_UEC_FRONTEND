const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  const convos = await prisma.conversation.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const seen = new Set();
  const toDelete = [];

  for (const c of convos) {
    const key = c.customerId + '-' + c.channel;
    if (seen.has(key)) {
      toDelete.push(c.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    await prisma.message.deleteMany({ where: { conversationId: { in: toDelete } } });
    await prisma.aiSummary.deleteMany({ where: { conversationId: { in: toDelete } } });
    await prisma.conversation.deleteMany({ where: { id: { in: toDelete } } });
    console.log('Deleted duplicate conversations:', toDelete.length);
  } else {
    console.log('No duplicate conversations found');
  }

  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'asc' }});
  const seenPhone = new Set();
  const duplicateCustomers = [];
  for (const cust of customers) {
    if (cust.phone) {
      if (seenPhone.has(cust.phone)) {
         duplicateCustomers.push(cust.id);
      } else {
         seenPhone.add(cust.phone);
      }
    }
  }
  
  if (duplicateCustomers.length > 0) {
    await prisma.customerNote.deleteMany({ where: { customerId: { in: duplicateCustomers } }});
    await prisma.ticket.deleteMany({ where: { customerId: { in: duplicateCustomers } }});
    await prisma.callLog.deleteMany({ where: { customerId: { in: duplicateCustomers } }});
    await prisma.customer.deleteMany({ where: { id: { in: duplicateCustomers } }});
    console.log('Deleted duplicate customers:', duplicateCustomers.length);
  } else {
     console.log('No duplicate customers found');
  }
}

cleanup().then(() => prisma.$disconnect()).catch(console.error);
