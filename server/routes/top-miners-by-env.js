import { query } from '../config/database.js';

/**
 * GET /api/top-miners-by-env?env=<environment_name>
 */
export default async function topMinersByEnvHandler(req, res) {
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
          AND ingested_at > NOW() - INTERVAL '14 days'
        GROUP BY hotkey
        HAVING COUNT(*) > 20
        ORDER BY AVG(score) DESC, COUNT(*) DESC
        LIMIT 5
      )
      SELECT
        DATE_TRUNC('day', ar.ingested_at)::date AS period,
        ar.hotkey,
        AVG(ar.score) AS average_score
      FROM
        public.affine_results ar
      WHERE
        ar.hotkey IN (SELECT hotkey FROM top_miners)
        AND ar.env_name = $1
        AND ar.ingested_at > NOW() - INTERVAL '30 days'
      GROUP BY
        period, ar.hotkey
      ORDER BY
        period ASC;
    `;

    const { rows } = await query(sql, [env]);

    console.log(`Top miners by env query for '${env}' returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      environment: env,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Top miners by env query error:', {
      error: err.message,
      env: env,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch top miners by environment data',
      timestamp: new Date().toISOString()
    });
  }
}