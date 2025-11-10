import { query } from '../config/database.js';

/**
 * GET /api/live-env-leaderboard/:env
 */
export default async function liveEnvLeaderboardHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET method is supported',
      allowed_methods: ['GET']
    });
  }

  const envParam = (req.params?.env || '').toString().trim();
  if (!envParam) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required path parameter: env',
      timestamp: new Date().toISOString()
    });
  }

  const env = envParam.toUpperCase();

  try {
    const sql = `
      -- This query creates a live leaderboard for a specific environment.
      WITH
        -- Step 1: Identify the hotkeys of miners who are currently "live"
        -- (active in the target environment in the last 3.69 hours).
        live_miners AS (
          SELECT DISTINCT hotkey
          FROM public.affine_results
          WHERE env_name = $1
            AND ingested_at > NOW() - INTERVAL '3 hours 41 minutes 24 seconds'
        )

      -- Step 2: Calculate performance metrics for these live miners, but only for the
      -- specific environment we are interested in (passed as a parameter $1).
      SELECT
          ar.hotkey,
          MAX(ar.uid) AS last_seen_uid,
          ar.model,
          ar.revision,
          COUNT(*) AS total_rollouts,
          AVG(ar.score) * 100 AS average_score,
          (SUM(CASE WHEN ar.success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
          AVG(ar.latency_seconds) as avg_latency
      FROM
          public.affine_results ar
      WHERE
          -- Filter for the specific environment (e.g., 'SAT', 'DED')
          ar.env_name = $1
          -- Only include miners who are in our "live" set
          AND ar.hotkey IN (SELECT hotkey FROM live_miners)
          -- Calculate their performance over a stable 24-hour window
          AND ar.ingested_at > NOW() - INTERVAL '24 hours'
      GROUP BY
          ar.hotkey, ar.model, ar.revision
      ORDER BY
          average_score DESC, total_rollouts DESC
    `;

    const { rows } = await query(sql, [env]);

    console.log(`Live environment leaderboard for '${env}' returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      environment: env,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Live environment leaderboard query error:', {
      error: err.message,
      environment: env,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch live environment leaderboard data',
      environment: env,
      timestamp: new Date().toISOString()
    });
  }
}