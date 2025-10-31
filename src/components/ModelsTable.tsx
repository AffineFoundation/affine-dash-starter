import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, MoreVertical, Search } from 'lucide-react'
import { LiveEnrichmentRow } from '../services/api'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { Skeleton, SkeletonText } from './Skeleton'
import TablePaginationControls from './TablePaginationControls'
import ScoreCell, { getEnvScoreStats } from './ScoreCell'

const buildRolloutsUrl = (modelName: string | null | undefined) => {
  if (!modelName) return '/api/rollouts/model';
  const raw = String(modelName).trim();
  if (!raw) return '/api/rollouts/model';
  const segments = raw
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  const path = '/api/rollouts/model';
  const params = new URLSearchParams();
  params.set('model', segments.length ? segments.join('/') : raw);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

const buildRolloutsDownloadName = (modelName: string | null | undefined) => {
  const safe = (modelName ?? '').replace(/[^\w.-]/g, '_') || 'model';
  return `rollouts_${safe}.jsonl`;
};

interface ModelsTableProps {
  theme: 'light' | 'dark'
  rows: any[]
  loading: boolean
  errorMsg: string | null
  viewMode: 'historical' | 'live'
  enrichedMap: Record<string, LiveEnrichmentRow>
  sortField: string
  sortDir: 'asc' | 'desc'
  toggleSort: (field: string) => void
  liveKey: (uid: string | number, model: string) => string
  searchQuery: string
  setSearchQuery: (query: string) => void
  currentBlock: number | null | undefined
  currentBlockLoading: boolean
  currentBlockError: string | null
}

const ModelsTable: React.FC<ModelsTableProps> = ({
  theme,
  rows,
  loading,
  errorMsg,
  viewMode,
  enrichedMap,
  sortField,
  sortDir,
  toggleSort,
  liveKey,
  searchQuery,
  setSearchQuery,
  currentBlock,
  currentBlockLoading,
  currentBlockError,
}) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const { environments: envs } = useEnvironments()
  const actionContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const L_SUBSETS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8']

  type DetailCell = {
    label: string
    value: React.ReactNode
    emphasize?: boolean
  }

  const chunkList = <T,>(list: T[], parts: number): T[][] => {
    if (parts <= 0) return []
    if (list.length === 0) {
      return Array.from({ length: parts }, () => [])
    }
    const size = Math.ceil(list.length / parts)
    return Array.from({ length: parts }, (_, index) =>
      list.slice(index * size, index * size + size),
    )
  }

  const toNumber = (value: unknown): number | null => {
    if (value == null || value === '') return null
    const numeric =
      typeof value === 'number' ? value : parseFloat(String(value))
    return Number.isFinite(numeric) ? numeric : null
  }

  const DetailItem = ({
    label,
    value,
    emphasize = false,
  }: DetailCell) => {
    const hasValue =
      value !== null &&
      value !== undefined &&
      value !== '' &&
      value !== '—'

    const display = hasValue ? value : '—'
    const valueClass = hasValue
      ? emphasize
        ? 'font-semibold text-light-smoke'
        : 'font-medium text-light-slate'
      : 'font-medium text-light-iron'

    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-[11px] uppercase tracking-[0.18em] text-light-slate">
          {label}
        </span>
        <span
          className={`flex items-center justify-end text-sm ${valueClass}`}
        >
          {display}
        </span>
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(rows.length, startIndex + pageSize)
  const pagedRows = rows.slice(startIndex, endIndex)

  const envBestMin = useMemo(() => {
    if (viewMode !== 'live') return {}
    const best: Record<string, number> = {}
    rows.forEach((row: any) => {
      if (!row || !row.envScores) return
      envs.forEach((env) => {
        const stats = getEnvScoreStats(row.envScores[env])
        if (!stats) return
        const currentBest = best[env]
        if (currentBest == null || stats.min > currentBest) {
          best[env] = stats.min
        }
      })
    })
    return best
  }, [rows, envs, viewMode])

  useEffect(
    () => setPage(1),
    [pageSize, rows.length, sortField, sortDir, viewMode],
  )
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const fmt = (n: number | null | undefined, digits = 1) =>
    n == null ? '—' : n.toFixed(digits)

  const fmtTs = (iso: string | null | undefined) =>
    !iso ? '—' : new Date(iso).toLocaleString()
  const dash = '—'
  const midTrunc = (s: string, max = 36) =>
    s && s.length > max
      ? `${s.slice(0, max / 2)}…${s.slice(s.length - max / 2)}`
      : s
  const computeAge = (firstBlock: number | null | undefined): number | null => {
    if (
      typeof currentBlock !== 'number' ||
      !Number.isFinite(currentBlock) ||
      firstBlock == null ||
      !Number.isFinite(firstBlock)
    ) {
      return null
    }
    const age = Math.floor(currentBlock - firstBlock)
    if (!Number.isFinite(age)) return null
    return Math.max(0, age)
  }
  const formatAge = (age: number | null) =>
    age == null ? dash : age.toLocaleString()
  const formatAlpha = (raw: string | null | undefined) => {
    if (!raw) return dash
    try {
      const base = BigInt(1_000_000_000)
      const value = BigInt(raw)
      const whole = value / base
      const fraction = value % base
      const normalized =
        Number(`${whole.toString()}.${fraction.toString().padStart(9, '0')}`)
      if (!Number.isFinite(normalized)) return dash
      return normalized.toFixed(2)
    } catch {
      return raw
    }
  }

  const sortIndicator = (field: string) =>
    viewMode !== 'live' || sortField !== field ? (
      ''
    ) : sortDir === 'asc' ? (
      <span className="ml-1">▲</span>
    ) : (
      <span className="ml-1">▼</span>
    )

  const toggleExpanded = (uniqueId: string) =>
    setExpandedModel((prev) => (prev === uniqueId ? null : uniqueId))

  const handleRowClick = (uniqueId: string) => {
    toggleExpanded(uniqueId)
    setOpenMenuId(null)
  }

  // Keyboard shortcut handler
  useEffect(() => {
    const activeId = openMenuId ?? hoveredRowId
    if (!activeId) return

    const onKey = (e: KeyboardEvent) => {
      const row = rows.find((r) => r.uniqueId === activeId)
      if (!row) return
      const key = e.key.toLowerCase()
      if (key === 'escape') {
        setOpenMenuId(null)
        setHoveredRowId(null)
      }
      if (key === 't') {
        toggleExpanded(row.uniqueId)
        setOpenMenuId(null)
      }
      if (key === 'h') {
        window.open(`https://huggingface.co/${row.model}`, '_blank')
        setOpenMenuId(null)
      }
      if (key === 'c') {
        const chuteId =
          (row as any).chute_id ??
          enrichedMap[liveKey(row.uid, row.model)]?.chute_id
        if (chuteId) {
          window.open(`https://chutes.ai/app/chute/${chuteId}`, '_blank')
        }
        setOpenMenuId(null)
      }
      if (key === 'd') {
        const url = buildRolloutsUrl(row.model as string)
        const link = document.createElement('a')
        link.href = url
        link.download = buildRolloutsDownloadName(row.model as string)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setOpenMenuId(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openMenuId, hoveredRowId, rows, enrichedMap, liveKey])

  useEffect(() => {
    if (!openMenuId) return

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      const container = actionContainerRefs.current[openMenuId]
      if (container && target && container.contains(target)) {
        return
      }
      setOpenMenuId(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [openMenuId])

  const thClasses =
    'px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-left border-r border-black/5 last:border-r-0 whitespace-nowrap font-normal'
  const tdClasses = 'px-3 py-3 font-medium text-xs leading-snug tracking-wide'

  const pagedStartIndex = rows.length === 0 ? 0 : (page - 1) * pageSize + 1
  const pagedEndIndex = Math.min(rows.length, page * pageSize)
  const blockStatus = currentBlockError
    ? 'Block unavailable'
    : currentBlock
    ? `Block ${currentBlock.toLocaleString()}`
    : currentBlockLoading
    ? 'Block syncing…'
    : 'Block —'

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-sm uppercase tracking-wide leading-none [word-spacing:0.5rem] md:[word-spacing:15px] text-light-slate font-medium">
            <span className="hidden md:inline">Showing </span>
            <span className="text-light-smoke">
              {pagedStartIndex}–{pagedEndIndex}
            </span>{' '}
            of <span className="text-light-smoke">{rows.length}</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-light-slate">
            {blockStatus}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model, UID, or hotkey"
              className="pl-10 pr-4 py-2 text-sm border rounded-md bg-light-haze text-light-smoke border-black/12 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <TablePaginationControls
            theme={theme}
            total={rows.length}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[4px] bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="text-light-smoke outline outline-4 -outline-offset-4 outline-white">
            <tr className="border-b border-black/5 h-8 bg-light-haze">
              <th className={thClasses}>
                <button
                  disabled={viewMode !== 'live'}
                  onClick={() => toggleSort('model')}
                  className="flex items-center"
                >
                  <span className="uppercase">Model</span>
                  <span>{sortIndicator('model')}</span>
                </button>
              </th>
              {viewMode === 'live' ? (
                <th className={thClasses}>
                  <button
                    className="flex items-center"
                    onClick={() => toggleSort('emission')}
                  >
                    <span className="uppercase">ⴷ/hr</span>
                    <span>{sortIndicator('emission')}</span>
                  </button>
                </th>
              ) : (
                <th className={thClasses}>Avg Latency (s)</th>
              )}
              {envs.map((env) => (
                <th key={env} className={thClasses}>
                  <button
                    disabled={viewMode !== 'live'}
                    onClick={() => toggleSort(env)}
                    className="flex items-center"
                  >
                    <span className="uppercase">{env.split(':')[1]}</span>
                    <span>{sortIndicator(env)}</span>
                  </button>
                </th>
              ))}
              <th className={thClasses}>Age</th>
              <th className={thClasses}>Eligible</th>
            </tr>
          </thead>
          <tbody className="text-light-smoke divide-y divide-black/5">
            {errorMsg && (
              <tr>
                <td
                  colSpan={envs.length + 4}
                  className="p-4 text-red-600 dark:text-red-400"
                >
                  {errorMsg}
                </td>
              </tr>
            )}
            {loading &&
              !errorMsg &&
              Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                <tr key={i} className="">
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-48" />
                  </td>
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-20" />
                  </td>
                  {envs.map((env) => (
                    <td key={env} className={tdClasses}>
                      <SkeletonText
                        theme={theme}
                        className="h-4 w-12 mx-auto"
                      />
                    </td>
                  ))}
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-12 mx-auto" />
                  </td>
                  <td className={`${tdClasses} px-2`}>
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton theme={theme} className="h-4 w-4 rounded-full" />
                      <Skeleton
                        theme={theme}
                        className="h-6 w-6 rounded-[2px]"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            {!loading &&
              !errorMsg &&
              pagedRows.map((model: any) => {
                const isLive = viewMode === 'live'
                const enriched = isLive
                  ? enrichedMap[liveKey(model.uid, model.model)]
                  : null
                const chuteId = isLive ? enriched?.chute_id : model.chute_id
                const eligibleBadge = model.eligible ? (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-[2px] bg-[#D39C37]">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                ) : null
                const eligibleSummaryValue = model.eligible ? (
                  <span className="inline-flex items-center gap-2">
                    {eligibleBadge}
                    <span className="text-[11px] uppercase tracking-[0.18em] text-light-slate">
                      Yes
                    </span>
                  </span>
                ) : (
                  'No'
                )
                const avgScoreValue = isLive
                  ? fmt(model.avgScore as number | null)
                  : fmt(model.overall_avg_score as number | null)
                const avgLatencyValue = isLive
                  ? fmt(toNumber(enriched?.avg_latency), 2)
                  : fmt(toNumber((model as any).avg_latency), 2)
                const firstBlockRaw = isLive
                  ? toNumber(model.firstBlk)
                  : toNumber(
                      (model as any).first_block ?? (model as any).firstBlk,
                    )
                const ageRaw = isLive ? computeAge(firstBlockRaw) : null
                const ageValue = formatAge(ageRaw)
                const ptsValue = fmt(toNumber((model as any).pts), 4)
                const weightValue = fmt(toNumber((model as any).weight), 4)
                const emissionValue = formatAlpha(
                  (model as any).emissionRaw ?? null,
                )
                const revDisplay =
                  model.rev && model.rev !== '' ? (
                    <span className="font-mono">{model.rev}</span>
                  ) : (
                    '—'
                  )
                const hotkeyDisplay =
                  model.hotkey && model.hotkey !== '' ? (
                    <span className="font-mono" title={model.hotkey}>
                      {midTrunc(model.hotkey, 18)}
                    </span>
                  ) : (
                    '—'
                  )
                const envEntries: DetailCell[] = isLive
                  ? Object.entries(model.envScores).map(
                      ([fullName, score]) => {
                        const stats = getEnvScoreStats(score)
                        const label = fullName.split(':')[1] ?? fullName
                        return {
                          label,
                          value:
                            stats != null
                              ? `${stats.minFormatted}-${stats.maxFormatted}`
                              : '—',
                        }
                      },
                    )
                  : envs.map((env) => {
                      const key = env.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                      const label = env.includes(':')
                        ? env.split(':')[1]
                        : env
                      const raw = (model as any)[key]
                      return {
                        label,
                        value: fmt(toNumber(raw)),
                      }
                    })
                const envColumns = chunkList(envEntries, 2)
                const lEntries = L_SUBSETS.map((subset) => {
                  const raw = (model as any)[subset.toLowerCase()]
                  const numeric = toNumber(raw)
                  if (numeric == null) return null
                  return {
                    label: subset,
                    value: fmt(numeric),
                  }
                }).filter(Boolean) as DetailCell[]
                const baseMetricItems: DetailCell[] = [
                  { label: 'Age', value: ageValue },
                  ...(firstBlockRaw != null
                    ? [{ label: 'FirstBlk', value: fmt(firstBlockRaw, 0) }]
                    : []),
                  { label: 'PTS', value: ptsValue },
                  { label: 'Weight', value: weightValue },
                  { label: 'Emission', value: emissionValue },
                ]
                const lowerColumns: DetailCell[][] = [
                  baseMetricItems,
                  envColumns[0] ?? [],
                  envColumns[1] ?? [],
                  lEntries,
                ].map((column) =>
                  column.length ? column : [{ label: '', value: '—' }],
                )
                const summaryColumns: DetailCell[][] = [
                  [
                    {
                      label: 'UID',
                      value: model.uid ?? '—',
                      emphasize: true,
                    },
                    { label: 'Eligible', value: eligibleSummaryValue },
                  ],
                  [
                    { label: 'Rev', value: revDisplay, emphasize: true },
                    { label: 'HotKey', value: hotkeyDisplay },
                  ],
                  [
                    {
                      label: 'Samples',
                      value: model.samples?.toLocaleString() ?? '—',
                      emphasize: true,
                    },
                    {
                      label: 'Avg Score',
                      value: avgScoreValue,
                      emphasize: true,
                    },
                    { label: 'Avg Latency', value: avgLatencyValue },
                  ],
                ]

                return (
                  <React.Fragment key={model.uniqueId}>
                    <tr
                      onClick={() => handleRowClick(model.uniqueId)}
                      onMouseEnter={() => setHoveredRowId(model.uniqueId)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className="transition-colors duration-300 group hover:bg-light-sand/50 cursor-pointer"
                    >
                      <td
                        className={`${tdClasses} truncate`}
                        title={model.model}
                      >
                        {midTrunc(model.model, 48)}
                      </td>
                      <td className={tdClasses}>
                        {isLive
                          ? formatAlpha((model as any).emissionRaw ?? null)
                          : fmt(model.avg_latency as number | null, 2)}
                      </td>
                      {envs.map((env) => {
                        const envScore = isLive
                          ? model.envScores[env]
                          : (model as any)[
                              env.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                            ]
                        const stats = isLive
                          ? getEnvScoreStats(envScore)
                          : null
                        const bestMin = envBestMin[env]
                        const highlight =
                          isLive &&
                          stats != null &&
                          bestMin != null &&
                          Math.abs(stats.min - bestMin) < 1e-6
                        return (
                          <td key={env} className={tdClasses}>
                            {isLive ? (
                              <ScoreCell score={envScore} highlight={highlight} />
                            ) : (
                              fmt(envScore as number | null)
                            )}
                          </td>
                        )
                      })}
                      <td className={tdClasses}>{ageValue}</td>
                      <td className={`${tdClasses} px-2`}>
                        <div className="flex items-center justify-center gap-2">
                          {model.eligible ? (
                            <div
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: '#D39C37',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '2px',
                              }}
                            >
                              <Check
                                style={{
                                  width: '8.5px',
                                  height: '6px',
                                  color: '#FFFFFF',
                                  strokeWidth: '6',
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-sm font-sans text-light-iron">
                              {dash}
                            </span>
                          )}
                          <div
                            className="relative"
                            ref={(node) => {
                              if (node) {
                                actionContainerRefs.current[model.uniqueId] = node
                              } else {
                                delete actionContainerRefs.current[model.uniqueId]
                              }
                            }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setOpenMenuId((prev) =>
                                  prev === model.uniqueId ? null : model.uniqueId,
                                )
                              }}
                              title="Actions (open menu)"
                              className="h-6 w-6 flex items-center justify-center opacity-0 cursor-none group-hover:opacity-100 group-hover:cursor-pointer transition-opacity duration-300"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === model.uniqueId && (
                              <div
                                className="absolute right-0 mt-1 w-56 z-20 rounded-md overflow-hidden shadow-lg bg-light-75 text-light-500 dark:bg-dark-200 dark:text-dark-500"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    toggleExpanded(model.uniqueId)
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center justify-between px-3 h-9 text-sm text-left transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                                >
                                  <span>Toggle details</span>
                                  <span className="text-xs opacity-70">T</span>
                                </button>
                                <a
                                  href={`https://huggingface.co/${model.model}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex w-full items-center justify-between px-3 h-9 text-sm transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                                >
                                  <span>View on Hugging Face</span>
                                  <span className="text-xs opacity-70">H</span>
                                </a>
                                <a
                                  href={buildRolloutsUrl(model.model as string)}
                                  download={buildRolloutsDownloadName(
                                    model.model as string,
                                  )}
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex w-full items-center justify-between px-3 h-9 text-sm transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                                >
                                  <span>Download rollouts</span>
                                  <span className="text-xs opacity-70">D</span>
                                </a>
                                {chuteId ? (
                                  <a
                                    href={`https://chutes.ai/app/chute/${chuteId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex w-full items-center justify-between px-3 h-9 text-sm transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                                  >
                                    <span>Open Chutes</span>
                                    <span className="text-xs opacity-70">C</span>
                                  </a>
                                ) : (
                                  <div className="flex w-full items-center justify-between px-3 h-9 text-sm opacity-50">
                                    <span>Open Chutes</span>
                                    <span className="text-xs opacity-70">C</span>
                                  </div>
                                )}
                                <div className="px-3 py-2 border-t text-[11px] font-sans opacity-70 border-light-200 dark:border-dark-350">
                                  Shortcuts: T, H, D, C, Esc
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedModel === model.uniqueId && (
                      <tr>
                        <td
                          colSpan={envs.length + 4}
                          className="bg-white px-0 py-8"
                        >
                          <div className="mx-5 rounded-md border border-light-iron bg-white text-xs font-sans text-light-smoke shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-light-iron">
                              {summaryColumns.map((column, columnIndex) => (
                                <div
                                  key={`summary-${columnIndex}`}
                                  className="min-h-[84px] px-5 py-4 space-y-1.5"
                                >
                                  {column.map((item, itemIndex) => (
                                    <DetailItem
                                      key={`${item.label || 'summary'}-${itemIndex}`}
                                      {...item}
                                    />
                                  ))}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-light-iron border-t border-light-iron">
                              {lowerColumns.map((column, columnIndex) => (
                                <div
                                  key={`detail-${columnIndex}`}
                                  className="min-h-[110px] px-5 py-4 space-y-1.5"
                                >
                                  {column.map((item, itemIndex) => (
                                    <DetailItem
                                      key={`${item.label || 'detail'}-${itemIndex}`}
                                      {...item}
                                    />
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ModelsTable
