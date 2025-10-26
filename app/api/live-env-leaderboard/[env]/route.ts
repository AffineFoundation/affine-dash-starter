import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { LiveEnvLeaderboardRow } from '@/lib/types';

export const runtime = 'nodejs';

const LIVE_ENV_LEADERBOARD_SQL = `
  WITH
    live_miners AS (
      SELECT DISTINCT hotkey
      FROM public.affine_results
      WHERE env_name = $1
        AND ingested_at > NOW() - INTERVAL '3 hours 41 minutes 24 seconds'
    )
  SELECT
      ar.hotkey,
      MAX(ar.uid) AS last_seen_uid,
      ar.model,
      ar.revision,
      COUNT(*) AS total_rollouts,
      AVG(ar.score) * 100 AS average_score,
      (SUM(CASE WHEN ar.success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
      AVG(ar.latency_seconds) AS avg_latency
  FROM public.affine_results ar
  WHERE
      ar.env_name = $1
      AND ar.hotkey IN (SELECT hotkey FROM live_miners)
      AND ar.ingested_at > NOW() - INTERVAL '24 hours'
  GROUP BY ar.hotkey, ar.model, ar.revision
  ORDER BY average_score DESC, total_rollouts DESC;
`;

export async function GET(
  _request: Request,
  { params }: { params: { env: string } },
) {
  const envParam = params.env?.toString().trim();
  if (!envParam) {
    return NextResponse.json(
      { message: 'Missing required path parameter: env' },
      { status: 400 },
    );
  }

  const env = envParam.toUpperCase();

  try {
    const { rows } = await query<LiveEnvLeaderboardRow>(LIVE_ENV_LEADERBOARD_SQL, [env]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('live-env-leaderboard query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
