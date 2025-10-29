import { useQuery } from '@tanstack/react-query';

interface SummaryResponse {
  timestamp: string;
  tail: number;
  columns: string[];
  rows: (string | number | null)[][];
  raw?: string;
}

interface R2Response {
  schema_version: string;
  timestamp: number;
  block: number;
  data: {
    header: string[];
    rows: (string | number | null)[][];
  };
}

const URL = "/api/weights";

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
        tail: json.block,
        columns: json.data.header,
        rows: json.data.rows,
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
