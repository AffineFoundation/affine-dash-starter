'use client';

import { useEffect, useState } from 'react';

interface SummaryResponse {
  timestamp: string;
  tail: number;
  columns: string[];
  rows: (string | number | null)[][];
  raw?: string;
}

const SUMMARY_URL = '/api/live-summary';

export const useValidatorSummary = () => {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(SUMMARY_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SummaryResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  return { data, loading, error, refetch: fetchData } as const;
};
