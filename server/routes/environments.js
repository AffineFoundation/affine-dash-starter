import { query } from '../config/database.js';

/**
 * GET /api/environments
 */
export default async function environmentsHandler(req, res) {
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
    // This query gets a distinct, sorted list of all recently active environments.
    const sql = `
      SELECT DISTINCT env_name
      FROM public.affine_results
      WHERE ingested_at > NOW() - INTERVAL '30 days' -- Match subnet-overview window so columns always align
      ORDER BY env_name ASC;
    `;

    const { rows } = await query(sql);
    const envs = rows.map(r => r.env_name);

    // 记录成功日志
    console.log(`Environments query returned ${envs.length} environments`);

    return res.status(200).json({
      success: true,
      data: envs,
      count: envs.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Environments query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch environments data',
      timestamp: new Date().toISOString()
    });
  }
}