import { query } from '../config/database.js';

/**
 * GET /api/leaderboard
 */
export default async function leaderboardHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET method is supported',
      allowed_methods: ['GET']
    });
  }

  try {
    const sql = `
      SELECT
        hotkey,
        MAX(uid) AS last_seen_uid,
        model,
        MAX((extra->'miner_chute'->>'chute_id')) AS chute_id,
        COUNT(*) AS total_rollouts,
        AVG(score) AS average_score,
        (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
        AVG(latency_seconds) as avg_latency
      FROM public.affine_results
      GROUP BY hotkey, model
      ORDER BY average_score DESC, total_rollouts DESC
      LIMIT 20;
    `;

    const { rows } = await query(sql);

    console.log(`Leaderboard query returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Leaderboard query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch leaderboard data',
      timestamp: new Date().toISOString()
    });
  }
}