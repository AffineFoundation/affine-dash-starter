const { Pool } = require('pg');

// Singleton Postgres connection pool for Express server environment
// Optimized for PM2 cluster mode with shared connections
let pool = null;

/**
 * Get or initialize the global Pool instance.
 */
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const isSslEnabled = process.env.POSTGRES_SSL_ENABLED !== 'false';

    pool = new Pool({
      connectionString,
      // RDS requires SSL; rejectUnauthorized false for simplicity
      ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
      // Optimized pool settings for PM2 cluster mode
      max: 20, // Increased from 5 to support multiple processes
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    pool.on('error', (err) => {
      console.error('Postgres pool error:', err);
    });

    pool.on('connect', () => {
      console.log('New database connection established');
    });

    console.log('Database connection pool initialized with max connections:', pool.options.max);
  }
  return pool;
}

/**
 * Helper to run a query with optional params.
 */
async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}

/**
 * Graceful shutdown for database connections
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

// Handle process shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await closePool();
  process.exit(0);
});

module.exports = { getPool, query, closePool };