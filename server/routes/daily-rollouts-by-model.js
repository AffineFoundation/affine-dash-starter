import { query } from '../config/database.js';

/**
 * GET /api/daily-rollouts-by-model
 */
export default async function dailyRolloutsByModelHandler(req, res) {
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

    // 记录成功日志
    console.log(`Daily rollouts by model query returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Daily rollouts by model query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch daily rollouts by model data',
      timestamp: new Date().toISOString()
    });
  }
}