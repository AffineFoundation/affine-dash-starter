import { query } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Dynamic route param: /api/live-env-leaderboard/[env]
  const envParam = (req.query?.env || '').toString().trim();
  if (!envParam) {
    return res.status(400).json({ message: 'Missing required path parameter: env' });
  }

  // Prefer sending uppercase to match DB values, but keep query exact as requested
  const env = envParam.toUpperCase();

  try {
    const sql = `
      -- Live leaderboard for a specific environment over the last 2 hours.
      WITH recent AS (
        SELECT *
        FROM public.affine_results
        WHERE env_name = $1
          AND ingested_at > NOW() - INTERVAL '2 hours'
      )
      SELECT
        r.hotkey,
        MAX(r.uid) AS last_seen_uid,
        r.model,
        r.revision,
        COUNT(*) AS total_rollouts,
        AVG(r.score) * 100 AS average_score,
        (SUM(CASE WHEN r.success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
        AVG(r.latency_seconds) AS avg_latency
      FROM recent r
      GROUP BY r.hotkey, r.model, r.revision
      ORDER BY average_score DESC, total_rollouts DESC
    `;
    const { rows } = await query(sql, [env]);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('live-env-leaderboard query error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
}
