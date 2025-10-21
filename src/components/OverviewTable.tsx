import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchSubnetOverview,
  SubnetOverviewRow,
  enrichLiveSubnetRows,
  LiveEnrichmentRow,
} from '../services/api'
import { useQuery } from '@tanstack/react-query'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { Skeleton } from './Skeleton'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import Card from './Card'
import ToggleButton from './ToggleButton'
import ModelsTable from './ModelsTable'

interface OverviewTableProps {
  environments?: any[] // Kept for compatibility, not actively used
  theme: 'light' | 'dark'
}

type HistoricalDisplayRow = SubnetOverviewRow & { uniqueId: string }

// Live (API) display row derived from the summary endpoint
type LiveDisplayRow = {
  uniqueId: string
  uid: string
  model: string
  rev: string
  avgScore: number | null
  successRatePercent?: number | null
  weight: number | null
  eligible: boolean
  sat: number | null
  abd: number | null
  ded: number | null
  elr: number | null
  pts: number | null
  l1?: number | null
  l2?: number | null
  l3?: number | null
  l4?: number | null
}

const OverviewTable: React.FC<OverviewTableProps> = ({ theme }) => {
  const [viewMode, setViewMode] = useState<'historical' | 'live'>('live')
  const [enrichedMap, setEnrichedMap] = useState<
    Record<string, LiveEnrichmentRow>
  >({})
  const [enriching, setEnriching] = useState<boolean>(false)
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null)

  const [sortField, setSortField] = useState<
    'weight' | 'uid' | 'avgScore' | 'success' | 'pts' | 'model'
  >('weight')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const liveKey = (uid: string | number, model: string) =>
    `${Number(uid)}|${model.toLowerCase()}`

  // Data fetching for Historical view
  const {
    data: historicalData,
    error: historicalQueryError,
    isLoading: isHistoricalLoading,
  } = useQuery({
    queryKey: ['subnet-overview'],
    queryFn: fetchSubnetOverview,
    staleTime: 60000,
    enabled: viewMode === 'historical',
    refetchInterval: viewMode === 'historical' ? 6000 : false,
    refetchOnMount: false,
  })

  const historicalRows: HistoricalDisplayRow[] = (historicalData ?? []).map(
    (r) => ({
      ...r,
      uniqueId: `${r.uid}-${r.model}-${r.rev}`,
    }),
  )

  // Data fetching for Live view
  const {
    data: liveSummary,
    loading: isLiveLoading,
    error: liveError,
  } = useValidatorSummary()

  const liveRows: LiveDisplayRow[] = useMemo(() => {
    if (!liveSummary) return []
    const cols = liveSummary.columns || []
    const idx = (name: string) => cols.indexOf(name)
    const iUID = idx('UID'),
      iModel = idx('Model'),
      iRev = idx('Rev'),
      iSAT = idx('SAT'),
      iABD = idx('ABD'),
      iDED = idx('DED'),
      iELR = idx('ELR'),
      iL1 = idx('L1'),
      iL2 = idx('L2'),
      iL3 = idx('L3'),
      iL4 = idx('L4'),
      iPts = idx('Pts'),
      iElig = idx('Elig'),
      iWgt = idx('Wgt')
    const parseScore = (v: unknown): number | null =>
      v == null
        ? null
        : parseFloat(String(v).replace(/\*/g, '').split('/')[0]) || null
    const parseNum = (v: unknown): number | null =>
      v == null || v === ''
        ? null
        : (typeof v === 'number' ? v : parseFloat(String(v))) || null
    const parseBoolY = (v: unknown): boolean =>
      v != null && String(v).trim().toUpperCase().startsWith('Y')

    return liveSummary.rows.map((row) => {
      const sat = parseScore(row[iSAT]),
        abd = parseScore(row[iABD]),
        ded = parseScore(row[iDED]),
        elr = parseScore(row[iELR])
      const envScores = [sat, abd, ded, elr].filter(
        (n): n is number => n != null,
      )
      return {
        uniqueId: `live-${row[iUID]}-${row[iModel]}-${row[iRev]}`,
        uid: String(row[iUID] ?? ''),
        model: String(row[iModel] ?? ''),
        rev: String(row[iRev] ?? ''),
        avgScore: envScores.length
          ? envScores.reduce((a, b) => a + b, 0) / envScores.length
          : null,
        weight: parseNum(row[iWgt]),
        pts: parseNum(row[iPts]),
        eligible: parseBoolY(row[iElig]),
        sat,
        abd,
        ded,
        elr,
        l1: parseNum(row[iL1]),
        l2: parseNum(row[iL2]),
        l3: parseNum(row[iL3]),
        l4: parseNum(row[iL4]),
      }
    })
  }, [liveSummary])

  const baseRows = (
    viewMode === 'historical' ? historicalRows : liveRows
  ) as Array<any & { uniqueId: string; eligible: boolean }>

  // Sorting logic for Live view
  const rows = useMemo(() => {
    if (viewMode !== 'live') return baseRows
    const arr = [...(baseRows as any[])]
    const getVal = (r: any): any => {
      switch (sortField) {
        case 'weight':
          return Number.isFinite(r.weight) ? r.weight : -Infinity
        case 'uid':
          return Number.isFinite(Number(r.uid)) ? Number(r.uid) : Infinity
        case 'avgScore':
          return Number.isFinite(r.avgScore) ? r.avgScore : -Infinity
        case 'success':
          return (
            enrichedMap[liveKey(r.uid, r.model)]?.success_rate_percent ??
            -Infinity
          )
        case 'pts':
          return Number.isFinite(r.pts) ? r.pts : -Infinity
        case 'model':
          return String(r.model || '').toLowerCase()
        default:
          return 0
      }
    }
    arr.sort((a, b) => {
      const av = getVal(a),
        bv = getVal(b)
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [baseRows, viewMode, sortField, sortDir, enrichedMap])

  const loading =
    viewMode === 'historical'
      ? isHistoricalLoading && historicalRows.length === 0
      : isLiveLoading && liveRows.length === 0
  const errorMsg =
    viewMode === 'historical'
      ? historicalQueryError
        ? String(historicalQueryError)
        : null
      : liveError ?? null

  const { environments: envs, loading: envLoading } = useEnvironments()

  const toggleSort = (field: typeof sortField) => {
    if (viewMode !== 'live') return
    setSortDir((prev) =>
      sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc',
    )
    setSortField(field)
  }

  const viewModeToggle = (
    <div className="inline-flex items-center gap-0">
      <ToggleButton
        active={viewMode === 'live'}
        onClick={() => setViewMode('live')}
        theme={theme}
        position="left"
      >
        Live
      </ToggleButton>
      <ToggleButton
        active={viewMode === 'historical'}
        onClick={() => setViewMode('historical')}
        theme={theme}
        position="right"
      >
        Historical
      </ToggleButton>
    </div>
  )

  // RENDER METHOD STARTS HERE
  return (
    <div className="space-y-4 text-gray-900 dark:text-white">
      {/* Overview Stats */}
      <Card
        title="SUBNET OVERVIEW"
        theme={theme}
        headerActions={viewModeToggle}
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="text-black">
            <div className="text-xs font-mono uppercase tracking-wider">
              Total Models
            </div>

            <div className="text-7xl font-sans">
              {loading ? (
                <Skeleton theme={theme} className="h-6 w-12 mx-auto" />
              ) : (
                rows.length
              )}
            </div>
          </div>
          {/* <div className="text-center">
            <div className="text-2xl font-sans font-bold">
              {loading ? (
                <Skeleton theme={theme} className="h-6 w-12 mx-auto" />
              ) : (
                rows.length
              )}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider ">
              Total Models
            </div>
          </div> */}

          <div className="text-black">
            <div className="text-xs font-mono uppercase tracking-wider ">
              Eligible
            </div>

            <div className="text-7xl font-sans">
              {loading ? (
                <Skeleton theme={theme} className="h-6 w-12 mx-auto" />
              ) : (
                rows.filter((r) => r.eligible).length
              )}
            </div>
          </div>
          {/* <div className="text-center">
            <div className="text-2xl font-sans font-bold text-green-600 dark:text-green-400">
              {loading ? (
                <Skeleton theme={theme} className="h-6 w-12 mx-auto" />
              ) : (
                rows.filter((r) => r.eligible).length
              )}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider ">
              Eligible
            </div>
          </div> */}

          <div className="text-black">
            <div className="text-xs font-mono uppercase tracking-wider ">
              Environments
            </div>

            <div className="text-7xl font-sans">
              {envLoading ? (
                <Skeleton theme={theme} className="h-6 w-12 mx-auto" />
              ) : (
                envs.length
              )}
            </div>
          </div>
          {/* <div className="text-center">
            <div className="text-2xl font-sans font-bold ">
              {envLoading ? (
                <Skeleton theme={theme} className="h-6 w-12 mx-auto" />
              ) : (
                envs.length
              )}
            </div>
            <div className="text-xs font-sans uppercase tracking-wider ">
              Environments
            </div>
          </div> */}
        </div>
      </Card>

      <ModelsTable
        theme={theme}
        rows={rows}
        loading={loading}
        errorMsg={errorMsg}
        viewMode={viewMode}
        enrichedMap={enrichedMap}
        sortField={sortField}
        sortDir={sortDir}
        toggleSort={toggleSort}
        liveKey={liveKey}
      />
    </div>
  )
}

export default OverviewTable
