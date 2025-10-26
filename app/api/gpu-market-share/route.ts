import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { GpuMarketShareRow } from '@/lib/types';

export const runtime = 'nodejs';

const GPU_MARKET_SHARE_SQL = `
  WITH latest_miner_config AS (
    SELECT DISTINCT ON (hotkey)
      hotkey,
      extra -> 'miner_chute' -> 'node_selector' ->> 'supported_gpus' AS gpus
    FROM public.affine_results
    WHERE
      ingested_at > NOW() - INTERVAL '7 days'
      AND jsonb_path_exists(extra, '$.miner_chute.node_selector.supported_gpus')
    ORDER BY hotkey, ingested_at DESC
  )
  SELECT
    gpus,
    COUNT(*)::int AS miner_count
  FROM latest_miner_config
  GROUP BY gpus
  ORDER BY miner_count DESC;
`;

export async function GET() {
  try {
    const { rows } = await query<GpuMarketShareRow>(GPU_MARKET_SHARE_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('gpu-market-share query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
