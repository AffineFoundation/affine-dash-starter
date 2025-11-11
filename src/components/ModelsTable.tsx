import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, MoreVertical, Search, ExternalLink } from 'lucide-react'
import { LiveEnrichmentRow } from '../services/api'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { Skeleton, SkeletonText } from './Skeleton'
import ScoreCell, { getEnvScoreStats } from './ScoreCell'
import { RAO_PER_TAO } from '../services/pricing'
import { getEnvCodeUrl } from '../utils/envLinks'
import { useOverviewMetrics } from '../hooks/useOverviewMetrics'
import OverviewMetricCard from './OverviewMetricCard'

const INITIAL_VISIBLE_ROWS = 20
const VISIBLE_INCREMENT = 20

const buildRolloutsUrl = (modelName: string | null | undefined) => {
  if (!modelName) return '/api/rollouts/model'
  const raw = String(modelName).trim()
  if (!raw) return '/api/rollouts/model'
  const segments = raw
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
  const path = '/api/rollouts/model'
  const params = new URLSearchParams()
  params.set('model', segments.length ? segments.join('/') : raw)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

const buildRolloutsDownloadName = (modelName: string | null | undefined) => {
  const safe = (modelName ?? '').replace(/[^\w.-]/g, '_') || 'model'
  return `rollouts_${safe}.jsonl`
}

const buildTaostatsUrl = (hotkey: string | null | undefined) => {
  if (!hotkey) return null
  const url = new URL('https://taostats.io/subnets/120/metagraph')
  const params = new URLSearchParams()
  params.set('order', 'stake:desc')
  params.set('filter', hotkey)
  url.search = params.toString()
  return url.toString()
}

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
  alphaPriceUsd: number | null
  alphaPriceTao: number | null
  alphaPriceLoading: boolean
  alphaPriceError: string | null
  alphaPriceTimestamp: string | null
  taoPriceUsd: number | null
  taoPriceLoading: boolean
  taoPriceError: string | null
}

