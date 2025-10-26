import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { LatencyDistributionByEnvRow } from '@/lib/types';

export const runtime = 'nodejs';

const LATENCY_DISTRIBUTION_SQL = `
  WITH top_miners AS (
    SELECT hotkey
    FROM public.affine_results
    WHERE
      env_name = $1
      AND ingested_at > NOW() - INTERVAL '7 days'
    GROUP BY hotkey
    ORDER BY COUNT(*) DESC
    LIMIT 10
  )
  SELECT
    hotkey,
    latency_seconds
  FROM public.affine_results
  WHERE
    hotkey IN (SELECT hotkey FROM top_miners)
    AND env_name = $1
    AND ingested_at > NOW() - INTERVAL '7 days';
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const env =
    searchParams.get('env') ??
    searchParams.get('ENV') ??
    searchParams.get('e') ??
    '';
  const normalizedEnv = env.trim();

  if (!normalizedEnv) {
    return NextResponse.json(
      { message: 'Missing required query parameter: env' },
      { status: 400 },
    );
  }

  try {
    const { rows } = await query<LatencyDistributionByEnvRow>(
      LATENCY_DISTRIBUTION_SQL,
      [normalizedEnv],
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('latency-distribution-by-env query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
