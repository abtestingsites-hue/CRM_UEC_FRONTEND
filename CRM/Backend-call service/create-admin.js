const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Upserting Super Admin...');

  const admin = await prisma.user.upsert({
    where: { email: 'Raghav@uec.com' },
    update: {
      passwordHash: 'raghav@UEC',
      role: 'SUPER_ADMIN',
      agentProfile: {
        update: {
          name: 'Raghav',
          department: 'Management',
          status: 'AVAILABLE'
        }
      }
    },
    create: {
      email: 'Raghav@uec.com',
      passwordHash: 'raghav@UEC',
      role: 'SUPER_ADMIN',
      agentProfile: {
        create: {
          name: 'Raghav',
          department: 'Management',
          status: 'AVAILABLE'
        }
      }
    }
  });

  console.log('Super Admin upserted successfully:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
