import React, { useMemo } from 'react'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import useSubtensorChain from '../hooks/useSubtensorChain'

const StyledNA = () => <span className="uppercase text-black/60">N/A</span>

const useUsdFormatter = () =>
  useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    [],
  )

const MetricItem = ({
  label,
  value,
  title,
}: {
  label: string
  value: React.ReactNode
  title?: string
}) => (
  <div
    className="flex items-center gap-2 whitespace-nowrap text-[10px] font-mono uppercase tracking-[0.22em] text-black/60"
    title={title}
  >
    <span
      aria-hidden="true"
      className="w-1.5 h-1.5 rounded-full bg-black/40"
    />
    <span>{label}</span>
    <span className="tracking-[0.1em]">{value}</span>
  </div>
)

const TopMetricsBar: React.FC = () => {
  const usdFormatter = useUsdFormatter()
  const { environments, loading: envLoading, error: envError } =
    useEnvironments()
  const { data: liveSummary, loading: isLiveLoading } = useValidatorSummary()
  const {
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
  } = useSubtensorChain()

  const { totalModels, eligibleModels } = useMemo(() => {
    if (!liveSummary) {
      return { totalModels: null, eligibleModels: null }
    }

    const rows = liveSummary.rows ?? []
    const columns = liveSummary.columns ?? []
    const eligIndex = columns.indexOf('Elig')

    if (eligIndex === -1) {
      return { totalModels: rows.length, eligibleModels: null }
    }

    let eligible = 0
    rows.forEach((row) => {
      const flag = row[eligIndex]
      if (
        flag != null &&
        String(flag).trim().toUpperCase().startsWith('Y')
      ) {
        eligible += 1
      }
    })

    return {
      totalModels: rows.length,
      eligibleModels: eligible,
    }
  }, [liveSummary])

  const formatUsd = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return null
    return usdFormatter.format(value)
  }

  const formatCount = (
    value: number | null,
    opts?: { loading?: boolean },
  ) => {
    if (opts?.loading) return 'Loading…'
    if (value == null) return <StyledNA />
    return value.toLocaleString()
  }

  const blockValue = currentBlockError
    ? 'Unavailable'
    : typeof currentBlock === 'number'
    ? currentBlock.toLocaleString()
    : currentBlockLoading
    ? 'Syncing…'
    : '—'
  const blockTitle = currentBlockError ?? undefined

  const alphaPriceDisplay = alphaPriceLoading
    ? 'Loading…'
    : alphaPriceUsd != null && alphaPriceTao != null
    ? `ⴷ ${alphaPriceTao.toFixed(4)} (${formatUsd(alphaPriceUsd)})`
    : alphaPriceError
    ? 'Unavailable'
    : <StyledNA />

  const alphaPriceUpdatedAt = (() => {
    if (!alphaPriceTimestamp) return null
    const date = new Date(alphaPriceTimestamp)
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString()
  })()
  const alphaPriceTitle = alphaPriceError
    ? alphaPriceError
    : alphaPriceLoading
    ? undefined
    : alphaPriceUpdatedAt
    ? `Updated ${alphaPriceUpdatedAt}`
    : undefined

  const taoPriceFormatted =
    taoPriceUsd != null ? formatUsd(taoPriceUsd) ?? '—' : null
  const taoPriceDisplay = taoPriceLoading
    ? 'Loading…'
    : taoPriceFormatted ?? 'Unavailable'
  const taoPriceTitle =
    taoPriceLoading || taoPriceFormatted
      ? undefined
      : taoPriceError ?? undefined

  const metrics = [
    {
      label: 'Models',
      value: formatCount(totalModels, { loading: isLiveLoading }),
    },
    {
      label: 'Eligible',
      value: formatCount(eligibleModels, { loading: isLiveLoading }),
    },
    {
      label: 'Environments',
      value: envLoading
        ? 'Loading…'
        : envError
        ? 'Unavailable'
        : formatCount(environments.length),
      title: envError ?? undefined,
    },
    { label: 'Block', value: blockValue, title: blockTitle },
    { label: 'Alpha Price', value: alphaPriceDisplay, title: alphaPriceTitle },
    { label: 'TAO Price', value: taoPriceDisplay, title: taoPriceTitle },
  ]

  return (
    <div className="w-full border-t border-black/10 pt-3 mt-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {metrics.map(({ label, value, title }) => (
          <MetricItem key={label} label={label} value={value} title={title} />
        ))}
      </div>
    </div>
  )
}

export default TopMetricsBar
