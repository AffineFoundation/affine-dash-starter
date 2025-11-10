import { query } from '../config/database.js';

/**
 * GET /api/gpu-market-share
 * Returns aggregated counts of unique, active miners per GPU configuration over the last 7 days.
 * Note: The 'gpus' field is a JSON-stringified array (or string) as stored in DB.
 */
export default async function gpuMarketShareHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET method is supported',
      allowed_methods: ['GET']
    });
  }

  try {
    // This query accurately calculates the number of unique miners per GPU type.
    const sql = `
      WITH latest_miner_config AS (
        -- This CTE gets the single, most recent record for each unique hotkey in the last 7 days.
        SELECT DISTINCT ON (hotkey)
          hotkey,
          extra -> 'miner_chute' -> 'node_selector' ->> 'supported_gpus' AS gpus
        FROM public.affine_results
        WHERE
          ingested_at > NOW() - INTERVAL '7 days'
          AND jsonb_path_exists(extra, '$.miner_chute.node_selector.supported_gpus')
        ORDER BY hotkey, ingested_at DESC -- The 'DISTINCT ON' will keep the first row it sees, which is the latest.
      )
      -- Now, we count the number of miners from this clean list for each GPU configuration.
      SELECT
        gpus,
        COUNT(*)::int as miner_count
      FROM latest_miner_config
      GROUP BY gpus
      ORDER BY miner_count DESC;
    `;

    const { rows } = await query(sql);

    console.log(`GPU market share query returned ${rows.length} rows`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('GPU market share query error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch GPU market share data',
      timestamp: new Date().toISOString()
    });
  }
}