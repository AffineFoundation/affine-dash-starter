import { query } from '../db.js';

async function getLatencyDistributionByEnv(req, res, next) {
  const env = (req.query?.env || req.query?.ENV || req.query?.e || '').toString().trim();
  if (!env) {
    return res.status(400).json({ message: 'Missing required query parameter: env' });
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
    res.status(200).json(rows);
  } catch (err) {
    console.error('latency-distribution-by-env query error:', err);
    next(err);
  }
}

export default getLatencyDistributionByEnv;

