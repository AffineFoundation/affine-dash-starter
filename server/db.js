import { Pool } from 'pg';

// Singleton Postgres connection pool for server environment
// Reuses connections across requests.
let pool;

/**
 * Get or initialize the global Pool instance.
 */
export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL env var is not set. Configure it in environment variables.');
    }

    pool = new Pool({
      connectionString,
      // RDS requires SSL; rejectUnauthorized false for simplicity.
      ssl: { rejectUnauthorized: false },
      // Increased pool settings for server environment
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    pool.on('error', (err) => {
      console.error('Postgres pool error', err);
    });
  }
  return pool;
}

/**
 * Helper to run a query with optional params.
 */
export async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}
