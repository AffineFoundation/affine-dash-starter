import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Code, Search } from 'lucide-react'

import {
  fetchSubnetOverview,
  type SubnetOverviewRow,
} from '../services/api'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import EnvironmentLiveTable, {
  type SortField,
} from './EnvironmentLiveTable'
import TablePaginationControls from './TablePaginationControls'
import DataTable from './DataTable'
import Button from './Button'
import {
  transformSummaryForEnv,
  type EnvironmentMinerStat,
} from '../utils/summaryParser'
import useSubtensorChain from '../hooks/useSubtensorChain'
import { getEnvCodeUrl, getEnvRepoUrl } from '../utils/envLinks'

interface EnvironmentDetailProps {
  env: string
  theme: 'light' | 'dark'
  variant?: 'page' | 'modal'
  className?: string
}

const descriptionMap: Record<string, string> = {
  abd: 'ABD environment code and evaluation hooks.',
  ded: 'DED environment code and evaluation hooks.',
  elr: 'ELR environment code and evaluation hooks.',
  hvm: 'HVM environment code and evaluation hooks.',
  mth: 'MTH environment code and evaluation hooks.',
  sat: 'SAT environment code and evaluation hooks.',
}

const legacyEnvNameMapping: Record<string, string> = {
  'affine:abd': 'ABD',
  'affine:sat': 'SAT',
  'affine:ded': 'DED',
}