const CopyHotkeyButton: React.FC<{ hotkey: string; display: string }> = ({
  hotkey,
  display,
}) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(hotkey)
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea')
        textarea.value = hotkey
        textarea.style.position = 'fixed'
        textarea.style.top = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
    } catch (error) {
      console.error('Failed to copy hotkey to clipboard', error)
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Hotkey copied' : 'Click to copy hotkey'}
      className="group inline-flex items-center gap-2 rounded px-2 py-1 text-left text-xs font-medium text-light-smoke hover:text-blue-500 focus-visible:outline focus-visible:outline-1 focus-visible:outline-blue-500"
    >
      <span className="font-mono" title={hotkey}>
        {display}
      </span>
      <span
        className={`text-[10px] uppercase tracking-[0.18em] transition-colors ${
          copied
            ? 'text-emerald-500'
            : 'text-light-slate group-hover:text-blue-500'
        }`}
      >
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  )
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
  alphaPriceUsd,
  alphaPriceTao,
  alphaPriceLoading,
  alphaPriceError,
  alphaPriceTimestamp,
  taoPriceUsd,
  taoPriceLoading,
  taoPriceError,
}) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_ROWS)
  const { environments: envs, loading: envLoading } = useEnvironments()
  const { metrics: overviewMetrics } = useOverviewMetrics()
  const actionContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const L_SUBSETS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8']

  type DetailCell = {
    label?: string
    value: React.ReactNode
    emphasize?: boolean
    custom?: boolean
  }

  type DetailItemProps = DetailCell & {
    variant?: 'horizontal' | 'stacked'
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
    label = '',
    value,
    emphasize = false,
    variant = 'horizontal',
    custom = false,
  }: DetailItemProps) => {
    if (custom) {
      return <div className="py-1">{value}</div>
    }

    const hasValue =
      value !== null && value !== undefined && value !== '' && value !== '—'

    const display = hasValue ? value : '—'
    const valueClass = hasValue
      ? emphasize
        ? 'font-semibold text-light-smoke'
        : 'font-medium text-light-slate'
      : 'font-medium text-light-iron'

    if (variant === 'stacked') {
      const showLabel = Boolean(label && label.trim() !== '')
      return (
        <div className="flex flex-col items-center gap-1 py-1 text-center">
          {showLabel && (
            <span className="text-[10px] uppercase tracking-[0.28em] text-light-slate">
              {label}
            </span>
          )}
          <div className={`text-sm leading-tight ${valueClass}`}>{display}</div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <span className="text-[11px] uppercase tracking-[0.18em] text-light-slate">
          {label}
        </span>
        <span className={`flex items-center justify-end text-sm ${valueClass}`}>
          {display}
        </span>
      </div>
    )
  }

  type MobileEnvRow = {
    label: string
    score: string
    samples: string | null
    codeUrl: string | null
    tooltip: EnvTooltipData | null
  }

  type PerformanceRow = {
    label: string
    value: string
  }

  type MobileSection = {
    title: string
    items?: DetailCell[]
    envRows?: MobileEnvRow[]
    performanceRows?: PerformanceRow[]
  }

  const MobileEnvironmentTable: React.FC<{ rows: MobileEnvRow[] }> = ({
    rows,
  }) => {
    if (!rows.length) {
      return (
        <div className="rounded border border-light-iron py-3 text-[11px] font-semibold text-light-iron dark:border-dark-350 dark:text-dark-400">
          No environment data
        </div>
      )
    }
    return (
      <div className="relative rounded border border-light-iron text-left dark:border-dark-350">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-light-cream/70 text-[10px] uppercase tracking-[0.24em] text-light-slate dark:bg-dark-300/60 dark:text-dark-400">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Env</th>
              <th className="px-3 py-2 text-right font-semibold">Score</th>
              <th className="px-3 py-2 text-right font-semibold">Samples</th>
            </tr>
          </thead>
          <tbody className="text-light-smoke dark:text-dark-500">
            {rows.map((row, index) => {
              const tooltip = row.tooltip
              return (
                <tr
                  key={`${row.label}-${index}`}
                  className="group border-t border-light-iron last:border-b-0 dark:border-dark-350"
                >
                  <td className="px-3 py-2">
                    {row.codeUrl ? (
                      <a
                        href={row.codeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-light-smoke hover:text-blue-500 focus-visible:outline focus-visible:outline-1 focus-visible:outline-blue-500 dark:text-dark-500"
                      >
                        <span>{row.label}</span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="font-semibold">{row.label}</span>
                    )}
                  </td>
                  <td className="relative px-3 py-2 text-right font-semibold">
                    <span>{row.score || '—'}</span>
                    {tooltip ? (
                      <div className="pointer-events-none absolute right-0 top-full z-30 hidden w-64 translate-y-2 rounded-md border border-black/10 bg-white p-3 text-[11px] leading-relaxed text-light-smoke shadow-2xl group-hover:block group-focus-within:block dark:border-white/15 dark:bg-dark-200 dark:text-dark-500">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-light-slate">
                          {row.label} stats
                        </p>
                        <dl className="mt-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                              Lower Bound
                            </dt>
                            <dd className="font-semibold text-light-500 dark:text-dark-500">
                              {tooltip.lower}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                              Upper Bound
                            </dt>
                            <dd className="font-semibold text-light-500 dark:text-dark-500">
                              {tooltip.upper}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                              CI Width
                            </dt>
                            <dd className="font-semibold text-light-500 dark:text-dark-500">
                              {tooltip.width}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                              CI Midpoint
                            </dt>
                            <dd className="font-semibold text-light-500 dark:text-dark-500">
                              {tooltip.midpoint}
                            </dd>
                          </div>
                        </dl>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-light-slate">
                          Tap or hover to view stats
                        </p>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right text-[10px] uppercase tracking-[0.18em] text-light-slate">
                    {row.samples ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const MobilePerformanceTable: React.FC<{ rows: PerformanceRow[] }> = ({
    rows,
  }) => {
    if (!rows.length) return null
    const [headline, ...rest] = rows
    if (!headline) return null
    const pairs: PerformanceRow[][] = []
    for (let i = 0; i < rest.length; i += 2) {
      pairs.push(rest.slice(i, i + 2))
    }
    return (
      <div className="overflow-hidden rounded border border-light-iron text-left dark:border-dark-350">
        <table className="w-full border-collapse text-[11px]">
          <tbody className="text-light-smoke dark:text-dark-500">
            <tr className="border-b border-light-iron bg-light-cream/60 dark:border-dark-350 dark:bg-dark-300/60">
              <td className="px-3 py-3" colSpan={2}>
                <p className="text-[10px] uppercase tracking-[0.28em] text-light-slate dark:text-dark-400">
                  {headline.label}
                </p>
                <p className="text-lg font-semibold">
                  {headline.value || '—'}
                </p>
              </td>
            </tr>
            {pairs.map((pair, rowIdx) => (
              <tr
                key={`perf-row-${rowIdx}`}
                className="border-b border-light-iron last:border-b-0 dark:border-dark-350"
              >
                {pair.map((metric, cellIdx) => (
                  <td
                    key={metric.label}
                    className={`w-1/2 px-3 py-2 ${
                      cellIdx === 0
                        ? 'border-r border-light-iron dark:border-dark-350'
                        : ''
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.28em] text-light-slate dark:text-dark-400">
                      {metric.label}
                    </p>
                    <p className="text-sm font-semibold">
                      {metric.value || '—'}
                    </p>
                  </td>
                ))}
                {pair.length === 1 ? (
                  <td className="w-1/2 px-3 py-2" />
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  type EnvTooltipData = {
    lower: string
    upper: string
    width: string
    midpoint: string
  }

  interface EnvironmentScoreRowProps {
    label: string
    displayValue: string
    sampleText: string | null
    tooltip: EnvTooltipData | null
    codeUrl: string | null
  }

  const EnvironmentScoreRow: React.FC<EnvironmentScoreRowProps> = ({
    label,
    displayValue,
    sampleText,
    tooltip,
    codeUrl,
  }) => {
    const handleClick = () => {
      if (!codeUrl) return
      window.open(codeUrl, '_blank', 'noopener,noreferrer')
    }

    return (
      <div className="group relative">
        <button
          type="button"
          onClick={handleClick}
          className="w-full rounded-sm px-0 py-1 text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-blue-500"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-light-slate">
              <span>{label}</span>
              {codeUrl ? (
                <ExternalLink size={10} className="text-light-slate" />
              ) : null}
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-light-smoke">
              <span>{displayValue || '—'}</span>
              {sampleText ? (
                <>
                  <span className="text-[10px] tracking-[0.18em] text-light-iron">
                    |
                  </span>
                  <span className="text-[11px] tracking-[0.12em] text-light-slate">
                    {sampleText}
                  </span>
                </>
              ) : null}
            </span>
          </div>
        </button>
        {tooltip ? (
          <div className="pointer-events-none absolute left-0 top-full z-10 hidden w-64 translate-y-2 rounded-md border border-black/10 bg-white p-3 text-[11px] leading-relaxed text-light-smoke shadow-2xl group-hover:block group-focus-within:block dark:border-white/15 dark:bg-dark-200 dark:text-dark-500">
            <p className="text-[10px] uppercase tracking-[0.28em] text-light-slate">
              {label} stats
            </p>
            <dl className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                  Lower Bound
                </dt>
                <dd className="font-semibold text-light-500 dark:text-dark-500">
                  {tooltip.lower}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                  Upper Bound
                </dt>
                <dd className="font-semibold text-light-500 dark:text-dark-500">
                  {tooltip.upper}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                  CI Width
                </dt>
                <dd className="font-semibold text-light-500 dark:text-dark-500">
                  {tooltip.width}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[10px] uppercase tracking-[0.2em] text-light-slate">
                  CI Midpoint
                </dt>
                <dd className="font-semibold text-light-500 dark:text-dark-500">
                  {tooltip.midpoint}
                </dd>
              </div>
            </dl>
            {codeUrl ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-blue-500">
                Click to open repo code
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  const visibleRows = rows.slice(0, Math.min(rows.length, visibleCount))
  const hasMoreRows = visibleRows.length < rows.length

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

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ROWS)
  }, [sortField, sortDir, viewMode, searchQuery])

  useEffect(() => {
    setVisibleCount((prev) => {
      if (rows.length === 0) return INITIAL_VISIBLE_ROWS
      const nextMin = Math.max(prev, INITIAL_VISIBLE_ROWS)
      return Math.min(nextMin, rows.length)
    })
  }, [rows.length])

  useEffect(() => {
    if (loading) return
    if (!hasMoreRows) return
    const sentinel = loadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) =>
              Math.min(rows.length, prev + VISIBLE_INCREMENT),
            )
          }
        })
      },
      {
        root: null,
        rootMargin: '0px 0px 200px 0px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMoreRows, loading, rows.length])

  const fmt = (n: number | null | undefined, digits = 1) =>
    n == null ? '—' : n.toFixed(digits)

  const fmtTs = (iso: string | null | undefined) =>
    !iso ? '—' : new Date(iso).toLocaleString()
  const dash = '—'
  const BLOCK_TO_DAY_MULTIPLIER = 0.0001388889
  const MODEL_DISPLAY_PREFIX = 6
  const MODEL_DISPLAY_SUFFIX = 3
  const fmtSamples = (count: number | null | undefined) =>
    count == null ? null : count.toLocaleString()
  const midTrunc = (s: string, max = 36) =>
    s && s.length > max
      ? `${s.slice(0, max / 2)}…${s.slice(s.length - max / 2)}`
      : s
  const formatModelName = (value: string | null | undefined) => {
    const raw = (value ?? '').trim()
    if (!raw) return dash
    if (raw.length <= MODEL_DISPLAY_PREFIX + MODEL_DISPLAY_SUFFIX + 1) {
      return raw
    }
    return `${raw.slice(0, MODEL_DISPLAY_PREFIX)}…${raw.slice(
      -MODEL_DISPLAY_SUFFIX,
    )}`
  }
  const RAO_PER_TAO_NUMBER = Number(RAO_PER_TAO)
  const usdFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    [],
  )
  const formatUsd = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return null
    return usdFormatter.format(value)
  }
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
  const formatAge = (ageBlocks: number | null) => {
    if (ageBlocks == null) return dash
    const days = ageBlocks * BLOCK_TO_DAY_MULTIPLIER
    if (!Number.isFinite(days)) return dash
    return `${days.toFixed(2)} days`
  }
  const parseAlpha = (raw: string | null | undefined): number | null => {
    if (!raw) return null
    try {
      const value = BigInt(raw)
      const whole = value / RAO_PER_TAO
      const remainder = value % RAO_PER_TAO
      return Number(whole) + Number(remainder) / RAO_PER_TAO_NUMBER
    } catch {
      const numeric = Number(raw)
      if (!Number.isFinite(numeric)) return null
      return numeric / 1_000_000_000
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

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
        <div className="hidden lg:flex flex-1 flex-nowrap items-stretch gap-2.5">
          {overviewMetrics.map((metric) => (
            <OverviewMetricCard
              key={metric.label}
              {...metric}
              density="compact"
              className="flex-1 basis-0 min-w-[120px]"
            />
          ))}
        </div>
        <div className="flex w-full items-center md:justify-end lg:w-auto lg:flex-shrink-0 lg:justify-end">
          <div className="relative w-full md:w-72 lg:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-md border border-black/12 bg-light-haze py-2 pl-10 pr-4 text-sm text-light-smoke focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[4px] bg-white shadow-sm">
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
              <th key={env} className={`${thClasses} hidden md:table-cell`}>
                {(() => {
                  const envLabel = env.includes(':')
                    ? env.split(':')[1]
                    : env
                  const envCodeUrl = getEnvCodeUrl(env)
                  return (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        disabled={viewMode !== 'live'}
                        onClick={() => toggleSort(env)}
                        className="flex items-center gap-1"
                        title={`Sort by ${envLabel}`}
                      >
                        <span className="uppercase">{envLabel}</span>
                        <span>{sortIndicator(env)}</span>
                      </button>
                      {envCodeUrl ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            window.open(
                              envCodeUrl,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }}
                          className="text-light-slate transition hover:text-light-smoke"
                          aria-label={`Open ${envLabel} code`}
                        >
                          <ExternalLink size={12} />
                        </button>
                      ) : (
                        <span className="w-3" />
                      )}
                    </div>
                  )
                })()}
              </th>
              ))}
              <th className={`${thClasses} hidden md:table-cell`}>Age (days)</th>
              <th className={`${thClasses} hidden md:table-cell`}>Eligible</th>
            </tr>
          </thead>
          <tbody className="text-light-smoke divide-y divide-black/5">
            {errorMsg && (
              <tr>
                <td
                  colSpan={2}
                  className="p-4 text-red-600 dark:text-red-400 md:hidden"
                >
                  {errorMsg}
                </td>
                <td
                  colSpan={envs.length + 4}
                  className="p-4 text-red-600 dark:text-red-400 hidden md:table-cell"
                >
                  {errorMsg}
                </td>
              </tr>
            )}
            {loading &&
              !errorMsg &&
              Array.from({ length: Math.min(INITIAL_VISIBLE_ROWS, 10) }).map(
                (_, i) => (
                <tr key={i} className="">
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-48" />
                  </td>
                  <td className={tdClasses}>
                    <SkeletonText theme={theme} className="h-4 w-20" />
                  </td>
                  {envs.map((env) => (
                    <td key={env} className={`${tdClasses} hidden md:table-cell`}>
                      <SkeletonText
                        theme={theme}
                        className="h-4 w-12 mx-auto"
                      />
                    </td>
                  ))}
                  <td className={`${tdClasses} hidden md:table-cell`}>
                    <SkeletonText theme={theme} className="h-4 w-12 mx-auto" />
                  </td>
                  <td className={`${tdClasses} px-2 hidden md:table-cell`}>
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton
                        theme={theme}
                        className="h-4 w-4 rounded-full"
                      />
                    </div>
                  </td>
                </tr>
              ),
              )}
            {!loading &&
              !errorMsg &&
              visibleRows.map((model: any) => {
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
                const firstBlockRaw = isLive
                  ? toNumber(model.firstBlk)
                  : toNumber(
                      (model as any).first_block ?? (model as any).firstBlk,
                    )
                const ageRaw = isLive ? computeAge(firstBlockRaw) : null
                const ageValue = formatAge(ageRaw)
                const ptsValue = fmt(toNumber((model as any).pts), 4)
                const weightValue = fmt(toNumber((model as any).weight), 4)
                const emissionAlphaNumeric = parseAlpha(
                  (model as any).emissionRaw ?? null,
                )
                const emissionAlphaDisplay =
                  emissionAlphaNumeric == null
                    ? null
                    : `ⴷ ${emissionAlphaNumeric.toFixed(2)}`
                const emissionUsdValue =
                  emissionAlphaNumeric != null && alphaPriceUsd != null
                    ? emissionAlphaNumeric * alphaPriceUsd
                    : null
                const emissionUsdDisplay = formatUsd(emissionUsdValue)
                const primaryEmission = emissionAlphaDisplay
                const secondaryEmission = emissionUsdDisplay
                const withPerHour = (value: string | null) =>
                  value ? `${value} /hr` : null
                const mainEmission = primaryEmission ?? secondaryEmission
                const hasBothUnits =
                  primaryEmission != null &&
                  secondaryEmission != null &&
                  primaryEmission !== secondaryEmission
                const emissionDetailNode =
                  mainEmission == null ? (
                    dash
                  ) : (
                    <span className="flex flex-col items-end leading-tight">
                      <span>{withPerHour(mainEmission)}</span>
                      {hasBothUnits ? (
                        <span className="text-[10px] uppercase tracking-[0.12em] text-light-slate">
                          {withPerHour(secondaryEmission)}
                        </span>
                      ) : null}
                    </span>
                  )
                const emissionCellContent = isLive ? (
                  mainEmission == null ? (
                    dash
                  ) : (
                    <div className="flex flex-col items-end leading-tight">
                      <span>{mainEmission}</span>
                      {hasBothUnits ? (
                        <span className="text-[10px] uppercase tracking-[0.12em] text-light-slate">
                          {withPerHour(secondaryEmission)}
                        </span>
                      ) : null}
                    </div>
                  )
                ) : (
                  fmt(model.avg_latency as number | null, 2)
                )
                const revDisplay =
                  model.rev && model.rev !== '' ? (
                    <span className="font-mono">{model.rev}</span>
                  ) : (
                    '—'
                  )
                const rawHotkey =
                  typeof model.hotkey === 'string' ? model.hotkey.trim() : ''
                const modelNameRaw =
                  typeof model.model === 'string' ? model.model.trim() : ''
                const modelFullNameValue = modelNameRaw
                  ? (
                      <span className="font-mono break-all" title={modelNameRaw}>
                        {modelNameRaw}
                      </span>
                    )
                  : dash
                const hotkeyValue =
                  rawHotkey !== '' ? (
                    <CopyHotkeyButton
                      hotkey={rawHotkey}
                      display={midTrunc(rawHotkey, 18)}
                    />
                  ) : (
                    '—'
                  )
                const huggingFaceUrl = model.model
                  ? `https://huggingface.co/${model.model}`
                  : null
                const taostatsUrl = buildTaostatsUrl(rawHotkey || null)
                const rolloutsHref = buildRolloutsUrl(model.model as string)
                const rolloutsFileName = buildRolloutsDownloadName(
                  model.model as string,
                )
                const detailLinkClass =
                  'inline-flex items-center gap-1 text-xs font-medium tracking-wide text-light-smoke hover:text-blue-500 focus-visible:outline focus-visible:outline-1 focus-visible:outline-blue-500'
                const envDisplayRows = isLive
                  ? Object.entries(model.envScores).map(([fullName, score]) => {
                      const stats = getEnvScoreStats(score)
                      const label = fullName.split(':')[1] ?? fullName
                      const sampleCount =
                        (model as any).envSamples?.[fullName] ?? null
                      const sampleDisplay =
                        sampleCount != null ? fmtSamples(sampleCount) : null
                      const displayValue =
                        stats != null
                          ? `${stats.minFormatted}-${stats.maxFormatted}`
                          : score
                          ? score.replace(/\*/g, '')
                          : dash
                      const tooltip =
                        stats != null
                          ? {
                              lower: stats.minFormatted,
                              upper: stats.maxFormatted,
                              width: stats.widthFormatted,
                              midpoint: stats.midpointFormatted,
                            }
                          : null
                      return {
                        label,
                        scoreDisplay: displayValue || dash,
                        sampleCountDisplay: sampleDisplay,
                        tooltip,
                        codeUrl: getEnvCodeUrl(fullName),
                      }
                    })
                  : envs.map((env) => {
                      const key = env.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                      const label = env.includes(':') ? env.split(':')[1] : env
                      const raw = (model as any)[key]
                      return {
                        label,
                        scoreDisplay: fmt(toNumber(raw)),
                        sampleCountDisplay: null,
                        tooltip: null,
                        codeUrl: getEnvCodeUrl(env),
                      }
                    })
                const envEntries: DetailCell[] = envDisplayRows.map((row) =>
                  isLive
                    ? {
                        label: row.label,
                        custom: true,
                        value: (
                          <EnvironmentScoreRow
                            label={row.label}
                            displayValue={row.scoreDisplay || dash}
                            sampleText={
                              row.sampleCountDisplay
                                ? `${row.sampleCountDisplay} samples`
                                : null
                            }
                            tooltip={row.tooltip}
                            codeUrl={row.codeUrl}
                          />
                        ),
                      }
                    : {
                        label: row.label,
                        value: row.scoreDisplay || dash,
                      },
                )
                const mobileEnvRows: MobileEnvRow[] = envDisplayRows.map(
                  (row) => ({
                    label: row.label,
                    score: row.scoreDisplay || dash,
                    samples: row.sampleCountDisplay,
                    codeUrl: row.codeUrl,
                    tooltip: row.tooltip,
                  }),
                )
                const envColumns = chunkList(envEntries, 2)
                const subsetScoreData: PerformanceRow[] = L_SUBSETS.map(
                  (subset) => {
                    const raw = (model as any)[subset.toLowerCase()]
                    const numeric = toNumber(raw)
                    if (numeric == null) return null
                    return {
                      label: subset,
                      value: fmt(numeric),
                    }
                  },
                ).filter(
                  (entry): entry is PerformanceRow => entry !== null,
                )
                const lEntries: DetailCell[] = subsetScoreData.map(
                  ({ label, value }) => ({
                    label,
                    value,
                  }),
                )
                const baseMetricItems: DetailCell[] = [
                  { label: 'Age (days)', value: ageValue },
                  ...(firstBlockRaw != null
                    ? [{ label: 'First Block', value: fmt(firstBlockRaw, 0) }]
                    : []),
                  { label: 'PTS', value: ptsValue },
                  { label: 'Weight', value: weightValue },
                  {
                    label: 'Emission (ⴷ/hr)',
                    value: emissionDetailNode,
                  },
                ]
                const keyMetricItemsMobile: DetailCell[] = [
                  { label: 'Average Accuracy', value: avgScoreValue },
                  { label: 'Age (days)', value: ageValue },
                  { label: 'Weight', value: weightValue },
                  {
                    label: 'Emission (ⴷ/hr)',
                    value: emissionDetailNode,
                  },
                ]
                const performanceRows: PerformanceRow[] = [
                  { label: 'Points Total', value: ptsValue },
                  ...subsetScoreData,
                ]
                const lowerColumns: DetailCell[][] = [
                  baseMetricItems,
                  envColumns[0] ?? [],
                  envColumns[1] ?? [],
                  lEntries,
                ].map((column) =>
                  column.length ? column : [{ label: '', value: '—' }],
                )
                const externalLinkItems: DetailCell[] = [
                  {
                    label: 'Hugging Face',
                    value: huggingFaceUrl ? (
                      <a
                        href={huggingFaceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={detailLinkClass}
                      >
                        Open
                      </a>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: 'Chutes',
                    value: chuteId ? (
                      <a
                        href={`https://chutes.ai/app/chute/${chuteId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={detailLinkClass}
                      >
                        Open
                      </a>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: 'TaoStats',
                    value: taostatsUrl ? (
                      <a
                        href={taostatsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={detailLinkClass}
                      >
                        View
                      </a>
                    ) : (
                      '—'
                    ),
                  },
                  {
                    label: 'Rollouts',
                    value: (
                      <a
                        href={rolloutsHref}
                        download={rolloutsFileName}
                        className={detailLinkClass}
                      >
                        Download
                      </a>
                    ),
                  },
                ]
                const summaryColumns: DetailCell[][] = [
                  [
                    {
                      label: 'Model',
                      value: modelFullNameValue,
                    },
                    {
                      label: 'UID',
                      value: model.uid ?? '—',
                    },
                    { label: 'Eligible', value: eligibleSummaryValue },
                  ],
                  [
                    { label: 'Rev', value: revDisplay },
                    { label: 'HotKey', value: hotkeyValue },
                  ],
                  [
                    {
                      label: 'Samples',
                      value: model.samples?.toLocaleString() ?? '—',
                    },
                    {
                      label: 'Accuracy',
                      value: avgScoreValue,
                    },
                  ],
                  externalLinkItems,
                ]
                const summaryInfoColumns =
                  summaryColumns.length > 1
                    ? summaryColumns.slice(0, summaryColumns.length - 1)
                    : summaryColumns
                const summaryInfoItems = summaryInfoColumns.flat()
                const mobileSections: MobileSection[] = [
                  { title: 'Links', items: externalLinkItems },
                  { title: 'Environments', envRows: mobileEnvRows },
                  {
                    title: 'Key Metrics',
                    items: keyMetricItemsMobile,
                    performanceRows:
                      performanceRows.length > 0
                        ? performanceRows
                        : undefined,
                  },
                  { title: 'Summary', items: summaryInfoItems },
                ].filter(
                  (section) =>
                    (section.items && section.items.length > 0) ||
                    (section.envRows && section.envRows.length > 0) ||
                    (section.performanceRows &&
                      section.performanceRows.length > 0),
                )

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
                        {formatModelName(model.model)}
                      </td>
                      <td className={`${tdClasses} text-right`}>
                        {emissionCellContent}
                      </td>
                      {envs.map((env) => {
                        const envScore = isLive
                          ? model.envScores[env]
                          : (model as any)[
                              env.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                            ]
                        const stats = isLive ? getEnvScoreStats(envScore) : null
                        const bestMin = envBestMin[env]
                        const highlight =
                          isLive &&
                          stats != null &&
                          bestMin != null &&
                          Math.abs(stats.min - bestMin) < 1e-6
                        return (
                          <td key={env} className={`${tdClasses} hidden md:table-cell`}>
                            {isLive ? (
                              <ScoreCell
                                score={envScore}
                                highlight={highlight}
                              />
                            ) : (
                              fmt(envScore as number | null)
                            )}
                          </td>
                        )
                      })}
                      <td className={`${tdClasses} hidden md:table-cell`}>{ageValue}</td>
                      <td className={`${tdClasses} px-2 hidden md:table-cell`}>
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
                                actionContainerRefs.current[model.uniqueId] =
                                  node
                              } else {
                                delete actionContainerRefs.current[
                                  model.uniqueId
                                ]
                              }
                            }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setOpenMenuId((prev) =>
                                  prev === model.uniqueId
                                    ? null
                                    : model.uniqueId,
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
                                  Shortcuts: T, H, D, C, Esc
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {expandedModel === model.uniqueId && (
                      <tr className="md:hidden">
                        <td
                          colSpan={2}
                          className="bg-white px-0 py-8"
                        >
                          <div className="mx-5 rounded-md border border-light-iron bg-white text-xs font-sans text-light-smoke shadow-sm">
                            <div className="divide-y divide-light-iron px-5 py-4 text-center">
                              {mobileSections.map((section, sectionIndex) => (
                                <div
                                  key={`mobile-section-${section.title}-${sectionIndex}`}
                                  className="space-y-2 py-4 first:pt-0 last:pb-0"
                                >
                                  <p className="text-[10px] uppercase tracking-[0.32em] text-black dark:text-white">
                                    {section.title}
                                  </p>
                                  {section.items && section.items.length ? (
                                    <div className="flex flex-col gap-1">
                                      {section.items.map((item, itemIndex) => (
                                        <DetailItem
                                          key={`${section.title}-${item.label || 'item'}-${itemIndex}`}
                                          {...item}
                                          variant="stacked"
                                        />
                                      ))}
                                    </div>
                                  ) : null}
                                  {section.envRows ? (
                                    <MobileEnvironmentTable
                                      rows={section.envRows}
                                    />
                                  ) : null}
                                  {section.performanceRows ? (
                                    <MobilePerformanceTable
                                      rows={section.performanceRows}
                                    />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {expandedModel === model.uniqueId && (
                      <tr className="hidden md:table-row">
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
                                      key={`${
                                        item.label || 'summary'
                                      }-${itemIndex}`}
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
                                      key={`${
                                        item.label || 'detail'
                                      }-${itemIndex}`}
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
      <div
        ref={loadMoreRef}
        className="h-8 w-full"
        aria-hidden="true"
      />
    </div>
  )
}

export default ModelsTable
