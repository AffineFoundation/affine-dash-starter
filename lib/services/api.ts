import type {
  ActivityRow,
  AdvancedInsightRow,
  DailyRolloutsByModelRow,
  EnvironmentStatsRow,
  EnvironmentsResponse,
  GpuMarketShareRow,
  LatencyDistributionByEnvRow,
  LeaderboardRow,
  LiveEnrichmentRow,
  LiveEnvLeaderboardRow,
  MinerEfficiencyCostRow,
  MinerEfficiencyRow,
  NetworkActivityRow,
  PerformanceByEnvRow,
  ResultsOverTimeRow,
  ScoreDistributionByEnvRow,
  SubnetOverviewRow,
  TopMinersByEnvRow,
} from '@/lib/types';

const FIVE_MINUTES = 300;
const TEN_MINUTES = 600;
const ONE_HOUR = 3_600;

type FetchOptions = {
  revalidate?: number;
  cache?: RequestCache;
};

const isServer = typeof window === 'undefined';

function getBaseUrl() {
  if (!isServer) {
    return '';
  }
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;
  if (envUrl) {
    return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
  }
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

function resolveUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (!isServer) {
    return path;
  }
  return new URL(path, getBaseUrl()).toString();
}

function resolveMock(path: string) {
  if (!path.startsWith('/')) {
    return path;
  }
  if (!isServer) {
    return path;
  }
  return new URL(path, getBaseUrl()).toString();
}

async function getJSON<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = resolveUrl(path);
  const init: RequestInit = {
    method: 'GET',
  };

  if (options.cache) {
    init.cache = options.cache;
  }

  if (isServer && typeof options.revalidate === 'number') {
    (init as any).next = { revalidate: options.revalidate };
  }

  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`GET ${path} failed: ${res.status} ${res.statusText} ${text}`);
    }
    if (!contentType.includes('application/json')) {
      throw new Error(`Unexpected content-type for ${path}: ${contentType}`);
    }
    return JSON.parse(text) as T;
  } catch (err) {
    const mockMap: Record<string, string> = {
      '/api/subnet-overview': '/mock/subnet-overview.json',
      '/api/leaderboard': '/mock/leaderboard.json',
      '/api/activity': '/mock/activity.json',
      '/api/performance-by-env': '/mock/performance-by-env.json',
      '/api/results-over-time': '/mock/results-over-time.json',
      '/api/daily-rollouts-by-model': '/mock/daily-rollouts-by-model.json',
      '/api/environments': '/mock/environments.json',
      '/api/network-activity': '/mock/network-activity.json',
      '/api/environment-stats': '/mock/environment-stats.json',
      '/api/miner-efficiency': '/mock/miner-efficiency.json',
      '/api/advanced-insights': '/mock/advanced-insights.json',
      '/api/gpu-market-share': '/mock/gpu-market-share.json',
      '/api/miner-efficiency-cost': '/mock/miner-efficiency-cost.json',
      '/api/top-miners-by-env': '/mock/top-miners-by-env.json',
      '/api/score-distribution-by-env': '/mock/score-distribution-by-env.json',
      '/api/latency-distribution-by-env': '/mock/latency-distribution-by-env.json',
    };
    const basePath = path.split('?')[0];
    let mockPath = mockMap[basePath];
    if (!mockPath && basePath.startsWith('/api/live-env-leaderboard/')) {
      mockPath = '/mock/live-env-leaderboard.json';
    }
    if (mockPath) {
      const mockRes = await fetch(resolveMock(mockPath));
      if (!mockRes.ok) {
        const text = await mockRes.text().catch(() => '');
        throw new Error(`Mock fallback for ${path} failed: ${mockRes.status} ${mockRes.statusText} ${text}`);
      }
      return mockRes.json() as Promise<T>;
    }
    throw err;
  }
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const url = resolveUrl(path);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }
  if (!contentType.includes('application/json')) {
    throw new Error(`Unexpected content-type for ${path}: ${contentType}`);
  }
  return JSON.parse(text) as T;
}

