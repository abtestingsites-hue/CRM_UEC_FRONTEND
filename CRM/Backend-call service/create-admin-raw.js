const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
  console.log('Upserting Super Admin via Raw SQL...');

  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'Raghav@uec.com';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'raghav@uec.com';

  const existingUser = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${adminEmail}`;
  
  let userId;

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    console.log('User exists, updating password...');
    await prisma.$executeRaw`UPDATE "User" SET "passwordHash" = ${adminPassword}, "role" = 'SUPER_ADMIN' WHERE id = ${userId}::uuid`;
    
    const existingAgent = await prisma.$queryRaw`SELECT * FROM "Agent" WHERE "userId" = ${userId}::uuid`;
    if (existingAgent.length > 0) {
      await prisma.$executeRaw`UPDATE "Agent" SET "name" = 'Raghav' WHERE "userId" = ${userId}::uuid`;
    } else {
      await prisma.$executeRaw`INSERT INTO "Agent" (id, "userId", name, status, "updatedAt") VALUES (gen_random_uuid(), ${userId}::uuid, 'Raghav', 'AVAILABLE', NOW())`;
    }
  } else {
    console.log('Creating new user...');
    const id = require('crypto').randomUUID();
    userId = id;
    await prisma.$executeRaw`INSERT INTO "User" (id, email, "passwordHash", role, "updatedAt") VALUES (${id}::uuid, ${adminEmail}, ${adminPassword}, 'SUPER_ADMIN', NOW())`;
    
    await prisma.$executeRaw`INSERT INTO "Agent" (id, "userId", name, status, "updatedAt") VALUES (gen_random_uuid(), ${id}::uuid, 'Raghav', 'AVAILABLE', NOW())`;
  }

  console.log('Super Admin configured successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
