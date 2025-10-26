import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { LiveEnrichmentRow } from '@/lib/types';

export const runtime = 'nodejs';

type PayloadItem = {
  uid: number | string;
  model: string;
};

type Payload = {
  items?: PayloadItem[];
};

const LIVE_ENRICHMENT_SQL = (
  valuesClauses: string,
) => `
  WITH input(uid, model) AS (
    VALUES
      ${valuesClauses}
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

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { message: 'Invalid JSON payload' },
      { status: 400 },
    );
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  const tuples: Array<[number, string]> = [];

  for (const item of items) {
    if (!item) continue;
    const uid = Number((item as PayloadItem).uid);
    let model = typeof item.model === 'string' ? item.model : String(item.model ?? '');
    model = model.trim();
    if (!Number.isFinite(uid) || !model) {
      continue;
    }
    tuples.push([uid, model]);
  }

  if (tuples.length === 0) {
    return NextResponse.json([]);
  }

  const placeholders: string[] = [];
  const params: Array<number | string> = [];
  tuples.forEach(([uid, model], index) => {
    const offset = index * 2;
    placeholders.push(`($${offset + 1}::int, $${offset + 2}::text)`);
    params.push(uid, model);
  });

  const sql = LIVE_ENRICHMENT_SQL(placeholders.join(',\n      '));

  try {
    const { rows } = await query<LiveEnrichmentRow>(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Live enrichment error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
