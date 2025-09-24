import React, { useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardRow } from '../services/api'
import TablePaginationControls from './TablePaginationControls'
import Card from './Card'

type Theme = 'light' | 'dark'

interface LeaderboardProps {
  theme: Theme
  // Interpreted as "maximum items considered" (we still paginate within this cap)
  limit?: number
}

const Leaderboard: React.FC<LeaderboardProps> = ({ theme, limit = 0 }) => {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(20)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchLeaderboard()
        if (!mounted) return
        const list = Array.isArray(data) ? data : []
        setRows(limit && limit > 0 ? list.slice(0, limit) : list)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to load leaderboard')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [limit])

  // Reset to first page when rows count or page size changes
  useEffect(() => {
    setPage(1)
  }, [pageSize, rows.length])

  // Clamp page if it exceeds totalPages
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // Grid columns to match OverviewTable's compact, aligned layout
  // Columns: Rank | Hotkey | Model | Rollouts | Avg Score | Success % | Avg Latency | Last UID
  const gridCols =
    'grid grid-cols-[56px_minmax(0,1.1fr)_minmax(0,1.1fr)_104px_96px_96px_128px_88px_112px] gap-2 items-center'

  const dash = '—'
  const fmt = (n: number | null | undefined, digits = 2) =>
    n == null ? dash : n.toFixed(digits)
  const midTrunc = (s: string, max = 42) => {
    if (!s) return s as unknown as string
    if (s.length <= max) return s
    const half = Math.floor((max - 1) / 2)
    return s.slice(0, half) + '…' + s.slice(s.length - half)
  }

  const startIndex = rows.length === 0 ? 0 : (page - 1) * pageSize
  const endIndex = Math.min(rows.length, startIndex + pageSize)
  const pagedRows = rows.slice(startIndex, startIndex + pageSize)

  return (
    <Card
      title="LEADERBOARD (Live)"
      subtitle="Top miners by average score"
      theme={theme}
      className="mb-6 rounded-none"
    >
      {/* Pagination summary + controls */}
      <div className="mb-4">
        <TablePaginationControls
          theme={theme}
          total={rows.length}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
      {loading && (
        <div className="text-sm font-sans text-gray-600 dark:text-gray-300">
          Loading leaderboard…
        </div>
      )}

      {error && (
        <div className="text-sm font-sans text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="text-sm font-sans text-gray-600 dark:text-gray-300">
          No leaderboard data available.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="border-2 rounded-none overflow-x-auto border-gray-300 bg-white dark:border-white dark:bg-black">
          {/* Header Row */}
          <div className="p-3 border-b-2 border-gray-300 bg-light-50 dark:border-white dark:bg-gray-900">
            <div className={`${gridCols} text-center`}>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
                #
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-left text-gray-900 dark:text-white">
                Hotkey
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-left text-gray-900 dark:text-white">
                Model
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
                Rollouts
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
                Avg Score
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
                Success %
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
                Avg Latency (s)
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
                Last UID
              </div>
              <div className="text-xs font-sans uppercase tracking-wider font-bold text-gray-900 dark:text-white">
                Actions
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="divide-y-2 divide-gray-300">
            {pagedRows.map((r, idx) => (
              <div key={`${r.hotkey}-${r.last_seen_uid}-${startIndex + idx}`}>
                <div className="p-3 hover:bg-opacity-50 transition-colors hover:bg-light-50 dark:hover:bg-gray-800">
                  <div className={`${gridCols} text-center`}>
                    <div className="text-sm font-sans font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">
                      {startIndex + idx + 1}
                    </div>
                    <div
                      className="text-sm font-sans truncate whitespace-nowrap text-left text-gray-700 dark:text-gray-300"
                      title={r.hotkey}
                    >
                      {midTrunc(r.hotkey, 48)}
                    </div>
                    <div
                      className="text-sm font-sans truncate whitespace-nowrap text-left text-gray-700 dark:text-gray-300"
                      title={r.model}
                    >
                      {midTrunc(r.model, 48)}
                    </div>
                    <div className="text-sm font-sans tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {r.total_rollouts.toLocaleString()}
                    </div>
                    <div className="text-sm font-sans font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">
                      {fmt(r.average_score)}
                    </div>
                    <div className="text-sm font-sans font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">
                      {r.success_rate_percent.toFixed(1)}%
                    </div>
                    <div className="text-sm font-sans tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {r.avg_latency == null ? dash : r.avg_latency.toFixed(2)}
                    </div>
                    <div className="text-sm font-sans tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {r.last_seen_uid}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={`https://huggingface.co/${r.model}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 px-2 items-center justify-center rounded-sm border text-xs font-sans border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-800"
                        title="View on Hugging Face"
                      >
                        HF
                      </a>
                      {r.chute_id ? (
                        <a
                          href={`https://chutes.ai/app/chute/${r.chute_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 px-2 items-center justify-center rounded-sm border text-xs font-sans border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-gray-800"
                          title="Open Chutes"
                        >
                          Chutes
                        </a>
                      ) : (
                        <span
                          className="inline-flex h-8 px-2 items-center justify-center rounded-sm border text-xs font-sans opacity-50 border-gray-400 text-gray-700 dark:border-white dark:text-white"
                          title="No Chutes deployment"
                          aria-disabled="true"
                        >
                          Chutes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default Leaderboard
