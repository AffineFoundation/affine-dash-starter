import { query } from '../config/database.js';

/**
 * GET /api/environment-stats
 */
export default async function environmentStatsHandler(req, res) {
  // 验证请求方法
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET method is supported',
      allowed_methods: ['GET']
    });
  }

  try {
    // This query aggregates stats for each environment.
    const sql = `
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

    // 记录成功日志
    console.log(`Environment stats query returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Environment stats query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch environment statistics data',
      timestamp: new Date().toISOString()
    });
  }
}