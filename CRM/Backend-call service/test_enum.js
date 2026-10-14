const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const c = await prisma.conversation.create({
      data: {
        customerId: "00000000-0000-0000-0000-000000000000", // Will fail with FK if not real, but we just want to see Enum error
        channel: 'INSTAGRAM',
        priority: 'NORMAL',
        unreadCount: 0
      }
    });
    console.log("Success");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
