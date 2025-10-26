import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { TopMinersByEnvRow } from '@/lib/types';

export const runtime = 'nodejs';

const TOP_MINERS_SQL = `
  WITH top_miners AS (
    SELECT hotkey
    FROM public.affine_results
    WHERE
      env_name = $1
      AND ingested_at > NOW() - INTERVAL '14 days'
    GROUP BY hotkey
    HAVING COUNT(*) > 20
    ORDER BY AVG(score) DESC, COUNT(*) DESC
    LIMIT 5
  )
  SELECT
    DATE_TRUNC('day', ar.ingested_at)::date AS period,
    ar.hotkey,
    AVG(ar.score) AS average_score
  FROM public.affine_results ar
  WHERE
    ar.hotkey IN (SELECT hotkey FROM top_miners)
    AND ar.env_name = $1
    AND ar.ingested_at > NOW() - INTERVAL '30 days'
  GROUP BY period, ar.hotkey
  ORDER BY period ASC;
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
    const { rows } = await query<TopMinersByEnvRow>(TOP_MINERS_SQL, [normalizedEnv]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('top-miners-by-env query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
