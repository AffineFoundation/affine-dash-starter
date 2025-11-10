import { query } from '../config/database.js';

/**
 * GET /api/activity
 */
export default async function activityHandler(req, res) {
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
        ingested_at,
        hotkey,
        uid,
        model,
        env_name,
        score,
        success
      FROM public.affine_results
      ORDER BY ingested_at DESC
      LIMIT 10;
    `;

    const { rows } = await query(sql);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Activity query error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch activity data',
      timestamp: new Date().toISOString()
    });
  }
}