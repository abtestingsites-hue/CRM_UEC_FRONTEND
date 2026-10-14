const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Redis = require('ioredis');

async function runTest() {
  console.log('--- STARTING INSTAGRAM PROFILE ENRICHMENT INTEGRATION TEST ---');
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('❌ ERROR: REDIS_URL not found in environment!');
    process.exit(1);
  }
  
  console.log('[Test] Connecting to Redis...');
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });

  redis.on('error', (err) => {
    console.error('[Test Redis Error]', err.message);
  });

  const testSenderId = '17841400000000000';
  const cacheKey = `ig_profile:${testSenderId}`;
  
  // 1. Seed Redis cache to bypass real Graph API request (useful for testing without Meta credentials)
  const mockProfile = {
    username: 'meta_verified_senior',
    profilePictureUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    id: testSenderId
  };
  
  console.log(`[Test] Pre-seeding Redis Cache at key: ${cacheKey}`);
  await redis.set(cacheKey, JSON.stringify(mockProfile), 'EX', 3600);
  
  // Delete customer if already exists from previous runs to ensure clean test
  const existingCustomer = await prisma.customer.findFirst({ where: { phone: testSenderId } });
  if (existingCustomer) {
    console.log(`[Test] Cleaning up old customer records for ID ${existingCustomer.id}`);
    await prisma.platformIdentity.deleteMany({ where: { customerId: existingCustomer.id } });
    await prisma.message.deleteMany({ where: { conversation: { customerId: existingCustomer.id } } });
    await prisma.conversation.deleteMany({ where: { customerId: existingCustomer.id } });
    await prisma.customer.delete({ where: { id: existingCustomer.id } });
  }

  // 2. Simulate incoming Meta Webhook payload
  const webhookPayload = {
    object: 'instagram',
    entry: [
      {
        id: '123456',
        time: Date.now(),
        messaging: [
          {
            sender: { id: testSenderId },
            recipient: { id: 'our_page_id' },
            timestamp: Date.now(),
            message: {
              mid: 'mid.' + Math.random().toString(36).substring(7),
              text: 'Hello from mock senior caregiver!'
            }
          }
        ]
      }
    ]
  };

  console.log('[Test] Triggering mock Meta webhook...');
  // We make a post using local request
  const response = await fetch('http://localhost:4000/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload)
  });

  if (!response.ok) {
    console.error(`[Test] Webhook failed with status ${response.status}`);
    await redis.quit();
    process.exit(1);
  }
  
  console.log(`[Test] Webhook responded with status: ${response.status}`);
  console.log('[Test] Waiting 5 seconds for queue processor to complete...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 3. Verify Database updates
  console.log('[Test] Querying DB for customer record...');
  const updatedCustomer = await prisma.customer.findFirst({
    where: { phone: testSenderId },
    include: { platformIdentities: true }
  });

  if (!updatedCustomer) {
    console.error('❌ FAILURE: Customer record was not created!');
    await redis.quit();
    process.exit(1);
  }

  console.log('[Test] DB Customer details:', {
    name: updatedCustomer.name,
    instagramUsername: updatedCustomer.instagramUsername,
    instagramProfilePic: updatedCustomer.instagramProfilePic,
    profileEnriched: updatedCustomer.profileEnriched,
    lastProfileSync: updatedCustomer.lastProfileSync,
    platformIdentities: updatedCustomer.platformIdentities
  });

  if (updatedCustomer.profileEnriched && updatedCustomer.name === '@meta_verified_senior') {
    console.log('✅ SUCCESS: Customer profile was successfully enriched from cache via NestJS processor!');
  } else {
    console.error('❌ FAILURE: Customer profile was not enriched. Check NestJS/Express console logs.');
  }

  await redis.quit();
  await prisma.$disconnect();
}

runTest().catch(err => {
  console.error('[Test] Test script crashed:', err);
  process.exit(1);
});
