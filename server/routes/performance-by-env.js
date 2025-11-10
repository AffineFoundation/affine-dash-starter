import { query } from '../config/database.js';

/**
 * GET /api/performance-by-env
 */
export default async function performanceByEnvHandler(req, res) {
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

    console.log(`Performance by env query returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Performance by env query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch performance data by environment',
      timestamp: new Date().toISOString()
    });
  }
}