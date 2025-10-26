import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { AdvancedInsightRow } from '@/lib/types';

export const runtime = 'nodejs';

const ADVANCED_INSIGHTS_SQL = `
  SELECT
    hotkey,
    model,
    MAX((extra->'miner_chute'->>'chute_id')) AS chute_id,
    MAX((extra->'miner_chute'->>'template')) AS template,
    MAX((extra->'miner_chute'->'node_selector'->>'supported_gpus')) AS gpus,
    AVG(
      (
        (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'input' ->> 'usd')::double precision
        +
        (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'output' ->> 'usd')::double precision
      ) / 2.0
    ) AS cost_per_hour,
    AVG(score) AS score
  FROM public.affine_results
  WHERE ingested_at > NOW() - INTERVAL '7 days'
  GROUP BY hotkey, model
  ORDER BY score DESC NULLS LAST
  LIMIT 200;
`;

export async function GET() {
  try {
    const { rows } = await query<AdvancedInsightRow>(ADVANCED_INSIGHTS_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('advanced-insights query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
