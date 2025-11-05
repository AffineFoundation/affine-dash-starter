import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { SkeletonText } from './Skeleton'
import { EnvironmentMinerStat } from '../utils/summaryParser'

export type SortField =
  | 'model'
  | 'sample_count'
  | 'average_score'
  | 'lower_bound'
  | 'emission'

interface EnvironmentLiveTableProps {
  theme: 'light' | 'dark'
  rows: EnvironmentMinerStat[]
  loading: boolean
  errorMsg: string | null
  envName: string
  currentBlock: number | null | undefined
  sortField: SortField
  sortDirection: 'asc' | 'desc'
  onSort: (field: SortField) => void
  alphaPriceUsd: number | null
}

type DetailCell = {
  label: string
  value: React.ReactNode
  emphasize?: boolean
}

const thClasses =
  'px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-left border-r border-black/5 last:border-r-0 whitespace-nowrap font-normal'
const tdClasses = 'px-3 py-3 font-medium text-xs leading-snug tracking-wide'

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

const computeAge = (
  currentBlock: number | null | undefined,
  firstBlock: number | null | undefined,
): number | null => {
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
  age == null ? '—' : age.toLocaleString()

const formatScore = (value: number | null | undefined, digits = 3) =>
  value == null || Number.isNaN(value) ? '—' : value.toFixed(digits)

const formatBoundsDisplay = (lower: number | null, upper: number | null) => {
  if (lower == null || upper == null) return '—'
  return `[${formatScore(lower)}, ${formatScore(upper)}]`
}

const midTrunc = (value: string, max = 48) => {
  if (!value) return value
  if (value.length <= max) return value
  const half = Math.floor((max - 1) / 2)
  return `${value.slice(0, half)}…${value.slice(value.length - half)}`
}

const DetailItem = ({ label, value, emphasize = false }: DetailCell) => {
  const hasValue =
    value !== null && value !== undefined && value !== '' && value !== '—'

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
        title={typeof display === 'string' ? display : undefined}
      >
        {display}
      </span>
    </div>
  )
}

