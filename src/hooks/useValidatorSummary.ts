import { useQuery } from '@tanstack/react-query';

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}

export interface MinerEnvironmentSnapshot {
  accuracy: number;
  count: number;
  confidence_interval?: ConfidenceInterval;
  is_winner?: boolean;
}

export interface MinerSummary {
  uid: number;
  hotkey: string;
  model: string;
  revision?: string;
  environments?: Record<string, MinerEnvironmentSnapshot>;
  layer_points?: Record<string, number>;
  total_score?: number;
  eligible?: boolean;
  first_block?: number;
  weight?: number;
}

export interface SummaryResponse {
  timestamp: string;
  timestampUnix: number;
  tail: number;
  columns: string[];
  rows: (string | number | null)[][];
  miners: Record<string, MinerSummary>;
  raw: R2Response;
}

export interface R2Response {
  schema_version: string;
  timestamp: number;
  block: number;
  data: {
    header: string[];
    rows: (string | number | null)[][];
    miners?: Record<string, MinerSummary>;
  };
}

const URL = '/api/weights';

export const useValidatorSummary = () => {
  const {
    data,
    error,
    isLoading: loading,
    refetch,
  } = useQuery<SummaryResponse>({
    queryKey: ['validator-summary'],
    queryFn: async () => {
      const res = await fetch(URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: R2Response = await res.json();
      return {
        timestamp: new Date(json.timestamp * 1000).toISOString(),
        timestampUnix: json.timestamp,
        tail: json.block,
        columns: json.data.header ?? [],
        rows: json.data.rows ?? [],
        miners: json.data.miners ?? {},
        raw: json,
      };
    },
    refetchInterval: 180000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data: data ?? null,
    loading,
    error: error ? (error as Error).message : null,
    refetch,
  } as const;
};
