import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchSubnetOverview,
  SubnetOverviewRow,
  enrichLiveSubnetRows,
  LiveEnrichmentRow,
} from '../services/api'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from './Skeleton'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import Card from './Card'
import ToggleButton from './ToggleButton'
import ModelsTable from './ModelsTable'
import useSubtensorChain from '../hooks/useSubtensorChain'
import { getEnvScoreStats } from './ScoreCell'
import { RAO_PER_TAO } from '../services/pricing'
// import ActivityFeed from './ActivityFeed'

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
  pts: number | null
  firstBlk: number | null
  emissionRaw: string | null
  emissionAlpha: number | null
  samples: number | null
  l1?: number | null
  l2?: number | null
  l3?: number | null
  l4?: number | null
  l5?: number | null
  l6?: number | null
  l7?: number | null
  l8?: number | null
  hotkey: string
  envScores: Record<string, string | null>
  envSamples: Record<string, number | null>
}

const StyledNA = () => <span className="text-light-iron uppercase">N/A</span>

const OverviewTable: React.FC<OverviewTableProps> = ({ theme }) => {
  const [viewMode, setViewMode] = useState<'historical' | 'live'>('live')
  const [enrichedMap, setEnrichedMap] = useState<
    Record<string, LiveEnrichmentRow>
  >({})
  const [enriching, setEnriching] = useState<boolean>(false)
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [sortField, setSortField] = useState<string>('emission')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [emissionUnit, setEmissionUnit] = useState<'alpha' | 'usd'>('alpha')
  const RAO_PER_TAO_NUMBER = Number(RAO_PER_TAO)

  const {
    currentBlock,
    currentBlockLoading,
    currentBlockError,
    emissionByUid,
    alphaPriceUsd,
    alphaPriceTao,
    alphaPriceLoading,
    alphaPriceError,
    alphaPriceTimestamp,
    taoPriceUsd,
    taoPriceLoading,
    taoPriceError,
  } = useSubtensorChain()

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

    const minersByUid = new Map()
    if (liveSummary.miners) {
      for (const miner of Object.values(liveSummary.miners)) {
        if (miner) {
          minersByUid.set(miner.uid, miner)
        }
      }
    }

    const envCols: { name: string; index: number }[] = []
    cols.forEach((c, i) => {
      if (c.includes(':')) {
        envCols.push({ name: c, index: i })
      }
    })

    const iUID = idx('UID'),
      iModel = idx('Model'),
      iRev = idx('Rev'),
      iL1 = idx('L1'),
      iL2 = idx('L2'),
      iL3 = idx('L3'),
      iL4 = idx('L4'),
      iL5 = idx('L5'),
      iL6 = idx('L6'),
      iL7 = idx('L7'),
      iL8 = idx('L8'),
      iPts = idx('Pts'),
      iElig = idx('Elig'),
      iWgt = idx('Wgt'),
      iFirstBlk = idx('FirstBlk')

    const parseScoreValue = (v: unknown): number | null =>
      v == null
        ? null
        : parseFloat(String(v).replace(/\*/g, '').split('/')[0]) || null
    const parseNum = (v: unknown): number | null =>
      v == null || v === ''
        ? null
        : (typeof v === 'number' ? v : parseFloat(String(v))) || null
    const parseBoolY = (v: unknown): boolean =>
      v != null && String(v).trim().toUpperCase().startsWith('Y')
    const parseEmissionAlpha = (v: string | null | undefined): number | null => {
      if (!v) return null
      try {
        const value = BigInt(v)
        const whole = value / RAO_PER_TAO
        const remainder = value % RAO_PER_TAO
        const total =
          Number(whole) + Number(remainder) / RAO_PER_TAO_NUMBER
        return Number.isFinite(total) ? total : null
      } catch {
        const numeric = Number(v)
        if (!Number.isFinite(numeric)) return null
        return numeric / 1_000_000_000
      }
    }

    return liveSummary.rows.map((row) => {
      const uidNumeric = parseNum(row[iUID])
      const miner = uidNumeric != null ? minersByUid.get(uidNumeric) : null

      const envScores: Record<string, string | null> = {}
      const envSamples: Record<string, number | null> = {}
      const numericScores: (number | null)[] = []
      let totalSamples = 0
      const envSampleLookup = new Map<string, number | null>()

      if (miner && miner.environments) {
        for (const [envName, envStats] of Object.entries(
          miner.environments,
        )) {
          const count = envStats?.count ?? null
          const normalized = envName.toLowerCase()
          envSampleLookup.set(normalized, count)
          const parts = envName.split(':')
          if (parts.length > 1) {
            const lastSegment = parts[parts.length - 1].toLowerCase()
            if (!envSampleLookup.has(lastSegment)) {
              envSampleLookup.set(lastSegment, count)
            }
            const tail = parts.slice(1).join(':').toLowerCase()
            if (tail && !envSampleLookup.has(tail)) {
              envSampleLookup.set(tail, count)
            }
          }
        }
      }

      envCols.forEach((env) => {
        const rawScore = row[env.index]
        envScores[env.name] = rawScore == null ? null : String(rawScore)
        numericScores.push(parseScoreValue(rawScore))

        let sampleCount: number | null = null
        const candidateKeys: string[] = []
        const lowerName = env.name.toLowerCase()
        candidateKeys.push(lowerName)
        const parts = env.name.split(':')
        if (parts.length > 1) {
          const lastSegment = parts[parts.length - 1]
          if (lastSegment) candidateKeys.push(lastSegment.toLowerCase())
          const tail = parts.slice(1).join(':')
          if (tail) candidateKeys.push(tail.toLowerCase())
        }
        for (const key of candidateKeys) {
          if (envSampleLookup.has(key)) {
            sampleCount = envSampleLookup.get(key) ?? null
            break
          }
        }
        envSamples[env.name] = sampleCount
      })

      if (miner && miner.environments) {
        for (const envName in miner.environments) {
          const envStats = miner.environments[envName]
          if (envStats) {
            totalSamples += envStats.count ?? 0
          }
        }
      }

      const validScores = numericScores.filter((s): s is number => s != null)
      const avgScore = validScores.length
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : null

      const emissionEntry =
        uidNumeric != null
          ? emissionByUid.get(Number(uidNumeric))
          : undefined
      const emissionRaw = emissionEntry?.emission ?? null
      const emissionAlpha = parseEmissionAlpha(emissionRaw)

      return {
        uniqueId: `live-${row[iUID]}-${row[iModel]}-${row[iRev]}`,
        uid: String(row[iUID] ?? ''),
        model: String(row[iModel] ?? ''),
        rev: String(row[iRev] ?? ''),
        avgScore,
        samples: totalSamples,
        weight: parseNum(row[iWgt]),
        pts: parseNum(row[iPts]),
        eligible: parseBoolY(row[iElig]),
        hotkey: miner?.hotkey ?? '',
        firstBlk: parseNum(row[iFirstBlk]),
        envScores,
        envSamples,
        emissionRaw,
        emissionAlpha,
        l1: parseNum(row[iL1]),
        l2: parseNum(row[iL2]),
        l3: parseNum(row[iL3]),
        l4: parseNum(row[iL4]),
        l5: parseNum(row[iL5]),
        l6: parseNum(row[iL6]),
        l7: parseNum(row[iL7]),
        l8: parseNum(row[iL8]),
      }
    })
  }, [liveSummary, emissionByUid])

  const baseRows = (
    viewMode === 'historical' ? historicalRows : liveRows
  ) as Array<any & { uniqueId: string; eligible: boolean }>

  const searchedRows = useMemo(() => {
    if (!searchQuery) {
      return baseRows
    }
    const lowerQuery = searchQuery.toLowerCase()
    return baseRows.filter((row) => {
      const model = String(row.model || '').toLowerCase()
      const uid = String(row.uid || '').toLowerCase()
      const hotkey = String(row.hotkey || '').toLowerCase()
      return (
        model.includes(lowerQuery) ||
        uid.includes(lowerQuery) ||
        hotkey.includes(lowerQuery)
      )
    })
  }, [baseRows, searchQuery])

  // Sorting logic for Live view
  const rows = useMemo(() => {
    if (viewMode !== 'live') return searchedRows
    const arr = [...(searchedRows as any[])]
    const getVal = (r: any): any => {
      if (sortField.startsWith('L')) {
        return Number.isFinite(r[sortField.toLowerCase()])
          ? r[sortField.toLowerCase()]
          : -Infinity
      }
      if (r.envScores && sortField in r.envScores) {
        const rawScore = r.envScores[sortField]
        if (!rawScore) return -Infinity
        const stats = getEnvScoreStats(rawScore)
        if (stats) return stats.min
        const match = String(rawScore)
          .trim()
          .match(/[+-]?\d+(?:\.\d+)?/)
        const numeric = match ? parseFloat(match[0]) : NaN
        return Number.isFinite(numeric) ? numeric : -Infinity
      }
      switch (sortField) {
        case 'emission':
          return Number.isFinite(r.emissionAlpha)
            ? r.emissionAlpha
            : -Infinity
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
  }, [searchedRows, viewMode, sortField, sortDir, enrichedMap])

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

  const toggleSort = (field: string) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-12">
      <div className="lg:col-span-full order-1">
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentBlock={currentBlock}
          currentBlockLoading={currentBlockLoading}
          currentBlockError={currentBlockError}
          alphaPriceUsd={alphaPriceUsd}
          alphaPriceTao={alphaPriceTao}
          alphaPriceLoading={alphaPriceLoading}
          alphaPriceError={alphaPriceError}
          alphaPriceTimestamp={alphaPriceTimestamp}
          taoPriceUsd={taoPriceUsd}
          taoPriceLoading={taoPriceLoading}
          taoPriceError={taoPriceError}
          emissionUnit={emissionUnit}
          onEmissionUnitChange={setEmissionUnit}
        />
      </div>

      {/* <div className="lg:col-span-1 order-2">
  <ActivityFeed theme={theme} />
</div> */}
    </div>
  )
}

export default OverviewTable
