const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Forcing all raghav users to SUPER_ADMIN...');
  const users = await prisma.user.findMany();
  let count = 0;
  for (const u of users) {
    if (u.email.toLowerCase().includes('raghav')) {
      await prisma.user.update({
        where: { id: u.id },
        data: { role: 'SUPER_ADMIN' }
      });
      console.log(`Updated user ${u.email} to SUPER_ADMIN`);
      count++;
    }
  }
  console.log(`Finished updating ${count} users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
