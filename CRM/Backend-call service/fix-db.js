const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDb() {
  try {
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "firstName" DROP NOT NULL;`;
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;`;
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "unitId" DROP NOT NULL;`;
    await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "isActive" DROP NOT NULL;`;
    console.log('Successfully dropped NOT NULL constraints');
  } catch (err) {
    console.error('Failed to fix database:', err.message);
  }
}

fixDb().finally(() => prisma.$disconnect());
