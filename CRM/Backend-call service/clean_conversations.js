const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  console.log("Deleted all conversations and messages to allow Prisma db push");
}
main().catch(console.error).finally(() => prisma.$disconnect());
