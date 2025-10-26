import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { PerformanceByEnvRow } from '@/lib/types';

export const runtime = 'nodejs';

const PERFORMANCE_BY_ENV_SQL = `
  SELECT
    env_name,
    COUNT(*) AS total_rollouts,
    AVG(score) AS average_score,
    (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent
  FROM public.affine_results
  GROUP BY env_name
  ORDER BY average_score DESC;
`;

export async function GET() {
  try {
    const { rows } = await query<PerformanceByEnvRow>(PERFORMANCE_BY_ENV_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Performance-by-env query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
