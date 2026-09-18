import { Pool } from 'pg';

let pool: Pool | undefined;

export function getDb() {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Adjust SSL settings based on the hosting provider (often required in production, e.g., Neon/Supabase)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  return pool;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const db = getDb();
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

export async function getClient() {
  const db = getDb();
  const client = await db.connect();
  return client;
}
