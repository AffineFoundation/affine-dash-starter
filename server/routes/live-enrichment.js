import { query } from '../config/database.js';

/**
 * POST /api/live-enrichment
 *
 * request body:
 * {
 *   "items": [
 *     { "uid": 123, "model": "gpt-4" },
 *     { "uid": 456, "model": "claude-3" }
 *   ]
 * }
 */
export default async function liveEnrichmentHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST method is supported',
      allowed_methods: ['POST']
    });
  }

  try {
    const { items } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid payload: expected { items: Array<{uid, model}> }',
        timestamp: new Date().toISOString()
      });
    }

    // 记录请求信息
    console.log(`Live enrichment request received with ${items.length} items`);

    // Sanitize and normalize inputs
    const tuples = [];
    for (const it of items) {
      if (!it) continue;
      const uid = Number(it.uid);
      let model = typeof it.model === 'string' ? it.model : String(it.model ?? '');
      model = model.trim();
      if (!Number.isFinite(uid) || !model) continue;
      tuples.push([uid, model]);
    }

    if (tuples.length === 0) {
      console.log('No valid items to enrich');
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Build a VALUES list with parameter placeholders safely
    // e.g. ( ($1::int,$2::text,$3::text), ($4::int,$5::text,$6::text), ... )
    const valuesClauses = [];
    const params = [];
    for (let i = 0; i < tuples.length; i++) {
      const base = i * 2;
      valuesClauses.push(`($${base + 1}::int, $${base + 2}::text)`);
      const [uid, model] = tuples[i];
      params.push(uid, model);
    }

    const sql = `
      WITH input(uid, model) AS (
        VALUES
          ${valuesClauses.join(',\n          ')}
      ),
      norm_input AS (
        SELECT DISTINCT lower(trim(model)) AS lmodel
        FROM input
      ),
      model_rows AS (
        SELECT ar.*
        FROM public.affine_results ar
        JOIN norm_input ni
          ON lower(trim(ar.model)) = ni.lmodel
      ),
      model_agg AS (
        SELECT
          lower(trim(model)) AS lmodel,
          NULL::text AS hotkey,
          COUNT(*) AS total_rollouts,
          AVG(score) * 100 AS overall_avg_score,
          (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
          AVG(latency_seconds) AS avg_latency,
          MAX(ingested_at) AS last_rollout_at,
          MAX((extra->'miner_chute'->>'chute_id')) AS chute_id
        FROM model_rows
        GROUP BY lower(trim(model))
      )
      SELECT
        i.uid,
        i.model,
        ma.hotkey,
        ma.total_rollouts,
        ma.overall_avg_score,
        ma.success_rate_percent,
        ma.avg_latency,
        ma.last_rollout_at,
        ma.chute_id
      FROM input i
      LEFT JOIN model_agg ma
        ON lower(trim(i.model)) = ma.lmodel;
    `;

    const { rows } = await query(sql, params);
    // rows: [{ uid, model, hotkey, total_rollouts, overall_avg_score, success_rate_percent, avg_latency, last_rollout_at, chute_id }]

    console.log(`Live enrichment processed ${tuples.length} input items, returned ${rows.length} enriched results`);

    return res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
      input_count: tuples.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Live enrichment error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to enrich live data',
      timestamp: new Date().toISOString()
    });
  }
}