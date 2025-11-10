import { query } from '../config/database.js';

/**
 * GET /api/miner-efficiency
 */
export default async function minerEfficiencyHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET method is supported',
      allowed_methods: ['GET']
    });
  }

  try {
    // This query calculates the average score and latency for each active miner.
    const sql = `
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

    console.log(`Miner efficiency query returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Miner efficiency query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch miner efficiency data',
      timestamp: new Date().toISOString()
    });
  }
}