const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function cleanup() {
  try {
    await prisma.user.delete({ where: { email: 'test@example.com' } });
    console.log('Cleaned up test agent');
  } catch(e) {
    console.error(e);
  }
}
cleanup().finally(() => prisma.$disconnect());
