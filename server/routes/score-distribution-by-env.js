import { query } from '../config/database.js';

/**
 * GET /api/score-distribution-by-env?env=<environment_name>
 */
export default async function scoreDistributionByEnvHandler(req, res) {
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
      WITH miner_scores AS (
        SELECT
          hotkey,
          AVG(score) as avg_score
        FROM public.affine_results
        WHERE
          env_name = $1
          AND ingested_at > NOW() - INTERVAL '14 days'
        GROUP BY hotkey
        HAVING COUNT(*) > 20
      )
      SELECT
        width_bucket(avg_score, 0.0, 1.0, 10) AS score_bucket,
        COUNT(*) AS number_of_miners
      FROM miner_scores
      GROUP BY score_bucket
      ORDER BY score_bucket ASC;
    `;

    const { rows } = await query(sql, [env]);

    console.log(`Score distribution by env query for '${env}' returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      environment: env,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Score distribution by env query error:', {
      error: err.message,
      env: env,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch score distribution by environment data',
      timestamp: new Date().toISOString()
    });
  }
}