const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const callFilter = {};
    const ticketFilter = { status: { not: 'RESOLVED' } };
    const conversationFilter = {};
    await prisma.callLog.count({ where: { ...callFilter, status: 'completed' } });
    await prisma.callLog.count({ where: { ...callFilter, status: 'in-progress' } });
    await prisma.queueItem.count({ where: { status: 'WAITING' } });
    await prisma.ticket.count({ where: ticketFilter });
    await prisma.conversation.aggregate({ where: conversationFilter, _sum: { unreadCount: true } });
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await prisma.callLog.findMany({ where: { ...callFilter, createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } });
    await prisma.aiSummary.findMany({ where: { conversation: conversationFilter } });
    await prisma.callLog.findMany({ where: callFilter, include: { customer: true }, orderBy: { createdAt: 'desc' }, take: 5 });
    await prisma.agent.findMany({ include: { user: true } });
    await prisma.ticket.findFirst({ where: { ...ticketFilter, priority: { in: ['HIGH', 'EMERGENCY'] } }, include: { customer: true }, orderBy: { createdAt: 'desc' } });
    console.log('ALL QUERIES SUCCESSFUL');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
