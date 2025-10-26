import { Pool, QueryResult } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __affineDbPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis.__affineDbPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL env var is not set');
    }
    globalThis.__affineDbPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    globalThis.__affineDbPool.on('error', (err) => {
      console.error('Postgres pool error', err);
    });
  }
  return globalThis.__affineDbPool;
}

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<QueryResult<T>> {
  const client = getPool();
  return client.query<T>(text, params as any[]);
}
