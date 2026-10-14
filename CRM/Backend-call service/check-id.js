const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const barani = await prisma.agent.findFirst({ where: { name: { contains: "Barani" } } });
  const userBarani = await prisma.user.findFirst({ where: { id: barani.userId } });
  
  console.log("Barani Agent ID:", barani.id);
  console.log("Barani User ID:", userBarani.id);
  
  await prisma.$disconnect();
}

check();
