import { query } from '../config/database.js';

/**
 * GET /api/latency-distribution-by-env?env=<environment_name>
 */
export default async function latencyDistributionByEnvHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET method is supported',
      allowed_methods: ['GET']
    });
  }

  const env = (req.query?.env || req.query?.ENV || req.query?.e || '').toString().trim();
  if (!env) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required query parameter: env',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const sql = `
      WITH top_miners AS (
        SELECT hotkey
        FROM public.affine_results
        WHERE
          env_name = $1
          AND ingested_at > NOW() - INTERVAL '7 days'
        GROUP BY hotkey
        ORDER BY COUNT(*) DESC
        LIMIT 10
      )
      SELECT
        hotkey,
        latency_seconds
      FROM
        public.affine_results
      WHERE
        hotkey IN (SELECT hotkey FROM top_miners)
        AND env_name = $1
        AND ingested_at > NOW() - INTERVAL '7 days';
    `;

    const { rows } = await query(sql, [env]);

    console.log(`Latency distribution by env query for '${env}' returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      environment: env,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Latency distribution by env query error:', {
      error: err.message,
      env: env,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch latency distribution by environment data',
      timestamp: new Date().toISOString()
    });
  }
}