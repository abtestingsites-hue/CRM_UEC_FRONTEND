const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.callLog.findMany({ where: { direction: 'OUTBOUND' }});
  console.log(logs.length, 'outbound logs found');
  await prisma.callLog.deleteMany({ where: { direction: 'OUTBOUND' }});
  console.log('Deleted outbound records');
  await prisma.$disconnect();
}
run();
