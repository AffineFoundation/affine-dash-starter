import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { EnvironmentsResponse } from '@/lib/types';

export const runtime = 'nodejs';

const ENVIRONMENTS_SQL = `
  SELECT DISTINCT env_name
  FROM public.affine_results
  WHERE ingested_at > NOW() - INTERVAL '30 days'
  ORDER BY env_name ASC;
`;

export async function GET() {
  try {
    const { rows } = await query<{ env_name: string }>(ENVIRONMENTS_SQL);
    const envs: EnvironmentsResponse = rows
      .map(({ env_name }: { env_name: string }) => env_name)
      .filter((name: string | null | undefined): name is string => Boolean(name));
    return NextResponse.json(envs);
  } catch (error) {
    console.error('Environments endpoint error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
