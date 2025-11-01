import { query } from '../db.js';

async function getResultsOverTime(req, res, next) {
  try {
    const sql = `
      SELECT
        DATE_TRUNC('DAY', ingested_at) AS period,
        COUNT(*) AS total_rollouts,
        AVG(score) AS average_score
      FROM
        public.affine_results
      WHERE
        ingested_at > NOW() - INTERVAL '30 days'
      GROUP BY
        period
      ORDER BY
        period ASC;
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Results-over-time query error:', err);
    next(err);
  }
}

export default getResultsOverTime;

