const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const coimbatoreAreas = [
  'R.S. Puram, Coimbatore',
  'Peelamedu, Coimbatore',
  'Gandhipuram, Coimbatore',
  'Vadavalli, Coimbatore',
  'Singanallur, Coimbatore',
  'Saravanampatti, Coimbatore',
  'Race Course, Coimbatore',
  'Saibaba Colony, Coimbatore',
  'Thudiyalur, Coimbatore',
  'Ramanathapuram, Coimbatore'
];

const tamilNames = [
  'Karthik S.', 'Divya R.', 'Subramaniam V.', 'Meenakshi N.',
  'Ramesh K.', 'Lakshmi M.', 'Senthil Kumar', 'Kavitha P.',
  'Balaji D.', 'Priya G.', 'Murugan A.', 'Saraswathi L.',
  'Prakash T.', 'Nandhini B.', 'Arun M.'
];

function generatePhone() {
  const prefixes = ['94433', '98422', '98940', '99444'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `+91${prefix}${suffix}`;
}

async function seedData() {
  console.log("Seeding Coimbatore Data...");

  // Generate 15 Leads
  let createdLeads = 0;
  for (let i = 0; i < 15; i++) {
    const name = tamilNames[i % tamilNames.length];
    const phone = generatePhone();
    const city = coimbatoreAreas[i % coimbatoreAreas.length];
    
    try {
      await prisma.lead.create({
        data: {
          customerName: name,
          phoneNumber: phone,
          email: `${name.split(' ')[0].toLowerCase()}@gmail.com`,
          serviceInterest: i % 2 === 0 ? 'Elderly Care' : 'Home Service',
          city: city,
          notes: `Interested in packages. Resident of ${city}.`,
          source: 'Local Campaign',
          status: 'NEW',
          priority: i % 3 === 0 ? 'HIGH' : 'NORMAL'
        }
      });
      createdLeads++;
    } catch (e) {
      if (e.code === 'P2002') continue; // Unique constraint failed on phone, skip
      console.error(e);
    }
  }

  console.log(`Created ${createdLeads} Leads.`);

  // Generate 10 Customers
  let createdCustomers = 0;
  for (let i = 0; i < 10; i++) {
    const name = tamilNames[(i + 5) % tamilNames.length];
    const phone = generatePhone();
    
    try {
      await prisma.customer.create({
        data: {
          name: name,
          phone: phone,
          email: `${name.split(' ')[0].toLowerCase()}@yahoo.co.in`,
          emergencyContact: generatePhone()
        }
      });
      createdCustomers++;
    } catch (e) {
      if (e.code === 'P2002') continue;
      console.error(e);
    }
  }

  console.log(`Created ${createdCustomers} Customers.`);
  
  await prisma.$disconnect();
  console.log("Seeding complete!");
}

seedData();
