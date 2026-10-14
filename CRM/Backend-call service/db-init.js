const { Client } = require('pg');
require('dotenv').config({ path: './call-service/.env' });

const client = new Client({
  connectionString: process.env.DIRECT_URL ? process.env.DIRECT_URL.split('?')[0] : '',
  ssl: { rejectUnauthorized: false },
});

const runMigrations = async () => {
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");

    const sql = `
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        email TEXT,
        role TEXT,
        department TEXT,
        status TEXT,
        socket_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        phone TEXT UNIQUE,
        email TEXT,
        service_type TEXT,
        emergency_contact TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID,
        agent_id UUID,
        status TEXT,
        duration INTEGER,
        recording_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID,
        priority TEXT,
        department TEXT,
        assigned_agent UUID,
        status TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID,
        category TEXT,
        priority TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await client.query(sql);
    console.log("All tables created successfully.");

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
};

runMigrations();
