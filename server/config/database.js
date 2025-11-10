import { Pool } from 'pg';

// global connection pool instance (singleton pattern)
// adapted for PM2 cluster mode, sharing the connection pool between multiple processes
let pool = null;

/**
 * get or initialize the global database connection pool
 * adapted for PM2 cluster mode, from 5 connections to 20 connections
 */
export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('Initializing database connection pool...');

    pool = new Pool({
      connectionString,
      // AWS RDS PostgreSQL requires SSL; in server environment, it can be safely set rejectUnauthorized: false
      ssl: {
        rejectUnauthorized: false,
        // more strict SSL configuration (optional)
        // sslmode: 'require'
      },

      // optimized connection pool configuration (from Serverless 5 to 20)
      max: 20,                           // maximum number of connections
      min: 2,                            // minimum number of connections, keep some warm connections
      idleTimeoutMillis: 30000,          // idle connection timeout: 30 seconds
      connectionTimeoutMillis: 10000,    // connection timeout: 10 seconds

      // additional connection pool optimization
      acquireTimeoutMillis: 60000,       // acquire connection timeout: 60 seconds
      createTimeoutMillis: 30000,        // create connection timeout: 30 seconds
      destroyTimeoutMillis: 5000,        // destroy connection timeout: 5 seconds
      reapIntervalMillis: 1000,          // reap interval: 1 second
      createRetryIntervalMillis: 100,    // create connection retry interval: 100ms
    });

    // connection pool event listeners
    pool.on('connect', () => {
      console.log('New database connection established');
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    pool.on('acquire', () => {
      // in debug mode, can record connection acquisition
      if (process.env.NODE_ENV === 'development') {
        console.log('Database connection acquired');
      }
    });

    pool.on('remove', () => {
      console.log('Database connection removed');
    });

    // graceful shutdown handler
    process.on('beforeExit', async () => {
      if (pool) {
        console.log('Closing database connection pool...');
        await pool.end();
        pool = null;
      }
    });
  }
  return pool;
}

/**
 * helper function to execute database queries
 * @param {string} text - SQL query statement
 * @param {Array} params - query parameters
 * @returns {Promise<Object>} query result
 */
export async function query(text, params = []) {
  const startTime = Date.now();
  const p = getPool();

  try {
    const result = await p.query(text, params);
    const duration = Date.now() - startTime;

    // in development mode, record query performance
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query executed in ${duration}ms, rows returned: ${result.rowCount}`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query failed after ${duration}ms:`, {
      error: error.message,
      sql: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      params: params.length > 0 ? params : undefined
    });
    throw error;
  }
}

/**
 * get connection pool status information
 * @returns {Object} connection pool status
 */
export function getPoolStatus() {
  if (!pool) {
    return { status: 'not_initialized' };
  }

  return {
    status: 'initialized',
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

/**
 * health check function
 * @returns {Promise<boolean>} database connection is healthy
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT 1 as health_check');
    return result.rowCount > 0;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

export default {
  getPool,
  query,
  getPoolStatus,
  healthCheck
};