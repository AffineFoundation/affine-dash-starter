import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { MinerEfficiencyRow } from '@/lib/types';

export const runtime = 'nodejs';

const MINER_EFFICIENCY_SQL = `
  SELECT
      hotkey,
      model,
      AVG(score) AS avg_score,
      AVG(latency_seconds) AS avg_latency
  FROM public.affine_results
  WHERE ingested_at > NOW() - INTERVAL '7 days'
  GROUP BY hotkey, model
  HAVING COUNT(*) > 50;
`;

export async function GET() {
  try {
    const { rows } = await query<MinerEfficiencyRow>(MINER_EFFICIENCY_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('miner-efficiency query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
