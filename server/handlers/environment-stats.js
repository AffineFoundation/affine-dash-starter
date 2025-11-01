import { query } from '../db.js';

async function getEnvironmentStats(req, res, next) {
  try {
    const sql = `
      -- This query aggregates stats for each environment.
      SELECT
          env_name,
          COUNT(*) AS total_rollouts,
          AVG(score) * 100 AS success_rate
      FROM
          public.affine_results
      GROUP BY
          env_name
      ORDER BY
          total_rollouts DESC;
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error('environment-stats query error:', err);
    next(err);
  }
}

export default getEnvironmentStats;

