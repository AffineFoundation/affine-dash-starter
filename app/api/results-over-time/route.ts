import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ResultsOverTimeRow } from '@/lib/types';

export const runtime = 'nodejs';

const RESULTS_OVER_TIME_SQL = `
  SELECT
    DATE_TRUNC('day', ingested_at) AS period,
    COUNT(*) AS total_rollouts,
    AVG(score) AS average_score
  FROM public.affine_results
  WHERE ingested_at > NOW() - INTERVAL '30 days'
  GROUP BY period
  ORDER BY period ASC;
`;

export async function GET() {
  try {
    const { rows } = await query<ResultsOverTimeRow>(RESULTS_OVER_TIME_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Results-over-time query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
