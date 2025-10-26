import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { DailyRolloutsByModelRow } from '@/lib/types';

export const runtime = 'nodejs';

const DAILY_ROLLOUTS_SQL = `
  SELECT
    DATE_TRUNC('day', ingested_at)::date AS day,
    model,
    COUNT(*) AS daily_rollouts
  FROM public.affine_results
  WHERE
    ingested_at > NOW() - INTERVAL '7 days'
    AND model IN (
      SELECT model
      FROM public.affine_results
      GROUP BY model
      ORDER BY COUNT(*) DESC
      LIMIT 5
    )
  GROUP BY day, model
  ORDER BY day DESC, daily_rollouts DESC;
`;

export async function GET() {
  try {
    const { rows } = await query<DailyRolloutsByModelRow>(DAILY_ROLLOUTS_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Daily rollouts query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
