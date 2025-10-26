import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { MinerEfficiencyCostRow } from '@/lib/types';

export const runtime = 'nodejs';

const MINER_EFFICIENCY_COST_SQL = `
  SELECT
      hotkey,
      model,
      AVG(score)::double precision AS avg_score,
      AVG(
          (
              (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'input' ->> 'usd')::double precision
              +
              (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'output' ->> 'usd')::double precision
          ) / 2.0
      )::double precision AS avg_token_cost_usd
  FROM public.affine_results
  WHERE
      ingested_at > NOW() - INTERVAL '7 days'
      AND jsonb_path_exists(extra, '$.miner_chute.current_estimated_price.per_million_tokens.input.usd')
      AND jsonb_path_exists(extra, '$.miner_chute.current_estimated_price.per_million_tokens.output.usd')
      AND (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'input' ->> 'usd') IS NOT NULL
      AND (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'output' ->> 'usd') IS NOT NULL
  GROUP BY hotkey, model
  HAVING
      COUNT(*) > 20
      AND AVG(
          (
              (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'input' ->> 'usd')::double precision
              +
              (extra -> 'miner_chute' -> 'current_estimated_price' -> 'per_million_tokens' -> 'output' ->> 'usd')::double precision
          ) / 2.0
      ) > 0
  ORDER BY hotkey;
`;

export async function GET() {
  try {
    const { rows } = await query<MinerEfficiencyCostRow>(MINER_EFFICIENCY_COST_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('miner-efficiency-cost query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
