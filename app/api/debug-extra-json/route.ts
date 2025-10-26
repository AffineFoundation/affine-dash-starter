import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const DEBUG_EXTRA_SQL = `
  SELECT
    extra
  FROM public.affine_results
  WHERE
    ingested_at > NOW() - INTERVAL '7 days'
    AND extra IS NOT NULL
  ORDER BY ingested_at DESC
  LIMIT 10;
`;

export async function GET() {
  try {
    const { rows } = await query<{ extra: unknown }>(DEBUG_EXTRA_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('debug-extra-json query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
