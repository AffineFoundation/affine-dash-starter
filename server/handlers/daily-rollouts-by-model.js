import { query } from '../db.js';

async function getDailyRolloutsByModel(req, res, next) {
  try {
    const sql = `
      SELECT
        DATE_TRUNC('day', ingested_at)::date AS day,
        model,
        COUNT(*) AS daily_rollouts
      FROM
        public.affine_results
      WHERE
        ingested_at > NOW() - INTERVAL '7 days'
        AND model IN (
          SELECT model
          FROM public.affine_results
          GROUP BY model
          ORDER BY COUNT(*) DESC
          LIMIT 5
        )
      GROUP BY
        day, model
      ORDER BY
        day DESC, daily_rollouts DESC;
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Daily-rollouts-by-model query error:', err);
    next(err);
  }
}

export default getDailyRolloutsByModel;

