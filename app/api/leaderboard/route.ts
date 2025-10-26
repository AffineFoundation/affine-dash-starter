import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { LeaderboardRow } from '@/lib/types';

export const runtime = 'nodejs';

const LEADERBOARD_SQL = `
  SELECT
    hotkey,
    MAX(uid) AS last_seen_uid,
    model,
    MAX((extra->'miner_chute'->>'chute_id')) AS chute_id,
    COUNT(*) AS total_rollouts,
    AVG(score) AS average_score,
    (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
    AVG(latency_seconds) AS avg_latency
  FROM public.affine_results
  GROUP BY hotkey, model
  ORDER BY average_score DESC, total_rollouts DESC
  LIMIT 20;
`;

export async function GET() {
  try {
    const { rows } = await query<LeaderboardRow>(LEADERBOARD_SQL);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Leaderboard query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
