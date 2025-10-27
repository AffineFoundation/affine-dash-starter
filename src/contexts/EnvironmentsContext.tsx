import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchEnvironments } from '../services/api';

type EnvironmentsContextValue = {
  environments: string[]; // Full names, e.g. affine:ded
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const EnvironmentsContext = createContext<EnvironmentsContextValue | undefined>(undefined);

export const EnvironmentsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [environments, setEnvironments] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setEnvironments([]);
    try {
      const envs = await fetchEnvironments();
      // Manual mapping for known legacy environment names
      const envNameMapping: { [key: string]: string } = {
        ABD: 'affine:abd',
        SAT: 'affine:sat',
        DED: 'affine:ded',
      };
      const normalizedEnvs = (envs ?? []).map(env => {
        const envStr = String(env);
        return envNameMapping[envStr] || envStr;
      });
      // Ensure strings, dedupe, and sort for stability
      const uniqueSorted = Array.from(new Set(normalizedEnvs.map(String))).sort((a, b) => a.localeCompare(b));
      setEnvironments(uniqueSorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch once on mount
    load();
  }, []);

  const value = useMemo<EnvironmentsContextValue>(() => {
    const finalEnvs = Array.from(new Set(environments));
    return {
      environments: finalEnvs,
      loading,
      error,
      refresh: load,
    };
  }, [environments, loading, error]);

  return (
    <EnvironmentsContext.Provider value={value}>
      {children}
    </EnvironmentsContext.Provider>
  );
};

export function useEnvironments(): EnvironmentsContextValue {
  const ctx = useContext(EnvironmentsContext);
  if (!ctx) {
    throw new Error('useEnvironments must be used within an EnvironmentsProvider');
  }
  return ctx;
}
