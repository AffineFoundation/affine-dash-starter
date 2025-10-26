import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { EnvironmentStatsRow } from '@/lib/types';

export const runtime = 'nodejs';

const ENVIRONMENT_STATS_SQL = `
  SELECT
    env_name,
    COUNT(*) AS total_rollouts,
    AVG(score) * 100 AS success_rate
  FROM public.affine_results
  GROUP BY env_name
  ORDER BY total_rollouts DESC;
`;

export async function GET() {
  try {
    const { rows } = await query<EnvironmentStatsRow>(ENVIRONMENT_STATS_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('environment-stats query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
