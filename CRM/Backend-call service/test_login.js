const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function test() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'Raghav@uec.com' },
      include: { agentProfile: true }
    });
    if (!user) return console.log('no user');
    const isValid = await bcrypt.compare('raghav@UEC', user.passwordHash);
    console.log('isValid:', isValid);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
