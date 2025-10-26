import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { SubnetOverviewRow } from '@/lib/types';

export const runtime = 'nodejs';

const ENV_WINDOW = '30 days';

function buildEnvSelect(envNames: string[]) {
  const joiner = ',\n        ';
  return envNames
    .map((name, index) => {
      const alias = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const paramIndex = index + 1;
      return `MAX(CASE WHEN b.env_name = $${paramIndex} THEN b.avg_score * 100 ELSE NULL END) AS "${alias}"`;
    })
    .join(joiner);
}

export async function GET() {
  try {
    const envResult = await query<{ env_name: string }>(
      `
        SELECT DISTINCT env_name
        FROM public.affine_results
        WHERE ingested_at > NOW() - INTERVAL '${ENV_WINDOW}'
        ORDER BY env_name ASC;
      `,
    );

    const envNames = envResult.rows
      .map(({ env_name }: { env_name: string }) => env_name)
      .filter((name: string | null | undefined): name is string => Boolean(name));

    const dynamicEnvSelect = buildEnvSelect(envNames);
    const envSelectClause = dynamicEnvSelect
      ? `${dynamicEnvSelect},
        `
      : '';

    const sql = `
      WITH
        base_metrics AS (
          SELECT
            hotkey,
            model,
            revision,
            MAX(uid) AS uid,
            env_name,
            COUNT(*) AS rollouts,
            AVG(score) AS avg_score,
            AVG(latency_seconds) AS avg_latency,
            (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent
          FROM public.affine_results
          WHERE ingested_at > NOW() - INTERVAL '${ENV_WINDOW}'
          GROUP BY hotkey, model, revision, env_name
        ),
        env_maximums AS (
          SELECT
            env_name,
            MAX(rollouts) AS max_rollouts
          FROM base_metrics
          GROUP BY env_name
        ),
        eligibility_check AS (
          SELECT
            bm.hotkey,
            bm.model,
            bm.revision,
            bool_and(bm.rollouts >= (150 + 0.01 * em.max_rollouts)) AS is_eligible
          FROM base_metrics bm
          JOIN env_maximums em ON bm.env_name = em.env_name
          GROUP BY bm.hotkey, bm.model, bm.revision
        ),
        overall_metrics AS (
          SELECT
            hotkey,
            model,
            revision,
            COUNT(*) AS total_rollouts,
            AVG(score) AS overall_avg_score,
            (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 AS success_rate_percent,
            AVG(latency_seconds) AS avg_latency,
            MAX(ingested_at) AS last_rollout_at,
            MAX((extra->'miner_chute'->>'chute_id')) AS chute_id
          FROM public.affine_results
          WHERE ingested_at > NOW() - INTERVAL '${ENV_WINDOW}'
          GROUP BY hotkey, model, revision
        )
      SELECT
        b.hotkey,
        b.model,
        b.revision AS rev,
        MAX(b.uid) AS uid,
        ${envSelectClause}e.is_eligible AS eligible,
        om.overall_avg_score * 100 AS overall_avg_score,
        om.success_rate_percent,
        om.avg_latency,
        om.total_rollouts,
        om.last_rollout_at,
        om.chute_id
      FROM base_metrics b
      JOIN eligibility_check e
        ON b.hotkey = e.hotkey AND b.model = e.model AND b.revision = e.revision
      JOIN overall_metrics om
        ON b.hotkey = om.hotkey AND b.model = om.model AND b.revision = om.revision
      GROUP BY
        b.hotkey,
        b.model,
        b.revision,
        e.is_eligible,
        om.overall_avg_score,
        om.success_rate_percent,
        om.avg_latency,
        om.total_rollouts,
        om.last_rollout_at,
        om.chute_id
      ORDER BY om.overall_avg_score DESC;
    `;

    const { rows } = await query<SubnetOverviewRow>(sql, envNames);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Subnet overview query error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
