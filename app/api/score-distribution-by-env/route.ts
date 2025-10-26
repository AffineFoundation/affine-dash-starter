import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ScoreDistributionByEnvRow } from '@/lib/types';

export const runtime = 'nodejs';

const SCORE_DISTRIBUTION_SQL = `
  WITH miner_scores AS (
    SELECT
      hotkey,
      AVG(score) AS avg_score
    FROM public.affine_results
    WHERE
      env_name = $1
      AND ingested_at > NOW() - INTERVAL '14 days'
    GROUP BY hotkey
    HAVING COUNT(*) > 20
  )
  SELECT
    width_bucket(avg_score, 0.0, 1.0, 10) AS score_bucket,
    COUNT(*) AS number_of_miners
  FROM miner_scores
  GROUP BY score_bucket
  ORDER BY score_bucket ASC;
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
    const { rows } = await query<ScoreDistributionByEnvRow>(SCORE_DISTRIBUTION_SQL, [normalizedEnv]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('score-distribution-by-env query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
