import { SummaryResponse } from '../hooks/useValidatorSummary';

type EmissionEntry = { emission: string };

export interface EnvironmentMinerStat {
  uid: number;
  hotkey: string;
  model: string;
  revision: string | null;
  sample_count: number;
  average_score: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
  is_winner: boolean;
  weight: number | null;
  total_score: number | null;
  eligible: boolean;
  first_block: number | null;
  emission: number | null;
}

const SCORE_FALLBACK = -Infinity;

const parseEmissionAlpha = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric / 1_000_000_000;
};

export function transformSummaryForEnv(
  summaryData: SummaryResponse | null | undefined,
  envName: string,
  emissionByUid?: Map<number, EmissionEntry>,
): EnvironmentMinerStat[] {
  if (!summaryData || !summaryData.miners) {
    return [];
  }

  const stats: EnvironmentMinerStat[] = [];

  for (const miner of Object.values(summaryData.miners)) {
    if (!miner) continue;
    const envStats = miner.environments?.[envName];
    if (!envStats) continue;

    const lower = envStats.confidence_interval?.lower ?? null;
    const upper = envStats.confidence_interval?.upper ?? null;
    const emissionEntry = emissionByUid?.get(miner.uid);
    const emission = parseEmissionAlpha(emissionEntry?.emission ?? null);

    stats.push({
      uid: miner.uid,
      hotkey: miner.hotkey,
      model: miner.model,
      revision: miner.revision ?? null,
      sample_count: envStats.count ?? 0,
      average_score:
        typeof envStats.accuracy === 'number' ? envStats.accuracy : null,
      lower_bound: lower,
      upper_bound: upper,
      is_winner: Boolean(envStats.is_winner),
      weight:
        typeof miner.weight === 'number'
          ? miner.weight
          : typeof miner.weight === 'string'
          ? Number(miner.weight)
          : null,
      total_score:
        typeof miner.total_score === 'number'
          ? miner.total_score
          : typeof miner.total_score === 'string'
          ? Number(miner.total_score)
          : null,
      eligible: Boolean(miner.eligible),
      first_block:
        typeof miner.first_block === 'number'
          ? miner.first_block
          : typeof miner.first_block === 'string'
          ? Number(miner.first_block)
          : null,
      emission,
    });
  }

  return stats.sort((a, b) =>
    (b.average_score ?? SCORE_FALLBACK) - (a.average_score ?? SCORE_FALLBACK),
  );
}
