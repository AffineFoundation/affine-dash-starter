import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchSubnetOverview,
  type SubnetOverviewRow,
} from '../services/api'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import EnvironmentLiveTable from '../components/EnvironmentLiveTable'
import TablePaginationControls from '../components/TablePaginationControls'
import CodeViewer from '../components/CodeViewer'
import { ExternalLink, Code } from 'lucide-react'
import ScoreDistributionHistogram from '../components/ScoreDistributionHistogram'
import LatencyBoxPlot from '../components/LatencyBoxPlot'
import Card from '../components/Card'
import Button from '../components/Button'
import ToggleButton from '../components/ToggleButton'
import DataTable from '../components/DataTable'

const EnvironmentPage: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  const { envName: rawEnv } = useParams()
  const { environments, loading: envLoading } = useEnvironments()

  // Validate the env from URL against the dynamic list
  if (envLoading) {
    return null
  }
  // Redirect if env is not in the list from context
  if (!rawEnv || !environments.includes(rawEnv)) {
    return <Navigate to="/" replace />
  }

  // Reverse mapping from new format to legacy format for API calls
  const legacyEnvNameMapping: { [key: string]: string } = {
    'affine:abd': 'ABD',
    'affine:sat': 'SAT',
    'affine:ded': 'DED',
  };

  const apiEnvName = legacyEnvNameMapping[rawEnv] || rawEnv;

  const envName = rawEnv.toUpperCase()
  const envKey = envName.toLowerCase().replace(/.*:/, '')

  // Table view mode for this environment (Live default for consistency with overview)
  const [viewMode, setViewMode] = useState<'live' | 'historical'>('live')

  const { data, error, isLoading } = useQuery({
    queryKey: ['subnet-overview'],
    queryFn: fetchSubnetOverview,
    enabled: viewMode === 'historical',
    staleTime: 60000,
    refetchOnMount: false,
  })

  const {
    data: liveSummary,
    loading: isLiveLoading,
    error: liveError,
  } = useValidatorSummary()

  const rows = Array.isArray(data) ? data : []

  // Build a per-environment ranking from subnet overview by looking up the dynamic property
  const ranked = rows
    .map((r) => {
      const value = (r as any)[envKey] as number | null | undefined
      return { row: r, value: value == null ? null : value }
    })
    .filter((x) => x.value != null)
    .sort((a, b) => b.value! - a.value!)

  const liveRows = useMemo(() => {
    if (!liveSummary) return []
    const cols = liveSummary.columns || []
    const idx = (name: string) => cols.indexOf(name)

    const iUID = idx('UID'),
      iModel = idx('Model'),
      iRev = idx('Rev')

    const envColIndex = cols.findIndex(c => c === rawEnv)
    if (envColIndex === -1) return []

    const parseScore = (v: unknown): number | null =>
      v == null
        ? null
        : parseFloat(String(v).replace(/\*/g, '').split('/')[0]) || null

    return liveSummary.rows
      .map(row => {
        const envScore = parseScore(row[envColIndex])
        return {
          uniqueId: `live-${row[iUID]}-${row[iModel]}-${row[iRev]}`,
          uid: String(row[iUID] ?? ''),
          model: String(row[iModel] ?? ''),
          rev: String(row[iRev] ?? ''),
          envScore,
        }
      })
      .filter(row => row.envScore !== null)
      .sort((a, b) => b.envScore! - a.envScore!)
  }, [liveSummary, rawEnv])

  // Unified table state derived from current mode
  const tableTotal = viewMode === 'historical' ? ranked.length : liveRows.length
  const tableLoading =
    viewMode === 'historical'
      ? isLoading
      : isLiveLoading && liveRows.length === 0
  const tableError =
    viewMode === 'historical' ? (error as unknown) : (liveError as unknown)

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const [showCode, setShowCode] = useState(false)

  // Reset to first page when table count or page size changes
  useEffect(() => {
    setPage(1)
  }, [pageSize, tableTotal])

  const totalPages = Math.max(1, Math.ceil(tableTotal / pageSize))
  // Clamp page if it exceeds totalPages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const startIndex = tableTotal === 0 ? 0 : (page - 1) * pageSize
  const endIndex = Math.min(tableTotal, startIndex + pageSize)
  const pagedHistorical = ranked.slice(
    startIndex,
    Math.min(ranked.length, startIndex + pageSize),
  )

  const pagedLive = liveRows.slice(
    startIndex,
    Math.min(liveRows.length, startIndex + pageSize),
  )

  // Environment-specific overview stats
  const envTotals = ranked.length
  const envEligible = ranked.filter(({ row }) => row.eligible).length
  const envHighest = ranked.length > 0 ? ranked[0].value : null
  const overviewLoading = viewMode === 'historical' ? isLoading : isLiveLoading
  const envTotalsDisplay =
    viewMode === 'historical' ? envTotals : liveRows.length
  const envEligibleDisplay =
    viewMode === 'historical' ? envEligible : liveRows.length
  const envHighestDisplay =
    viewMode === 'historical'
      ? envHighest
      : liveRows.length > 0
      ? liveRows[0].envScore
      : null

  // Environment metadata and repo mapping (fallbacks; replace with real mappings when available)
  const repoMap: Record<string, string> = {
    abd: 'https://github.com/cisterciansis/afffine-dash-starter',
    ded: 'https://github.com/cisterciansis/afffine-dash-starter',
    elr: 'https://github.com/cisterciansis/afffine-dash-starter',
    hvm: 'https://github.com/cisterciansis/afffine-dash-starter',
    mth: 'https://github.com/cisterciansis/afffine-dash-starter',
    sat: 'https://github.com/cisterciansis/afffine-dash-starter',
  }

  const descriptionMap: Record<string, string> = {
    abd: 'ABD environment code and evaluation hooks.',
    ded: 'DED environment code and evaluation hooks.',
    elr: 'ELR environment code and evaluation hooks.',
    hvm: 'HVM environment code and evaluation hooks.',
    mth: 'MTH environment code and evaluation hooks.',
    sat: 'SAT environment code and evaluation hooks.',
  }

  const activeEnvMeta = {
    id: envKey,
    name: envName,
    description: descriptionMap[envKey] || `${envName} environment`,
    repoUrl: rawEnv.startsWith('agentgym:')
      ? `https://github.com/AffineFoundation/affine/blob/fe575aa38112e3227ff6503a366328b8bdecae1f/affine/quixand/env_templates/agentgym/agentenv/agentenv/envs/${envKey}.py`
      : `https://github.com/AffineFoundation/affine/blob/main/affine/envs/${envKey}.py`,
    models: Array.from({ length: envTotalsDisplay }),
  }

  // Formatting helpers aligned with OverviewTable
  const fmt = (n: number | null | undefined, digits = 1) =>
    n == null ? '—' : n.toFixed(digits)
  const dash = '—'
  const midTrunc = (s: string, max = 48) => {
    if (!s) return s as unknown as string
    if (s.length <= max) return s
    const half = Math.floor((max - 1) / 2)
    return s.slice(0, half) + '…' + s.slice(s.length - half)
  }

  // Grid columns: Rank | UID | Model | Rev | Env Score | Overall Avg | Success % | Avg Latency | Rollouts
  const gridCols =
    'grid grid-cols-[56px_72px_minmax(0,1.1fr)_88px_minmax(112px,1fr)_96px_96px_128px_104px] gap-2 items-center'

  return (
    <div className="space-y-6 text-light-500 dark:text-dark-500">
      {showCode && (
        <CodeViewer
          environment={activeEnvMeta}
          theme={theme}
          onClose={() => setShowCode(false)}
        />
      )}

      {/* Environment Overview Stats (mirrors subnet overview styling) */}
      {/* <Card
        title={`${envName.toUpperCase()} OVERVIEW`}
        theme={theme}
        className="bg-light-100 dark:bg-dark-100"
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-sans font-bold text-light-500 dark:text-dark-500">
              {overviewLoading ? '—' : envTotalsDisplay}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider text-light-400 dark:text-dark-400">
              Models
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-sans font-bold text-green-600 dark:text-green-400">
              {overviewLoading ? '—' : envEligibleDisplay}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider text-light-400 dark:text-dark-400">
              Eligible
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-sans font-bold text-light-500 dark:text-dark-500">
              {overviewLoading ? '—' : fmt(envHighestDisplay, 1)}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider text-light-400 dark:text-dark-400">
              Highest Score
            </div>
          </div>
        </div>
      </Card> */}

      {/* Top Models Table for this Environment */}
      <Card
        title={
          <span
            className="font-sans"
            style={{
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '100%',
              letterSpacing: '0%',
              textTransform: 'uppercase',
            }}
          >
            {`Top Models in ${envName.toUpperCase()}`}
          </span>
        }
        theme={theme}
        className="overflow-x-auto"
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
        <div className="px-3 pt-3">
          <TablePaginationControls
            theme={theme}
            total={tableTotal}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </div>
        <div className="p-3">
          {viewMode === 'live' ? (
            <EnvironmentLiveTable
              theme={theme}
              rows={pagedLive}
              loading={isLiveLoading}
              errorMsg={liveError}
              envName={envName.toUpperCase()}
              startIndex={startIndex}
            />
          ) : (
            <DataTable
              theme={theme}
              columns={[
                { key: '#', label: '#' },
                { key: 'uid', label: 'UID' },
                {
                  key: 'model',
                  label: 'Model',
                  align: 'left',
                  render: (value) => (
                    <span title={value}>{midTrunc(value, 32)}</span>
                  ),
                },
                {
                  key: 'rev',
                  label: 'Rev',
                  render: (value) => (
                    <span title={String(value)}>
                      {midTrunc(String(value), 10)}
                    </span>
                  ),
                },
                { key: 'envScore', label: `${envName.toUpperCase()} Score` },
                { key: 'overallAvg', label: 'Overall Avg' },
                { key: 'successRate', label: 'Success %' },
                { key: 'avgLatency', label: 'Avg Latency (s)' },
                { key: 'rollouts', label: 'Rollouts' },
              ]}
              data={pagedHistorical.map(({ row, value }, idx) => ({
                '#': startIndex + idx + 1,
                uid: row.uid,
                model: row.model,
                rev: row.rev,
                envScore: fmt(value, 1),
                overallAvg: fmt(row.overall_avg_score, 1),
                successRate: `${row.success_rate_percent.toFixed(1)}%`,
                avgLatency:
                  row.avg_latency == null
                    ? dash
                    : row.avg_latency.toFixed(2),
                rollouts: row.total_rollouts.toLocaleString(),
              }))}
              loading={tableLoading}
              error={
                tableError
                  ? tableError instanceof Error
                    ? tableError.message
                    : String(tableError)
                  : null
              }
              gridCols={gridCols}
              pageSize={pageSize}
            />
          )}
        </div>
      </Card>
      {/* {!tableLoading && (
        <div className="columns-2 gap-4 space-y-4">
          <div className="break-inside-avoid">
            <ScoreDistributionHistogram env={apiEnvName} theme={theme} />
          </div>
          <div className="break-inside-avoid">
            <LatencyBoxPlot env={apiEnvName} theme={theme} />
          </div>
        </div>
      )} */}
    </div>
  )
}

export default EnvironmentPage
