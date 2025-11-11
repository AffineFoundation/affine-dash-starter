const { query } = require('../config/database.cjs');

async function subnetOverviewHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const sql = `
      SELECT
        hotkey,
        model,
        MAX(revision) AS rev,
        MAX(uid) AS uid,
        MAX((extra->'miner_chute'->>'chute_id')) AS chute_id,
        AVG(CASE WHEN env_name = 'SAT' THEN score END) AS sat,
        AVG(CASE WHEN env_name = 'ABD' THEN score END) AS abd,
        AVG(CASE WHEN env_name = 'DED' THEN score END) AS ded,
        AVG(CASE WHEN env_name = 'ELR' THEN score END) AS elr,
        COUNT(*) >= 50 AS eligible,
        AVG(score) AS overall_avg_score,
        (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
        AVG(latency_seconds) AS avg_latency,
        COUNT(*) AS total_rollouts,
        MAX(ingested_at) AS last_rollout_at
      FROM public.affine_results
      GROUP BY hotkey, model
      ORDER BY overall_avg_score DESC NULLS LAST, total_rollouts DESC;
    `;
    const { rows } = await query(sql);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Subnet overview query error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
}

module.exports = subnetOverviewHandler;