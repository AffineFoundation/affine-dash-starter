import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ActivityRow } from '@/lib/types';

export const runtime = 'nodejs';

const ACTIVITY_SQL = `
  SELECT
    ingested_at,
    hotkey,
    uid,
    model,
    env_name,
    score,
    success
  FROM public.affine_results
  ORDER BY ingested_at DESC
  LIMIT 10;
`;

export async function GET() {
  try {
    const { rows } = await query<ActivityRow>(ACTIVITY_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Activity query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
