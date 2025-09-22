import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Check, MoreVertical } from 'lucide-react'
import { LiveEnrichmentRow } from '../services/api'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { Skeleton, SkeletonText } from './Skeleton'
import TablePaginationControls from './TablePaginationControls'

interface ModelsTableProps {
  theme: 'light' | 'dark'
  rows: any[]
  loading: boolean
  errorMsg: string | null
  viewMode: 'historical' | 'live'
  enrichedMap: Record<string, LiveEnrichmentRow>
  sortField: 'weight' | 'uid' | 'avgScore' | 'success' | 'pts' | 'model'
  sortDir: 'asc' | 'desc'
  toggleSort: (field: 'weight' | 'uid' | 'avgScore' | 'success' | 'pts' | 'model') => void
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
  liveKey
}) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState<number>(1)
  const { environments: envs } = useEnvironments()

  const gridCols = 'grid grid-cols-[72px_minmax(0,1fr)_72px_88px_96px_120px_72px_112px] gap-2 items-center'
  
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(rows.length, startIndex + pageSize)
  const pagedRows = rows.slice(startIndex, endIndex)

  useEffect(() => setPage(1), [pageSize, rows.length, sortField, sortDir, viewMode])
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const fmt = (n: number | null | undefined, digits = 1) => n == null ? '—' : n.toFixed(digits)
  const fmtTs = (iso: string | null | undefined) => !iso ? '—' : new Date(iso).toLocaleString()
  const dash = '—'
  const midTrunc = (s: string, max = 36) => s && s.length > max ? `${s.slice(0, max / 2)}…${s.slice(s.length - max / 2)}` : s

  const sortIndicator = (field: typeof sortField) =>
    viewMode !== 'live' || sortField !== field ? '' : sortDir === 'asc' ? '▲' : '▼'
  
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
        const chuteId = (row as any).chute_id ?? enrichedMap[liveKey(row.uid, row.model)]?.chute_id
        if (chuteId) {
          window.open(`https://chutes.ai/app/chute/${chuteId}`, '_blank')
        }
        setOpenMenuId(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openMenuId, hoveredRowId, rows, enrichedMap, liveKey])

  return (
    <div className="space-y-4">
      <TablePaginationControls
        theme={theme}
        total={rows.length}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* Models Table */}
      <div className={`border-2 rounded-none overflow-x-auto ${
        theme === 'dark' ? 'border-white bg-black' : 'border-gray-300 bg-white'
      }`}>
        {/* Table Header */}
        <div className={`p-3 border-b-2 ${
          theme === 'dark' ? 'border-white bg-gray-900' : 'border-gray-300 bg-slate-50'
        }`}>
          <div className={`${gridCols} text-center`}>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
              <button
                disabled={viewMode !== 'live'}
                onClick={() => toggleSort('uid')}
                className={`inline-flex items-center gap-1 ${
                  viewMode === 'live'
                    ? 'cursor-pointer underline-offset-2 hover:underline'
                    : 'opacity-60 cursor-default'
                }`}
              >
                <span>UID</span>
                <span>{sortIndicator('uid')}</span>
              </button>
            </div>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-left text-gray-900 dark:text-white">
              <button
                disabled={viewMode !== 'live'}
                onClick={() => toggleSort('model')}
                className={`inline-flex items-center gap-1 ${
                  viewMode === 'live'
                    ? 'cursor-pointer underline-offset-2 hover:underline'
                    : 'opacity-60 cursor-default'
                }`}
              >
                <span>Model</span>
                <span>{sortIndicator('model')}</span>
              </button>
            </div>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">Rev</div>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
              <button
                disabled={viewMode !== 'live'}
                onClick={() => toggleSort('avgScore')}
                className={`inline-flex items-center gap-1 ${
                  viewMode === 'live'
                    ? 'cursor-pointer underline-offset-2 hover:underline'
                    : 'opacity-60 cursor-default'
                }`}
              >
                <span>Avg Score</span>
                <span>{sortIndicator('avgScore')}</span>
              </button>
            </div>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
              <button
                disabled={viewMode !== 'live'}
                onClick={() => toggleSort('success')}
                className={`inline-flex items-center gap-1 ${
                  viewMode === 'live'
                    ? 'cursor-pointer underline-offset-2 hover:underline'
                    : 'opacity-60 cursor-default'
                }`}
              >
                <span>Success %</span>
                <span>{sortIndicator('success')}</span>
              </button>
            </div>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
              {viewMode === 'live' ? (
                <button
                  onClick={() => toggleSort('weight')}
                  className="inline-flex items-center gap-1 cursor-pointer underline-offset-2 hover:underline"
                >
                  <span>Weight</span>
                  <span>{sortIndicator('weight')}</span>
                </button>
              ) : (
                'Avg Latency (s)'
              )}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">Eligible</div>
            <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y-2 divide-gray-300">
          {errorMsg && (
            <div className={`p-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              {errorMsg}
            </div>
          )}

          {/* Skeleton Loader */}
          {loading && !errorMsg && Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
            <div key={i} className={`p-3 ${theme === 'dark' ? 'hover:bg-gray-800/40' : 'hover:bg-slate-50/60'}`}>
              <div className={`${gridCols} text-center`}>
                <SkeletonText theme={theme} className="h-4 w-12 mx-auto" />
                <div className="text-left">
                  <SkeletonText theme={theme} className="h-4 w-48" />
                </div>
                <SkeletonText theme={theme} className="h-3 w-10 mx-auto" />
                <SkeletonText theme={theme} className="h-4 w-12 mx-auto" />
                <SkeletonText theme={theme} className="h-4 w-12 mx-auto" />
                <SkeletonText theme={theme} className="h-4 w-16 mx-auto" />
                <div className="flex items-center justify-center">
                  <Skeleton theme={theme} className="h-4 w-4 rounded-full" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Skeleton theme={theme} className="h-8 w-8" />
                  <Skeleton theme={theme} className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}

          {/* Render Rows */}
          {!loading && !errorMsg && pagedRows.map((model: any) => {
            const isLive = viewMode === 'live'
            const enriched = isLive ? enrichedMap[liveKey(model.uid, model.model)] : null
            const chuteId = isLive ? enriched?.chute_id : model.chute_id

            return (
              <div
                key={model.uniqueId}
                onMouseEnter={() => setHoveredRowId(model.uniqueId)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                {/* Main Row */}
                <div className={`p-3 transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50'
                }`}>
                  <div className={`${gridCols} text-center`}>
                    <div className="text-sm font-sans font-bold tabular-nums whitespace-nowrap">
                      {model.uid}
                    </div>
                    <div
                      className="text-sm font-sans truncate whitespace-nowrap text-left text-gray-600 dark:text-gray-300"
                      title={model.model}
                    >
                      {midTrunc(model.model, 48)}
                    </div>
                    <div
                      className="text-xs font-sans whitespace-nowrap text-gray-600 dark:text-gray-300"
                      title={model.rev}
                    >
                      {midTrunc(model.rev, 10)}
                    </div>
                    <div className="text-sm font-sans font-bold tabular-nums whitespace-nowrap">
                      {fmt(isLive ? model.avgScore : model.overall_avg_score)}
                    </div>
                    <div className="text-sm font-sans font-bold tabular-nums whitespace-nowrap">
                      {isLive
                        ? enriched?.success_rate_percent != null
                          ? `${enriched.success_rate_percent.toFixed(1)}%`
                          : dash
                        : model.success_rate_percent != null
                        ? `${model.success_rate_percent.toFixed(1)}%`
                        : dash}
                    </div>
                    <div className="text-sm font-sans tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {isLive ? fmt(model.weight, 4) : fmt(model.avg_latency, 2)}
                    </div>
                    <div className="flex items-center justify-center">
                      {model.eligible ? (
                        <Check
                          size={16}
                          className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}
                        />
                      ) : (
                        <span className={`text-sm font-sans ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {dash}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleExpanded(model.uniqueId)}
                        aria-label="Toggle details"
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          theme === 'dark'
                            ? 'border-white text-white hover:bg-gray-800'
                            : 'border-gray-400 text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Toggle details (T)"
                      >
                        {expandedModel === model.uniqueId ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId((prev) =>
                              prev === model.uniqueId ? null : model.uniqueId,
                            )
                          }
                          aria-haspopup="menu"
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            theme === 'dark'
                              ? 'border-white text-white hover:bg-gray-800'
                              : 'border-gray-400 text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Actions (open menu)"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === model.uniqueId && (
                          <div className={`absolute right-0 mt-1 w-56 z-20 rounded-sm border shadow-lg ${
                            theme === 'dark'
                              ? 'bg-gray-900 border-white text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}>
                            <button
                              onClick={() => {
                                toggleExpanded(model.uniqueId)
                                setOpenMenuId(null)
                              }}
                              className={`flex w-full items-center justify-between px-3 h-9 text-sm text-left transition-colors ${
                                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                              }`}
                            >
                              <span>Toggle details</span>
                              <span className="text-xs opacity-70">T</span>
                            </button>
                            <a
                              href={`https://huggingface.co/${model.model}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuId(null)}
                              className={`flex w-full items-center justify-between px-3 h-9 text-sm transition-colors ${
                                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                              }`}
                            >
                              <span>View on Hugging Face</span>
                              <span className="text-xs opacity-70">H</span>
                            </a>
                            {chuteId ? (
                              <a
                                href={`https://chutes.ai/app/chute/${chuteId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenMenuId(null)}
                                className={`flex w-full items-center justify-between px-3 h-9 text-sm transition-colors ${
                                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                }`}
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
                            <div className={`px-3 py-2 border-t text-[11px] font-sans opacity-70 ${
                              theme === 'dark' ? 'border-white/30' : 'border-gray-300'
                            }`}>
                              Shortcuts: T, H, C, Esc
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {expandedModel === model.uniqueId && (
                  <div className={`px-3 pb-3 text-left ${
                    theme === 'dark' ? 'bg-gray-900/50' : 'bg-slate-50'
                  }`}>
                    <div className="text-xs font-sans grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                      {/* Common fields */}
                      <div>
                        <span className="font-bold">UID:</span> {model.uid}
                      </div>
                      <div className="break-all">
                        <span className="font-bold">Rev:</span> {model.rev}
                      </div>
                      <div>
                        <span className="font-bold">Avg Score:</span>{' '}
                        {fmt(isLive ? model.avgScore : model.overall_avg_score)}
                      </div>
                      <div>
                        <span className="font-bold">Success %:</span>{' '}
                        {isLive
                          ? enriched?.success_rate_percent != null
                            ? `${enriched.success_rate_percent.toFixed(1)}%`
                            : dash
                          : model.success_rate_percent != null
                          ? `${model.success_rate_percent.toFixed(1)}%`
                          : dash}
                      </div>
                      <div>
                        <span className="font-bold">Eligible:</span>{' '}
                        {model.eligible ? 'Yes' : 'No'}
                      </div>
                      {/* View-specific fields */}
                      {isLive ? (
                        <>
                          <div>
                            <span className="font-bold">Hotkey:</span>{' '}
                            {enriched?.hotkey ?? dash}
                          </div>
                          <div>
                            <span className="font-bold">Avg Latency (s):</span>{' '}
                            {fmt(enriched?.avg_latency, 2)}
                          </div>
                          <div>
                            <span className="font-bold">Total Rollouts:</span>{' '}
                            {enriched?.total_rollouts?.toLocaleString() ?? dash}
                          </div>
                          <div>
                            <span className="font-bold">Last Rollout:</span>{' '}
                            {fmtTs(enriched?.last_rollout_at)}
                          </div>
                          <div>
                            <span className="font-bold">PTS:</span>{' '}
                            {fmt(model.pts, 4)}
                          </div>
                          <div>
                            <span className="font-bold">Weight:</span>{' '}
                            {fmt(model.weight, 4)}
                          </div>
                          <div>
                            <span className="font-bold">SAT:</span>{' '}
                            {fmt(model.sat)}
                          </div>
                          <div>
                            <span className="font-bold">ABD:</span>{' '}
                            {fmt(model.abd)}
                          </div>
                          <div>
                            <span className="font-bold">DED:</span>{' '}
                            {fmt(model.ded)}
                          </div>
                          <div>
                            <span className="font-bold">ELR:</span>{' '}
                            {fmt(model.elr)}
                          </div>
                          {model.l1 != null && (
                            <div>
                              <span className="font-bold">L1:</span>{' '}
                              {fmt(model.l1)}
                            </div>
                          )}
                          {model.l2 != null && (
                            <div>
                              <span className="font-bold">L2:</span>{' '}
                              {fmt(model.l2)}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="break-all">
                            <span className="font-bold">Hotkey:</span>{' '}
                            {model.hotkey}
                          </div>
                          <div>
                            <span className="font-bold">Avg Latency (s):</span>{' '}
                            {fmt(model.avg_latency, 2)}
                          </div>
                          <div>
                            <span className="font-bold">Total Rollouts:</span>{' '}
                            {model.total_rollouts.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-bold">Last Rollout:</span>{' '}
                            {fmtTs(model.last_rollout_at)}
                          </div>
                          {envs.map((env) => {
                            const key = env.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                            return (
                              <div key={env}>
                                <span className="font-bold">{env}:</span>{' '}
                                {fmt((model as any)[key])}
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ModelsTable