const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const res = await prisma.$queryRaw`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'User'`;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
check().finally(() => prisma.$disconnect());
