import React, { useEffect, useState } from 'react'
import { Check, MoreVertical } from 'lucide-react'
import { LiveEnrichmentRow } from '../services/api'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { Skeleton, SkeletonText } from './Skeleton'
import TablePaginationControls from './TablePaginationControls'
import ScoreCell from './ScoreCell'

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
}) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const { environments: envs } = useEnvironments()

  const L_SUBSETS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8']

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(rows.length, startIndex + pageSize)
  const pagedRows = rows.slice(startIndex, endIndex)

  useEffect(
    () => setPage(1),
    [pageSize, rows.length, sortField, sortDir, viewMode],
  )
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const fmt = (n: number | null | undefined, digits = 1) =>
    n == null ? '—' : n.toFixed(digits)

  const parseScoreValue = (v: unknown): number | null =>
    v == null
      ? null
      : parseFloat(String(v).replace(/\*/g, '').split('/')[0]) || null
  const fmtTs = (iso: string | null | undefined) =>
    !iso ? '—' : new Date(iso).toLocaleString()
  const dash = '—'
  const midTrunc = (s: string, max = 36) =>
    s && s.length > max
      ? `${s.slice(0, max / 2)}…${s.slice(s.length - max / 2)}`
      : s

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
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openMenuId, hoveredRowId, rows, enrichedMap, liveKey])

  const thClasses =
    'px-3 py-2 text-xs font-mono uppercase tracking-wide text-left border-r border-black/5 last:border-r-0 whitespace-nowrap font-mono font-normal'
  const tdClasses =
    'p-5 font-medium text-sm leading-none tracking-wide border-r border-black/5 last:border-r-0'

  return (
    <div className="space-y-3">
      <TablePaginationControls
        theme={theme}
        total={rows.length}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      <div className="overflow-x-auto rounded-[4px] bg-white border border-light-200 dark:border-dark-200">
        <table className="min-w-full border-collapse">
          <thead className="text-light-smoke">
            <tr className="border-b border-black/5 h-8 bg-light-haze">
              <th className={`${thClasses} pr-3`}>
                <button
                  disabled={viewMode !== 'live'}
                  onClick={() => toggleSort('uid')}
                  className="flex items-center"
                >
                  <span className="uppercase">Uid</span>
                  <span>{sortIndicator('uid')}</span>
                </button>
              </th>
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
              <th className={thClasses}>Rev</th>
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
              <th className={thClasses}>
                <button
                  disabled={viewMode !== 'live'}
                  onClick={() => toggleSort('avgScore')}
                  className="flex items-center"
                >
                  <span className="uppercase">Avg Score</span>
                  <span>{sortIndicator('avgScore')}</span>
                </button>
              </th>
              {L_SUBSETS.map((subset) => (
                <th key={subset} className={thClasses}>
                  <button
                    disabled={viewMode !== 'live'}
                    onClick={() => toggleSort(subset)}
                    className="flex items-center"
                  >
                    <span className="uppercase">{subset}</span>
                    <span>{sortIndicator(subset)}</span>
                  </button>
                </th>
              ))}
              <th className={thClasses}>
                <button
                  disabled={viewMode !== 'live'}
                  onClick={() => toggleSort('pts')}
                  className="flex items-center"
                >
                  <span className="uppercase">Points</span>
                  <span>{sortIndicator('pts')}</span>
                </button>
              </th>
              <th className={thClasses}>FirstBlk</th>
              <th className={thClasses}>Eligible</th>
              <th className={thClasses}>Hotkey</th>
              <th className={thClasses}>
                {viewMode === 'live' ? (
                  <button
                    onClick={() => toggleSort('weight')}
                    className="flex items-center"
                  >
                    <span className="uppercase">Weight</span>
                    <span>{sortIndicator('weight')}</span>
                  </button>
                ) : (
                  'Avg Latency (s)'
                )}
              </th>
            </tr>
          </thead>
          <tbody className="text-light-smoke divide-y divide-black/5">
            {errorMsg && (
              <tr>
                <td
                  colSpan={11 + envs.length + L_SUBSETS.length}
                  className="p-4 text-red-600 dark:text-red-400"
                >
                  {errorMsg}
                </td>
              </tr>
            )}
            {loading &&
              !errorMsg &&
              Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                <tr
                  key={i}
                  className=""
                >
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-12" />
                  </td>
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-48" />
                  </td>
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-3 w-10" />
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
                    <SkeletonText
                      theme={theme}
                      className="h-4 w-12 mx-auto"
                    />
                  </td>
                  {L_SUBSETS.map((subset) => (
                    <td key={subset} className={tdClasses}>
                      <SkeletonText
                        theme={theme}
                        className="h-4 w-8 mx-auto"
                      />
                    </td>
                  ))}
                  <td className={tdClasses}>
                    <SkeletonText
                      theme={theme}
                      className="h-4 w-12 mx-auto"
                    />
                  </td>
                  <td className={tdClasses}>
                    <SkeletonText
                      theme={theme}
                      className="h-4 w-12 mx-auto"
                    />
                  </td>
                  <td className={tdClasses}>
                    <div className="flex items-center justify-center">
                      <Skeleton
                        theme={theme}
                        className="h-4 w-4 rounded-full"
                      />
                    </div>
                  </td>
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-16" />
                  </td>
                  <td className={tdClasses}>
                    <div className="flex items-center justify-between gap-2">
                      <SkeletonText theme={theme} className="h-4 w-16" />
                      <Skeleton theme={theme} className="h-8 w-8" />
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

                return (
                  <React.Fragment key={model.uniqueId}>
                    <tr
                      onMouseEnter={() => setHoveredRowId(model.uniqueId)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className="transition-colors duration-300 group"
                    >
                      <td className={`${tdClasses} pr-3`}>{model.uid}</td>
                      <td
                        className={`${tdClasses} truncate`}
                        title={model.model}
                      >
                        {midTrunc(model.model, 48)}
                      </td>
                      <td className={tdClasses} title={model.rev}>
                        {midTrunc(model.rev, 10)}
                      </td>
                      {envs.map((env) => {
                        const envScore = isLive
                          ? model.envScores[env]
                          : (model as any)[
                              env.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                            ]
                        return (
                          <td key={env} className={tdClasses}>
                            {isLive ? (
                              <ScoreCell score={envScore} />
                            ) : (
                              fmt(envScore as number | null)
                            )}
                          </td>
                        )
                      })}
                      <td className={tdClasses}>
                        {fmt(
                          isLive
                            ? (model.avgScore as number | null)
                            : (model.overall_avg_score as number | null),
                        )}
                      </td>
                      {L_SUBSETS.map((subset) => (
                        <td key={subset} className={tdClasses}>
                          {fmt(
                            isLive
                              ? (model[
                                  subset.toLowerCase() as keyof typeof model
                                ] as number | null)
                              : null,
                          )}
                        </td>
                      ))}
                      <td className={tdClasses}>
                        {fmt(isLive ? (model.pts as number | null) : null)}
                      </td>
                      <td className={tdClasses}>
                        {fmt(isLive ? (model.firstBlk as number | null) : null, 0)}
                      </td>
                      <td className={tdClasses}>
                        {model.eligible ? (
                          <div className="flex justify-center">
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
                          </div>
                        ) : (
                          <span className="text-sm font-sans text-center block">
                            {dash}
                          </span>
                        )}
                      </td>
                      <td className={tdClasses}>
                        <div
                          className="whitespace-nowrap"
                          title={isLive ? model.hotkey : model.hotkey}
                        >
                          {midTrunc(
                            isLive ? model.hotkey : model.hotkey,
                            16,
                          )}
                        </div>
                      </td>
                      <td className={tdClasses}>
                        <div className="flex items-center justify-between">
                          <div>
                            {isLive
                              ? fmt(model.weight as number | null, 4)
                              : fmt(model.avg_latency as number | null, 2)}
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId((prev) =>
                                    prev === model.uniqueId
                                      ? null
                                      : model.uniqueId,
                                  )
                                }
                                title="Actions (open menu)"
                                className="h-6 w-h-6 flex items-center justify-center opacity-0 cursor-none group-hover:opacity-100 group-hover:cursor-pointer transition-opacity duration-300"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openMenuId === model.uniqueId && (
                                <div className="absolute right-0 mt-1 w-56 z-20 rounded-md overflow-hidden shadow-lg bg-light-75 text-light-500 dark:bg-dark-200 dark:text-dark-500">
                                  <button
                                    onClick={() => {
                                      toggleExpanded(model.uniqueId)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex w-full items-center justify-between px-3 h-9 text-sm text-left transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                                  >
                                    <span>Toggle details</span>
                                    <span className="text-xs opacity-70">
                                      T
                                    </span>
                                  </button>
                                  <a
                                    href={`https://huggingface.co/${model.model}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex w-full items-center justify-between px-3 h-9 text-sm transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                                  >
                                    <span>View on Hugging Face</span>
                                    <span className="text-xs opacity-70">
                                      H
                                    </span>
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
                                      <span className="text-xs opacity-70">
                                        C
                                      </span>
                                    </a>
                                  ) : (
                                    <div className="flex w-full items-center justify-between px-3 h-9 text-sm opacity-50">
                                      <span>Open Chutes</span>
                                      <span className="text-xs opacity-70">
                                        C
                                      </span>
                                    </div>
                                  )}
                                  <div className="px-3 py-2 border-t text-[11px] font-sans opacity-70 border-light-200 dark:border-dark-350">
                                    Shortcuts: T, H, C, Esc
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedModel === model.uniqueId && (
                      <tr>
                        <td
                          colSpan={11 + envs.length + L_SUBSETS.length}
                          className="p-14 text-left"
                          style={{ backgroundColor: '#e9ebed' }}
                        >
                          <div className="text-xs font-sans grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                            <div>
                              <span className="font-bold">UID:</span>{' '}
                              {model.uid}
                            </div>
                            <div className="break-all">
                              <span className="font-bold">Rev:</span>{' '}
                              {model.rev}
                            </div>
                            <div>
                              <span className="font-bold">Avg Score:</span>{' '}
                              {fmt(
                                isLive
                                  ? (model.avgScore as number | null)
                                  : (model.overall_avg_score as number | null),
                              )}
                            </div>
                            <div>
                              <span className="font-bold">Success %:</span>{' '}
                              {isLive
                                ? enriched?.success_rate_percent != null
                                  ? `${enriched.success_rate_percent.toFixed(
                                      1,
                                    )}%`
                                  : dash
                                : model.success_rate_percent != null
                                ? `${model.success_rate_percent.toFixed(1)}%`
                                : dash}
                            </div>
                            <div>
                              <span className="font-bold">Eligible:</span>{' '}
                              {model.eligible ? 'Yes' : 'No'}
                            </div>
                            {isLive ? (
                              <>
                                <div>
                                  <span className="font-bold">
                                    Hotkey:
                                  </span>{' '}
                                  {model.hotkey}
                                </div>
                                <div>
                                  <span className="font-bold">
                                    Avg Latency (s):
                                  </span>{' '}
                                  {fmt(enriched?.avg_latency, 2)}
                                </div>
                                <div>
                                  <span className="font-bold">
                                    Total Rollouts:
                                  </span>{' '}
                                  {enriched?.total_rollouts?.toLocaleString() ??
                                    dash}
                                </div>
                                <div>
                                  <span className="font-bold">
                                    Last Rollout:
                                  </span>{' '}
                                  {fmtTs(enriched?.last_rollout_at)}
                                </div>
                                <div>
                                  <span className="font-bold">PTS:</span>{' '}
                                  {fmt(model.pts as number | null, 4)}
                                </div>
                                <div>
                                  <span className="font-bold">Weight:</span>{' '}
                                  {fmt(model.weight as number | null, 4)}
                                </div>
                                {Object.entries(model.envScores).map(
                                  ([name, score]) => (
                                    <div key={name}>
                                      <span className="font-bold">
                                        {name.split(':')[1]}:
                                      </span>{' '}
                                      {fmt(parseScoreValue(score))}
                                    </div>
                                  ),
                                )}
                                {model.l1 != null && (
                                  <div>
                                    <span className="font-bold">L1:</span>{' '}
                                    {fmt(model.l1 as number | null)}
                                  </div>
                                )}
                                {model.l2 != null && (
                                  <div>
                                    <span className="font-bold">L2:</span>{' '}
                                    {fmt(model.l2 as number | null)}
                                  </div>
                                )}
                                {model.l3 != null && (
                                  <div>
                                    <span className="font-bold">L3:</span>{' '}
                                    {fmt(model.l3 as number | null)}
                                  </div>
                                )}
                                {model.l4 != null && (
                                  <div>
                                    <span className="font-bold">L4:</span>{' '}
                                    {fmt(model.l4 as number | null)}
                                  </div>
                                )}
                                {model.l5 != null && (
                                  <div>
                                    <span className="font-bold">L5:</span>{' '}
                                    {fmt(model.l5 as number | null)}
                                  </div>
                                )}
                                {model.l6 != null && (
                                  <div>
                                    <span className="font-bold">L6:</span>{' '}
                                    {fmt(model.l6 as number | null)}
                                  </div>
                                )}
                                {model.l7 != null && (
                                  <div>
                                    <span className="font-bold">L7:</span>{' '}
                                    {fmt(model.l7 as number | null)}
                                  </div>
                                )}
                                {model.l8 != null && (
                                  <div>
                                    <span className="font-bold">L8:</span>{' '}
                                    {fmt(model.l8 as number | null)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="break-all">
                                  <span className="font-bold">
                                    Hotkey:
                                  </span>{' '}
                                  {model.hotkey}
                                </div>
                                <div>
                                  <span className="font-bold">
                                    Avg Latency (s):
                                  </span>{' '}
                                  {fmt(
                                    model.avg_latency as number | null,
                                    2,
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold">
                                    Total Rollouts:
                                  </span>{' '}
                                  {model.total_rollouts.toLocaleString()}
                                </div>
                                <div>
                                  <span className="font-bold">
                                    Last Rollout:
                                  </span>{' '}
                                  {fmtTs(model.last_rollout_at)}
                                </div>
                                {envs.map((env) => {
                                  const key = env
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, '_')
                                  return (
                                    <div key={env}>
                                      <span className="font-bold">
                                        {env}:
                                      </span>{' '}
                                      {fmt(
                                        (model as any)[key] as number | null,
                                      )}
                                    </div>
                                  )
                                })}
                              </>
                            )}
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
