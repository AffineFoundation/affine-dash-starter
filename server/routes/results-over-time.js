import { query } from '../config/database.js';

/**
 * GET /api/results-over-time
 */
export default async function resultsOverTimeHandler(req, res) {
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

    console.log(`Results over time query returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Results over time query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch results over time data',
      timestamp: new Date().toISOString()
    });
  }
}