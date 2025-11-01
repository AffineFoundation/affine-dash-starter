import { query } from '../db.js';

async function getPerformanceByEnv(req, res, next) {
  try {
    const sql = `
      SELECT
        env_name,
        COUNT(*) as total_rollouts,
        AVG(score) as average_score,
        (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent
      FROM
        public.affine_results
      GROUP BY
        env_name
      ORDER BY
        average_score DESC;
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Performance-by-env query error:', err);
    next(err);
  }
}

export default getPerformanceByEnv;