export function enrichLiveSubnetRows(items: Array<{ uid: number | string; model: string }>) {
  const normalized = items.map((it) => ({
    uid: typeof it.uid === 'string' ? Number(it.uid) : it.uid,
    model: it.model,
  }));
  return postJSON<LiveEnrichmentRow[]>('/api/live-enrichment', { items: normalized }).catch(
    () => [] as LiveEnrichmentRow[],
  );
}

export function fetchLeaderboard(options: FetchOptions = {}) {
  return getJSON<LeaderboardRow[]>('/api/leaderboard', {
    revalidate: FIVE_MINUTES,
    ...options,
  });
}

export function fetchLiveEnvLeaderboard(env: string, options: FetchOptions = {}) {
  const path = `/api/live-env-leaderboard/${encodeURIComponent(env)}`;
  return getJSON<LiveEnvLeaderboardRow[]>(path, {
    revalidate: 30,
    cache: 'no-store',
    ...options,
  });
}

export function fetchActivity(options: FetchOptions = {}) {
  return getJSON<ActivityRow[]>('/api/activity', {
    revalidate: 30,
    ...options,
  });
}

export function fetchPerformanceByEnv(options: FetchOptions = {}) {
  return getJSON<PerformanceByEnvRow[]>('/api/performance-by-env', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchResultsOverTime(options: FetchOptions = {}) {
  return getJSON<ResultsOverTimeRow[]>('/api/results-over-time', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchDailyRolloutsByModel(options: FetchOptions = {}) {
  return getJSON<DailyRolloutsByModelRow[]>('/api/daily-rollouts-by-model', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchNetworkActivity(options: FetchOptions = {}) {
  return getJSON<NetworkActivityRow[]>('/api/network-activity', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchEnvironmentStats(options: FetchOptions = {}) {
  return getJSON<EnvironmentStatsRow[]>('/api/environment-stats', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchMinerEfficiency(options: FetchOptions = {}) {
  return getJSON<MinerEfficiencyRow[]>('/api/miner-efficiency', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchSubnetOverview(options: FetchOptions = {}) {
  return getJSON<SubnetOverviewRow[]>('/api/subnet-overview', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchEnvironments(options: FetchOptions = {}) {
  return getJSON<EnvironmentsResponse>('/api/environments', {
    revalidate: ONE_HOUR,
    ...options,
  });
}

export function fetchTopMinersByEnv(env: string, options: FetchOptions = {}) {
  return getJSON<TopMinersByEnvRow[]>(`/api/top-miners-by-env?env=${encodeURIComponent(env)}`, {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchScoreDistributionByEnv(env: string, options: FetchOptions = {}) {
  return getJSON<ScoreDistributionByEnvRow[]>(
    `/api/score-distribution-by-env?env=${encodeURIComponent(env)}`,
    {
      revalidate: TEN_MINUTES,
      ...options,
    },
  );
}

export function fetchLatencyDistributionByEnv(env: string, options: FetchOptions = {}) {
  return getJSON<LatencyDistributionByEnvRow[]>(
    `/api/latency-distribution-by-env?env=${encodeURIComponent(env)}`,
    {
      revalidate: TEN_MINUTES,
      ...options,
    },
  );
}

export function fetchAdvancedInsights(options: FetchOptions = {}) {
  return getJSON<AdvancedInsightRow[]>('/api/advanced-insights', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchGpuMarketShare(options: FetchOptions = {}) {
  return getJSON<GpuMarketShareRow[]>('/api/gpu-market-share', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}

export function fetchMinerEfficiencyCost(options: FetchOptions = {}) {
  return getJSON<MinerEfficiencyCostRow[]>('/api/miner-efficiency-cost', {
    revalidate: TEN_MINUTES,
    ...options,
  });
}
