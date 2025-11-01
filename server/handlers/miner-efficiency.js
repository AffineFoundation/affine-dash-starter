import { query } from '../db.js';

async function getMinerEfficiency(req, res, next) {
  try {
    const sql = `
      -- This query calculates the average score and latency for each active miner.
      SELECT
          hotkey,
          model,
          AVG(score) AS avg_score,
          AVG(latency_seconds) AS avg_latency
      FROM
          public.affine_results
      WHERE
          -- Only consider recent data to reflect current miner efficiency.
          ingested_at > NOW() - INTERVAL '7 days'
      GROUP BY
          hotkey, model
      HAVING
          -- Filter out inactive miners to keep the plot clean.
          COUNT(*) > 50;
    `;
    const { rows } = await query(sql);
    res.status(200).json(rows);
  } catch (err) {
    console.error('miner-efficiency query error:', err);
    next(err);
  }
}

export default getMinerEfficiency;