const EnvironmentLiveTable: React.FC<EnvironmentLiveTableProps> = ({
  theme: _theme,
  rows,
  loading,
  errorMsg,
  envName,
  currentBlock,
  sortField,
  sortDirection,
  onSort,
  alphaPriceUsd,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const actionContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})
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

  const toggleExpanded = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id))

  useEffect(() => {
    if (!openMenuId) return

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      const container = actionContainerRefs.current[openMenuId]
      if (container && target && container.contains(target)) {
        return
      }
      setOpenMenuId(null)
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [openMenuId])

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <span className="ml-1">▲</span>
    ) : (
      <span className="ml-1">▼</span>
    )
  }

  return (
    <div className="rounded-[4px] bg-white shadow-sm overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[60%] md:w-[30%]" />
          <col className="hidden md:table-column md:w-[17.5%]" />
          <col className="hidden md:table-column md:w-[17.5%]" />
          <col className="hidden md:table-column md:w-[17.5%]" />
          <col className="w-[40%] md:w-[17.5%]" />
        </colgroup>
        <thead className="text-light-smoke outline outline-4 -outline-offset-4 outline-white">
          <tr className="border-b border-black/5 h-8 bg-light-haze">
            <th className={thClasses}>
              <button
                type="button"
                onClick={() => onSort('model')}
                className="flex items-center uppercase"
              >
                <span>Model</span>
                {sortIndicator('model')}
              </button>
            </th>
            <th className={`${thClasses} hidden md:table-cell`}>
              <button
                type="button"
                onClick={() => onSort('sample_count')}
                className="flex items-center uppercase"
              >
                <span>Sample Count</span>
                {sortIndicator('sample_count')}
              </button>
            </th>
            <th className={`${thClasses} hidden md:table-cell`}>
              <button
                type="button"
                onClick={() => onSort('average_score')}
                className="flex items-center uppercase"
              >
                <span>Avg. Score</span>
                {sortIndicator('average_score')}
              </button>
            </th>
            <th className={`${thClasses} hidden md:table-cell`}>
              <button
                type="button"
                onClick={() => onSort('lower_bound')}
                className="flex items-center uppercase"
              >
                <span>Performance Bounds (80% CI)</span>
                {sortIndicator('lower_bound')}
              </button>
            </th>
            <th className={thClasses}>
              <button
                type="button"
                onClick={() => onSort('emission')}
                className="flex items-center uppercase"
              >
                <span>ⴷ/hr</span>
                {sortIndicator('emission')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white text-light-smoke">
          {errorMsg && (
            <tr>
              <td colSpan={2} className="px-5 py-4 text-red-600 md:hidden">
                {errorMsg}
              </td>
              <td
                colSpan={5}
                className="px-5 py-4 text-red-600 hidden md:table-cell"
              >
                {errorMsg}
              </td>
            </tr>
          )}

          {loading &&
            rows.length === 0 &&
            Array.from({ length: 8 }).map((_, index) => (
              <tr
                key={`skeleton-${index}`}
                className="border-b border-black/5 last:border-b-0"
              >
                <td className={`${tdClasses} truncate`}>
                  <SkeletonText theme={_theme} className="h-4 w-64" />
                </td>
                <td className={tdClasses}>
                  <SkeletonText theme={_theme} className="h-4 w-16" />
                </td>
                <td className={`${tdClasses} hidden md:table-cell`}>
                  <SkeletonText theme={_theme} className="h-4 w-16" />
                </td>
                <td className={`${tdClasses} hidden md:table-cell`}>
                  <SkeletonText theme={_theme} className="h-4 w-24" />
                </td>
                <td className={`${tdClasses} pr-2 hidden md:table-cell`}>
                  <div className="flex items-center justify-end gap-2">
                    <SkeletonText theme={_theme} className="h-4 w-12" />
                    <SkeletonText theme={_theme} className="h-4 w-4" />
                  </div>
                </td>
              </tr>
            ))}

          {!loading && !errorMsg && rows.length === 0 && (
            <tr>
              <td
                colSpan={2}
                className="px-5 py-6 text-center text-sm text-light-iron md:hidden"
              >
                No live results yet for {envName}.
              </td>
              <td
                colSpan={5}
                className="px-5 py-6 text-center text-sm text-light-iron hidden md:table-cell"
              >
                No live results yet for {envName}.
              </td>
            </tr>
          )}

          {rows.map((row) => {
            const rowId = `${row.uid}-${row.hotkey}`
            const isExpanded = expandedId === rowId
            const boundsDisplay = formatBoundsDisplay(
              row.lower_bound,
              row.upper_bound,
            )
            const sampleDisplay = row.sample_count.toLocaleString()
            const averageDisplay = formatScore(row.average_score)
            const lowerBoundDisplay = formatScore(row.lower_bound)
            const upperBoundDisplay = formatScore(row.upper_bound)
            const weightDisplay =
              row.weight != null ? row.weight.toFixed(4) : '—'
            const ageValue = formatAge(
              computeAge(currentBlock, row.first_block),
            )
            const ciWidth =
              row.lower_bound != null && row.upper_bound != null
                ? formatScore(row.upper_bound - row.lower_bound)
                : '—'
            const ciMidpoint =
              row.lower_bound != null && row.upper_bound != null
                ? formatScore((row.lower_bound + row.upper_bound) / 2)
                : '—'
            const revDisplay = row.revision ? (
              <span className="font-mono">{midTrunc(row.revision, 12)}</span>
            ) : (
              '—'
            )
            const hotkeyDisplay = row.hotkey ? (
              <span className="font-mono">{midTrunc(row.hotkey, 18)}</span>
            ) : (
              '—'
            )
            const emissionAlphaDisplay =
              row.emission == null || Number.isNaN(row.emission)
                ? null
                : `ⴷ ${row.emission.toFixed(3)}`
            const emissionUsdValue =
              row.emission != null && alphaPriceUsd != null
                ? row.emission * alphaPriceUsd
                : null
            const emissionUsdDisplay = formatUsd(emissionUsdValue)
            const primaryEmission = emissionAlphaDisplay
            const secondaryEmission = emissionUsdDisplay
            const mainEmission = primaryEmission ?? secondaryEmission
            const hasBothUnits =
              primaryEmission != null &&
              secondaryEmission != null &&
              primaryEmission !== secondaryEmission
            const withPerHour = (value: string | null) =>
              value ? `${value} /hr` : null
            const emissionDetailNode =
              mainEmission == null ? (
                '—'
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
            const emissionCell =
              mainEmission == null ? (
                '—'
              ) : (
                <span className="flex flex-col items-end leading-tight">
                  <span>{mainEmission}</span>
                  {hasBothUnits ? (
                    <span className="text-[10px] uppercase tracking-[0.12em] text-light-slate">
                      {withPerHour(secondaryEmission)}
                    </span>
                  ) : null}
                </span>
              )

            const rolloutsUrl = buildRolloutsUrl(row.model)
            const rolloutsDownloadName = buildRolloutsDownloadName(row.model)

            const handleRowClick = () => {
              toggleExpanded(rowId)
              setOpenMenuId(null)
            }

            const summaryColumns: DetailCell[][] = [
              [
                { label: 'UID', value: row.uid.toString(), emphasize: true },
                { label: 'Eligible', value: row.eligible ? 'Yes' : 'No' },
              ],
              [
                { label: 'Rev', value: revDisplay, emphasize: true },
                { label: 'HotKey', value: hotkeyDisplay },
              ],
              [
                { label: 'Avg Score', value: averageDisplay, emphasize: true },
                { label: 'Samples', value: sampleDisplay },
              ],
              [
                { label: 'ⴷ/hr', value: emissionDetailNode, emphasize: true },
                { label: 'Winner', value: row.is_winner ? 'Yes' : 'No' },
              ],
            ].map((column) =>
              column.length ? column : [{ label: '', value: '—' }],
            )

            const lowerColumns: DetailCell[][] = [
              [
                { label: 'Lower Bound', value: lowerBoundDisplay },
                { label: 'Upper Bound', value: upperBoundDisplay },
              ],
              [
                { label: 'Weight', value: weightDisplay },
                { label: 'Age', value: ageValue },
              ],
              [
                { label: 'CI Width', value: ciWidth },
                { label: 'CI Midpoint', value: ciMidpoint },
              ],
              [
                { label: 'Model', value: midTrunc(row.model, 40) },
                { label: '', value: '—' },
              ],
            ].map((column) =>
              column.length ? column : [{ label: '', value: '—' }],
            )

            return (
              <React.Fragment key={rowId}>
                <tr
                  onClick={handleRowClick}
                  className="border-b border-black/5 transition-colors duration-300 hover:bg-light-sand/50 cursor-pointer group"
                >
                  <td className={`${tdClasses} truncate`} title={row.model}>
                    {midTrunc(row.model, 24)}
                  </td>
                  <td className={`${tdClasses} hidden md:table-cell`}>
                    {sampleDisplay}
                  </td>
                  <td className={`${tdClasses} hidden md:table-cell`}>
                    {averageDisplay}
                  </td>
                  <td className={`${tdClasses} hidden md:table-cell`}>
                    {boundsDisplay}
                  </td>
                  <td className={`${tdClasses} pr-2`}>
                    <div className="flex items-center justify-end gap-2">
                      {emissionCell}
                      <div
                        className="relative"
                        ref={(node) => {
                          if (node) {
                            actionContainerRefs.current[rowId] = node
                          } else {
                            delete actionContainerRefs.current[rowId]
                          }
                        }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setOpenMenuId((prev) =>
                              prev === rowId ? null : rowId,
                            )
                          }}
                          title="Actions"
                          className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === rowId && (
                          <div
                            className="absolute right-0 mt-1 w-56 z-20 rounded-md overflow-hidden shadow-lg bg-light-75 text-light-500 dark:bg-dark-200 dark:text-dark-500"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                toggleExpanded(rowId)
                                setOpenMenuId(null)
                              }}
                              className="flex w-full items-center justify-between px-3 h-9 text-sm text-left transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                            >
                              <span>Toggle details</span>
                              <span className="text-xs opacity-70">T</span>
                            </button>
                            <a
                              href={`https://huggingface.co/${row.model}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center justify-between px-3 h-9 text-sm transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                            >
                              <span>View on Hugging Face</span>
                              <span className="text-xs opacity-70">H</span>
                            </a>
                            <a
                              href={rolloutsUrl}
                              download={rolloutsDownloadName}
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center justify-between px-3 h-9 text-sm transition-colors duration-300 hover:bg-light-200 dark:hover:bg-dark-350"
                            >
                              <span>Download rollouts</span>
                              <span className="text-xs opacity-70">D</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="md:hidden">
                    <td colSpan={2} className="bg-white px-0 py-8">
                      <div className="mx-5 rounded-md border border-light-iron bg-white text-xs font-sans text-light-smoke shadow-sm">
                        <div className="grid grid-cols-1 divide-y divide-light-iron">
                          {summaryColumns.map((column, columnIndex) => (
                            <div
                              key={`summary-${rowId}-${columnIndex}`}
                              className="min-h-[84px] px-5 py-4 space-y-1.5"
                            >
                              {column.map((item, itemIndex) => (
                                <DetailItem
                                  key={`${
                                    item.label || 'summary'
                                  }-${rowId}-${columnIndex}-${itemIndex}`}
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
                {isExpanded && (
                  <tr className="hidden md:table-row">
                    <td colSpan={5} className="bg-white px-0 py-8">
                      <div className="mx-5 rounded-md border border-light-iron bg-white text-xs font-sans text-light-smoke shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-light-iron">
                          {summaryColumns.map((column, columnIndex) => (
                            <div
                              key={`summary-${rowId}-${columnIndex}`}
                              className="min-h-[84px] px-5 py-4 space-y-1.5"
                            >
                              {column.map((item, itemIndex) => (
                                <DetailItem
                                  key={`${
                                    item.label || 'summary'
                                  }-${rowId}-${columnIndex}-${itemIndex}`}
                                  {...item}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-light-iron border-t border-light-iron">
                          {lowerColumns.map((column, columnIndex) => (
                            <div
                              key={`detail-${rowId}-${columnIndex}`}
                              className="min-h-[110px] px-5 py-4 space-y-1.5"
                            >
                              {column.map((item, itemIndex) => (
                                <DetailItem
                                  key={`${
                                    item.label || 'detail'
                                  }-${rowId}-${columnIndex}-${itemIndex}`}
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
  )
}

export default EnvironmentLiveTable
