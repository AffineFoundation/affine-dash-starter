export type LeaderboardRow = {
  hotkey: string;
  last_seen_uid: number;
  model: string;
  chute_id: string | null;
  total_rollouts: number;
  average_score: number;
  success_rate_percent: number;
  avg_latency: number | null;
};

export type LiveEnvLeaderboardRow = {
  hotkey: string;
  last_seen_uid: number;
  model: string;
  revision: string | null;
  total_rollouts: number;
  average_score: number | null;
  success_rate_percent: number | null;
  avg_latency: number | null;
};

export type ActivityRow = {
  ingested_at: string;
  hotkey: string;
  uid: number;
  model: string;
  env_name: string;
  score: number;
  success: boolean;
};

export type PerformanceByEnvRow = {
  env_name: string;
  total_rollouts: number;
  average_score: number;
  success_rate_percent: number;
};

export type ResultsOverTimeRow = {
  period: string;
  total_rollouts: number;
  average_score: number;
};

export type DailyRolloutsByModelRow = {
  day: string;
  model: string;
  daily_rollouts: number;
};

export type NetworkActivityRow = {
  period: string;
  total_rollouts: number;
  avg_all?: number;
  avg_top50_daily?: number | null;
  average_score?: number;
};

export type EnvironmentStatsRow = {
  env_name: string;
  total_rollouts: number;
  success_rate: number;
};

export type MinerEfficiencyRow = {
  hotkey: string;
  model: string;
  avg_score: number;
  avg_latency: number | null;
};

export type TopMinersByEnvRow = {
  period: string;
  hotkey: string;
  average_score: number;
};

export type ScoreDistributionByEnvRow = {
  score_bucket: number;
  number_of_miners: number;
};

export type LatencyDistributionByEnvRow = {
  hotkey: string;
  latency_seconds: number;
};

export type AdvancedInsightRow = {
  hotkey: string;
  model: string;
  chute_id: string | null;
  template: string | null;
  gpus: string | null;
  cost_per_hour: number | null;
  score: number;
};

export type GpuMarketShareRow = {
  gpus: string | null;
  miner_count: number;
};

export type MinerEfficiencyCostRow = {
  hotkey: string;
  model: string;
  avg_score: number;
  avg_token_cost_usd: number;
};

export type LiveEnrichmentRow = {
  uid: number;
  model: string;
  hotkey: string;
  total_rollouts: number;
  overall_avg_score: number | null;
  success_rate_percent: number;
  avg_latency: number | null;
  last_rollout_at: string | null;
  chute_id: string | null;
};

export type SubnetOverviewRow = {
  hotkey: string;
  model: string;
  rev: string;
  uid: number;
  chute_id: string | null;
  sat: number | null;
  abd: number | null;
  ded: number | null;
  elr: number | null;
  eligible: boolean;
  overall_avg_score: number | null;
  success_rate_percent: number;
  avg_latency: number | null;
  total_rollouts: number;
  last_rollout_at: string | null;
};

export type EnvironmentsResponse = string[];
