'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { fetchLiveEnvLeaderboard } from '@/lib/services/api';
import type {
  LiveEnvLeaderboardRow,
  ScoreDistributionByEnvRow,
  LatencyDistributionByEnvRow,
  SubnetOverviewRow,
} from '@/lib/types';
import { useEnvironments } from '@/contexts/EnvironmentsContext';
import TablePaginationControls from '@/components/TablePaginationControls';
import CodeViewer from '@/components/CodeViewer';
import { ExternalLink, Code } from 'lucide-react';
import ScoreDistributionHistogram from '@/components/ScoreDistributionHistogram';
import LatencyBoxPlot from '@/components/LatencyBoxPlot';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ToggleButton from '@/components/ToggleButton';
import DataTable from '@/components/DataTable';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import { useTheme } from '@/hooks/useTheme';

type EnvironmentPageProps = {
  envName: string;
  historicalData: SubnetOverviewRow[];
  historicalError?: string | null;
  scoreDistribution: ScoreDistributionByEnvRow[];
  scoreDistributionError?: string | null;
  latencyDistribution: LatencyDistributionByEnvRow[];
  latencyDistributionError?: string | null;
};

export default function EnvironmentPage({
  envName,
  historicalData,
  historicalError,
  scoreDistribution,
  scoreDistributionError,
  latencyDistribution,
  latencyDistributionError,
}: EnvironmentPageProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments();

  const normalizedEnv = envName.toUpperCase();
  const envKey = normalizedEnv.toLowerCase();

  useEffect(() => {
    if (
      !envLoading &&
      normalizedEnv &&
      environments.length > 0 &&
      !environments.includes(normalizedEnv)
    ) {
      router.replace('/');
    }
  }, [envLoading, environments, normalizedEnv, router]);

  const [viewMode, setViewMode] = useState<'live' | 'historical'>('live');

  const data = historicalData;
  const error = historicalError;
  const isLoading = data.length === 0 && !error;

  const {
    data: liveData,
    error: liveError,
    isLoading: isLiveLoading,
  } = useQuery({
    queryKey: ['live-env-leaderboard', normalizedEnv],
    queryFn: () => fetchLiveEnvLeaderboard(normalizedEnv),
    enabled: viewMode === 'live',
    staleTime: 5000,
    refetchInterval: viewMode === 'live' ? 6000 : false,
    refetchOnMount: false,
  });

  const ranked = useMemo(() => {
    const rowsData = Array.isArray(data) ? data : [];

    return rowsData
      .map((r) => {
        const value = (r as unknown as Record<string, number | null | undefined>)[envKey];
        return { row: r, value: value == null ? null : value };
      })
      .filter((x) => x.value != null)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  }, [data, envKey]);

  const liveRows: LiveEnvLeaderboardRow[] = Array.isArray(liveData)
    ? (liveData as LiveEnvLeaderboardRow[])
    : [];

  const tableTotal =
    viewMode === 'historical' ? ranked.length : liveRows.length;
  const tableLoading =
    viewMode === 'historical' ? isLoading : isLiveLoading;
  const tableError =
    viewMode === 'historical' ? (error as unknown) : (liveError as unknown);

  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState<number>(1);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [pageSize, tableTotal]);

  const totalPages = Math.max(1, Math.ceil(tableTotal / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = tableTotal === 0 ? 0 : (page - 1) * pageSize;
  const pagedHistorical = ranked.slice(
    startIndex,
    Math.min(ranked.length, startIndex + pageSize),
  );
  const pagedLive = liveRows.slice(
    startIndex,
    Math.min(liveRows.length, startIndex + pageSize),
  );

  const envTotals = ranked.length;
  const envEligible = ranked.filter(({ row }) => row.eligible).length;
  const envHighest = ranked.length > 0 ? ranked[0].value : null;
  const overviewLoading =
    viewMode === 'historical' ? isLoading : isLiveLoading;
  const envTotalsDisplay =
    viewMode === 'historical' ? envTotals : liveRows.length;
  const envEligibleDisplay =
    viewMode === 'historical' ? envEligible : liveRows.length;
  const envHighestDisplay =
    viewMode === 'historical'
      ? envHighest
      : liveRows.length > 0
      ? liveRows.reduce<number | null>((max, r) => {
          const val = r.average_score ?? null;
          if (val == null) return max;
          return max == null ? val : Math.max(max, val);
        }, null)
      : null;

  const repoMap: Record<string, string> = {
    abd: 'https://github.com/cisterciansis/afffine-dash-starter',
    ded: 'https://github.com/cisterciansis/afffine-dash-starter',
    elr: 'https://github.com/cisterciansis/afffine-dash-starter',
    hvm: 'https://github.com/cisterciansis/afffine-dash-starter',
    mth: 'https://github.com/cisterciansis/afffine-dash-starter',
    sat: 'https://github.com/cisterciansis/afffine-dash-starter',
  };

  const descriptionMap: Record<string, string> = {
    abd: 'ABD environment code and evaluation hooks.',
    ded: 'DED environment code and evaluation hooks.',
    elr: 'ELR environment code and evaluation hooks.',
    hvm: 'HVM environment code and evaluation hooks.',
    mth: 'MTH environment code and evaluation hooks.',
    sat: 'SAT environment code and evaluation hooks.',
  };

  const activeEnvMeta = {
    id: envKey,
    name: normalizedEnv,
    description: descriptionMap[envKey] || `${normalizedEnv} environment`,
    repoUrl: `https://github.com/AffineFoundation/affine/blob/main/affine/envs/${envKey}.py`,
    models: Array.from({ length: envTotals }),
  };

  const fmt = (n: number | null | undefined, digits = 1) =>
    n == null ? '—' : n.toFixed(digits);
  const dash = '—';
  const midTrunc = (s: string, max = 48) => {
    if (!s) return s as unknown as string;
    if (s.length <= max) return s;
    const half = Math.floor((max - 1) / 2);
    return s.slice(0, half) + '…' + s.slice(s.length - half);
  };

  const gridCols =
    'grid grid-cols-[56px_72px_minmax(0,1.1fr)_88px_112px_96px_96px_128px_104px] gap-2 items-center';

  const tableColumns = [
    { key: 'rank', label: 'Rank', align: 'left' as const },
    { key: 'hotkey', label: 'Hotkey', align: 'left' as const },
    { key: 'model', label: 'Model', align: 'left' as const },
    {
      key: 'score',
      label: 'Score',
      align: 'right' as const,
      render: (value: number | null | undefined) => (value == null ? dash : value.toFixed(3)),
    },
    {
      key: 'success_rate',
      label: 'Success %',
      align: 'right' as const,
      render: (value: number | null | undefined) => (value == null ? dash : value.toFixed(2)),
    },
    {
      key: 'avg_latency',
      label: 'Avg Latency',
      align: 'right' as const,
      render: (value: number | null | undefined) =>
        value == null ? dash : `${value.toFixed(2)}s`,
    },
    { key: 'rollouts', label: 'Rollouts', align: 'right' as const },
  ];

  const historicalTableData = pagedHistorical.map((item, idx) => {
    const row = item.row as SubnetOverviewRow;
    return {
      rank: startIndex + idx + 1,
      hotkey: row.hotkey,
      model: row.model,
      score: item.value,
      success_rate: row.success_rate_percent,
      avg_latency: row.avg_latency,
      rollouts: row.total_rollouts,
    };
  });

  const liveTableData = pagedLive.map((item, idx) => ({
    rank: startIndex + idx + 1,
    hotkey: item.hotkey,
    model: item.model,
    score: item.average_score,
    success_rate: item.success_rate_percent,
    avg_latency: item.avg_latency,
    rollouts: item.total_rollouts,
  }));

  return (
    <div className="min-h-screen transition-colors duration-300 bg-light-sand text-light-smoke relative">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Hero />
      <main className="mt-16 px-5 pb-20 w-full space-y-6">
        <Card
          title={`${normalizedEnv} Environment`}
          subtitle="Dynamic view powered by live environments registry"
          theme={theme}
          headerActions={
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.open(activeEnvMeta.repoUrl, '_blank')}
                theme={theme}
              >
                <ExternalLink size={12} />
                REPO
              </Button>
              <Button onClick={() => setShowCode(true)} theme={theme}>
                <Code size={12} />
                VIEW CODE
              </Button>
            </div>
          }
        >
          <div></div>
        </Card>

        {showCode && (
          <CodeViewer
            environment={activeEnvMeta}
            theme={theme}
            onClose={() => setShowCode(false)}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <ToggleButton
            active={viewMode === 'historical'}
            onClick={() => setViewMode('historical')}
            theme={theme}
          >
            Historical
          </ToggleButton>
          <ToggleButton
            active={viewMode === 'live'}
            onClick={() => setViewMode('live')}
            theme={theme}
          >
            Live
          </ToggleButton>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Models"
              value={envTotalsDisplay}
              loading={overviewLoading}
            />
            <StatCard
              label="Eligible Miners"
              value={envEligibleDisplay}
              loading={overviewLoading}
            />
            <StatCard
              label="Top Score"
              value={
                envHighestDisplay == null ? dash : fmt(envHighestDisplay, 2)
              }
              loading={overviewLoading}
            />
          </div>
        </div>

        <div className="space-y-3">
          <TablePaginationControls
            page={page}
            pageSize={pageSize}
            total={tableTotal}
            setPage={setPage}
            setPageSize={setPageSize}
            theme={theme}
          />
          <div className="overflow-x-auto">
            <div className="min-w-[960px] space-y-2">
              <TableHeaderRow gridCols={gridCols} />
              <div className="space-y-1">
                {(viewMode === 'historical' ? pagedHistorical : pagedLive).map((item, idx) => {
                  if (viewMode === 'historical') {
                    const historical = item as { row: SubnetOverviewRow; value: number | null };
                    return (
                      <div
                        key={historical.row.hotkey}
                        className={`rounded-sm border border-light-200 bg-white/40 px-4 py-3 transition-shadow hover:shadow-sm ${
                          idx % 2 === 0 ? 'bg-white/60' : 'bg-white/40'
                        }`}
                      >
                        <HistoricalRow
                          index={startIndex + idx + 1}
                          envKey={envKey}
                          data={historical.row}
                          gridCols={gridCols}
                          fmt={fmt}
                          midTrunc={midTrunc}
                        />
                      </div>
                    );
                  }

                  const live = item as LiveEnvLeaderboardRow;
                  return (
                    <div
                      key={live.hotkey}
                      className={`rounded-sm border border-light-200 bg-white/40 px-4 py-3 transition-shadow hover:shadow-sm ${
                        idx % 2 === 0 ? 'bg-white/60' : 'bg-white/40'
                      }`}
                    >
                      <LiveRow
                        index={startIndex + idx + 1}
                        data={live}
                        gridCols={gridCols}
                        fmt={fmt}
                        midTrunc={midTrunc}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ScoreDistributionHistogram
            theme={theme}
            env={normalizedEnv}
            data={scoreDistribution}
            errorMessage={scoreDistributionError}
          />
          <LatencyBoxPlot
            theme={theme}
            env={normalizedEnv}
            data={latencyDistribution}
            errorMessage={latencyDistributionError}
          />
        </section>

        <Card title="Raw Activity" theme={theme}>
          <DataTable
            theme={theme}
            data={viewMode === 'historical' ? historicalTableData : liveTableData}
            columns={tableColumns}
            loading={tableLoading}
            error={tableError instanceof Error ? tableError.message : null}
            gridCols={gridCols}
          />
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | string;
  loading: boolean;
}) {
  return (
    <div className="rounded-sm border border-light-200 bg-white/60 p-4">
      <div className="text-xs uppercase tracking-wide text-light-350">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-light-500">
        {loading ? '…' : value}
      </div>
    </div>
  );
}

function TableHeaderRow({
  gridCols,
}: {
  gridCols: string;
}) {
  const headers = [
    'Rank',
    'UID',
    'Model',
    'Rev',
    'SAT',
    'ABD',
    'DED',
    'ELR',
    'Live Avg',
  ];
  return (
    <div
      className={`${gridCols} rounded-sm border border-light-200 bg-white/60 px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-light-350`}
    >
      {headers.map((h) => (
        <span key={h}>{h}</span>
      ))}
    </div>
  );
}

function HistoricalRow({
  index,
  envKey,
  data,
  gridCols,
  fmt,
  midTrunc,
}: {
  index: number;
  envKey: string;
  data: SubnetOverviewRow;
  gridCols: string;
  fmt: (n: number | null | undefined, digits?: number) => string;
  midTrunc: (s: string, max?: number) => string;
}) {
  const envScore = (data as unknown as Record<string, number | null | undefined>)[envKey];
  return (
    <div className={`${gridCols} text-sm text-light-500`}>
      <span className="font-mono text-xs">{index}</span>
      <span className="font-mono text-xs">{data.uid ?? '—'}</span>
      <span>{midTrunc(data.model ?? '', 48)}</span>
      <span>{data.rev ?? '—'}</span>
      <span>{fmt(data.sat ?? null)}</span>
      <span>{fmt(data.abd ?? null)}</span>
      <span>{fmt(data.ded ?? null)}</span>
      <span>{fmt(data.elr ?? null)}</span>
      <span>{fmt(envScore ?? null)}</span>
    </div>
  );
}

function LiveRow({
  index,
  data,
  gridCols,
  fmt,
  midTrunc,
}: {
  index: number;
  data: LiveEnvLeaderboardRow;
  gridCols: string;
  fmt: (n: number | null | undefined, digits?: number) => string;
  midTrunc: (s: string, max?: number) => string;
}) {
  return (
    <div className={`${gridCols} text-sm text-light-500`}>
      <span className="font-mono text-xs">{index}</span>
      <span className="font-mono text-xs">{data.last_seen_uid ?? '—'}</span>
      <span>{midTrunc(data.model ?? '', 48)}</span>
      <span>{data.revision ?? '—'}</span>
      <span>{fmt(data.average_score ?? null)}</span>
      <span>{fmt(data.success_rate_percent ?? null)}</span>
      <span>{fmt(data.average_score ?? null)}</span>
      <span>{fmt(data.avg_latency ?? null)}</span>
      <span>{fmt(data.average_score ?? null)}</span>
    </div>
  );
}
