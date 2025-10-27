import React from 'react';
import { SkeletonText } from './Skeleton';

interface EnvironmentLiveTableProps {
  theme: 'light' | 'dark';
  rows: any[];
  loading: boolean;
  errorMsg: string | null;
  envName: string;
  startIndex: number;
}

const EnvironmentLiveTable: React.FC<EnvironmentLiveTableProps> = ({
  theme,
  rows: pagedRows,
  loading,
  errorMsg,
  envName,
  startIndex,
}) => {
  const gridCols =
    'grid grid-cols-[56px_72px_minmax(0,1.1fr)_88px_112px] gap-2 items-center';

  const fmt = (n: number | null | undefined, digits = 1) =>
    n == null ? '—' : n.toFixed(digits);

  const midTrunc = (s: string, max = 36) =>
    s && s.length > max
      ? `${s.slice(0, max / 2)}…${s.slice(s.length - max / 2)}`
      : s;

  return (
    <div className="rounded-[4px] bg-white">
        {/* Table Header */}
        <div className="px-2 py-[10px] text-light-smoke border-b border-black/5">
          <div
            className={`${gridCols} text-left px-3 h-8 bg-light-haze rounded-[3px] divide-x divide-black/5`}
          >
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center pr-3">
              Rank
            </div>
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center px-3">
              UID
            </div>
            <div className="text-xs font-mono tracking-wide h-full leading-none flex items-center px-3">
              Model
            </div>
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center px-3">
              Rev
            </div>
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center px-3">
              {envName} Score
            </div>
            {/*
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center px-3">
              Overall Avg
            </div>
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center px-3">
              Success %
            </div>
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center px-3">
              Avg Latency (s)
            </div>
            <div className="text-xs font-mono uppercase tracking-wide h-full leading-none flex items-center pl-3">
              Rollouts
            </div>
            */}
          </div>
        </div>

        {/* Table Body */}
        <div className="text-light-smoke divide-y divide-black/5">
          {errorMsg && (
            <div className="p-4 text-red-600 dark:text-red-400">{errorMsg}</div>
          )}

          {loading &&
            !errorMsg &&
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="p-3 hover:bg-light-50/60 dark:hover:bg-gray-800/40"
              >
                <div className={`${gridCols} text-center`}>
                  <SkeletonText theme={theme} className="h-4 w-8 mx-auto" />
                  <SkeletonText theme={theme} className="h-4 w-12 mx-auto" />
                  <div className="text-left">
                    <SkeletonText theme={theme} className="h-4 w-48" />
                  </div>
                  <SkeletonText theme={theme} className="h-3 w-10 mx-auto" />
                  <SkeletonText theme={theme} className="h-4 w-12 mx-auto" />
                </div>
              </div>
            ))}

          {!loading &&
            !errorMsg &&
            pagedRows.map((row: any, index: number) => (
              <div key={row.uniqueId} className="p-5 transition-colors duration-300 hover:bg-light-sand/50 group">
                <div className={`${gridCols} font-medium text-sm leading-none tracking-wide`}>
                  <div className="whitespace-nowrap pr-3">{startIndex + index + 1}</div>
                  <div className="whitespace-nowrap px-3">{row.uid}</div>
                  <div className="truncate whitespace-nowrap px-3" title={row.model}>
                    {midTrunc(row.model, 48)}
                  </div>
                  <div className="whitespace-nowrap px-3" title={row.rev}>
                    {midTrunc(row.rev, 10)}
                  </div>
                  <div className="whitespace-nowrap px-3">
                    {fmt(row.envScore)}
                  </div>
                </div>
              </div>
            ))}
        </div>
    </div>
  );
};

export default EnvironmentLiveTable;
