const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const agents = await prisma.agent.findMany({ where: { name: 'Unknown' } });
    for (const a of agents) {
      await prisma.user.delete({ where: { id: a.userId } });
    }
    console.log('Deleted fake users');
  } catch (err) {
    console.error("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