const EnvironmentDetail: React.FC<EnvironmentDetailProps> = ({
  env,
  theme,
  variant = 'page',
  className = '',
}) => {
  const rawEnv = env
  const envName = rawEnv.toUpperCase()
  const envKey = envName.toLowerCase().replace(/.*:/, '')
  const apiEnvName = legacyEnvNameMapping[rawEnv] || rawEnv

  const [viewMode, setViewMode] = useState<'live' | 'historical'>('live')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('lower_bound')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    setSearchQuery('')
    setPage(1)
    setViewMode('live')
    setSortField('lower_bound')
    setSortDir('desc')
  }, [rawEnv])

  const { emissionByUid, currentBlock, alphaPriceUsd } = useSubtensorChain()

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

  const ranked = rows
    .map((r) => {
      const value = (r as SubnetOverviewRow & Record<string, number>)[
        envKey
      ] as number | null | undefined
      return { row: r, value: value == null ? null : value }
    })
    .filter((x) => x.value != null)
  ranked.sort((a, b) => b.value! - a.value!)

  const liveRows = useMemo(
    () => transformSummaryForEnv(liveSummary, rawEnv, emissionByUid),
    [liveSummary, rawEnv, emissionByUid],
  )

  const filteredLiveRows = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase()
    if (!trimmed) return liveRows
    return liveRows.filter((row) => {
      const model = (row.model ?? '').toLowerCase()
      const uid = String(row.uid ?? '').toLowerCase()
      const hotkey = (row.hotkey ?? '').toLowerCase()
      return (
        model.includes(trimmed) ||
        uid.includes(trimmed) ||
        hotkey.includes(trimmed)
      )
    })
  }, [liveRows, searchQuery])

  const filteredHistorical = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase()
    if (!trimmed) return ranked
    return ranked.filter(({ row }) => {
      const model = String(row.model ?? '').toLowerCase()
      const uid = String(row.uid ?? '').toLowerCase()
      const hotkey = String((row as any).hotkey ?? '').toLowerCase()
      return (
        model.includes(trimmed) ||
        uid.includes(trimmed) ||
        hotkey.includes(trimmed)
      )
    })
  }, [ranked, searchQuery])

  const sortedLiveRows = useMemo(() => {
    const getNumeric = (value: number | null | undefined) => {
      if (value == null) return Number.MIN_SAFE_INTEGER
      const numeric = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(numeric) ? numeric : Number.MIN_SAFE_INTEGER
    }
    const getValue = (row: EnvironmentMinerStat): number | string => {
      switch (sortField) {
        case 'model':
          return (row.model ?? '').toLowerCase()
        case 'sample_count':
          return getNumeric(row.sample_count)
        case 'average_score':
          return getNumeric(row.average_score)
        case 'lower_bound':
          return getNumeric(row.lower_bound)
        case 'emission':
          return getNumeric(row.emission)
        default:
          return Number.MIN_SAFE_INTEGER
      }
    }
    const sorted = [...filteredLiveRows]
    sorted.sort((a, b) => {
      const av = getValue(a)
      const bv = getValue(b)
      let comparison: number
      if (typeof av === 'string' || typeof bv === 'string') {
        comparison = String(av).localeCompare(String(bv))
      } else {
        comparison = (av as number) - (bv as number)
      }
      return sortDir === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredLiveRows, sortField, sortDir])

  const handleSort = (field: SortField) => {
    setSortDir((prev) =>
      sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc',
    )
    setSortField(field)
  }

  const tableTotal =
    viewMode === 'historical'
      ? filteredHistorical.length
      : sortedLiveRows.length
  const tableLoading =
    viewMode === 'historical'
      ? isLoading
      : isLiveLoading && sortedLiveRows.length === 0
  const tableError =
    viewMode === 'historical' ? (error as unknown) : (liveError as unknown)

  useEffect(() => {
    setPage(1)
  }, [pageSize, tableTotal])

  const isAllRows = !Number.isFinite(pageSize)
  const effectivePageSize = isAllRows ? tableTotal || 1 : pageSize
  const totalPages = isAllRows
    ? 1
    : Math.max(1, Math.ceil(tableTotal / effectivePageSize))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const startIndex = isAllRows ? 0 : (page - 1) * effectivePageSize
  const endIndex = isAllRows
    ? tableTotal
    : Math.min(tableTotal, startIndex + effectivePageSize)
  const pagedHistorical = isAllRows
    ? filteredHistorical
    : filteredHistorical.slice(startIndex, endIndex)
  const pagedLive = isAllRows
    ? sortedLiveRows
    : sortedLiveRows.slice(startIndex, endIndex)

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
      ? liveRows[0].average_score
      : null

  const repoUrl = getEnvRepoUrl(rawEnv)
  const codeUrl = getEnvCodeUrl(rawEnv)

  const fmt = (n: number | null | undefined, digits = 1) =>
    n == null ? '—' : n.toFixed(digits)
  const dash = '—'
  const midTrunc = (s: string, max = 48) => {
    if (!s) return s as unknown as string
    if (s.length <= max) return s
    const half = Math.floor((max - 1) / 2)
    return s.slice(0, half) + '…' + s.slice(s.length - half)
  }

  const gridCols =
    'grid grid-cols-[56px_72px_minmax(0,1.1fr)_88px_minmax(112px,1fr)_96px_96px_128px_104px] gap-2 items-center'

  return (
    <div
      className={`space-y-6 text-light-500 dark:text-dark-500 ${
        variant === 'modal' ? 'py-2' : ''
      } ${className}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] text-light-slate uppercase">
            Environment Overview
          </p>
          <h2 className="text-2xl font-sans font-semibold tracking-wide">
            {envName.replace(/.*:/, '')}
          </h2>
          <p className="text-sm text-light-smoke">
            {descriptionMap[envKey] || `${envName} environment`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => repoUrl && window.open(repoUrl, '_blank')}
            theme={theme}
            variant="secondary"
            disabled={!repoUrl}
          >
            <ExternalLink size={12} />
            View Repo
          </Button>
          <Button
            onClick={() => codeUrl && window.open(codeUrl, '_blank')}
            theme={theme}
            variant="secondary"
            disabled={!codeUrl}
          >
            <Code size={12} />
            View Code
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4 text-xs uppercase tracking-[0.18em] text-light-slate">
          <div>
            <p className="font-semibold text-lg text-light-500">
              {overviewLoading ? '—' : envTotalsDisplay}
            </p>
            <span>Models</span>
          </div>
          <div>
            <p className="font-semibold text-lg text-light-500">
              {overviewLoading ? '—' : envEligibleDisplay}
            </p>
            <span>Eligible</span>
          </div>
          <div>
            <p className="font-semibold text-lg text-light-500">
              {overviewLoading ? '—' : fmt(envHighestDisplay, 1)}
            </p>
            <span>Top Score</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="relative hidden md:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="pl-10 pr-4 py-2 text-sm border rounded-md bg-light-haze text-light-smoke border-black/12 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <TablePaginationControls
            theme={theme}
            total={tableTotal}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        {viewMode === 'live' ? (
          <EnvironmentLiveTable
            theme={theme}
            rows={pagedLive}
            loading={tableLoading}
            errorMsg={
              tableError
                ? tableError instanceof Error
                  ? tableError.message
                  : String(tableError)
                : null
            }
            envName={envName.toUpperCase()}
            currentBlock={currentBlock}
            sortField={sortField}
            sortDirection={sortDir}
            onSort={handleSort}
            alphaPriceUsd={alphaPriceUsd}
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
                row.avg_latency == null ? dash : row.avg_latency.toFixed(2),
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
    </div>
  )
}

export default EnvironmentDetail
