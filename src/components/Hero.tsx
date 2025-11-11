import { useEnvironments } from '../contexts/EnvironmentsContext'
import React, { useMemo } from 'react'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import { Skeleton } from './Skeleton'
import useSubtensorChain from '../hooks/useSubtensorChain'

const StyledNA = () => <span className="text-light-iron uppercase">N/A</span>

const MetricValue = ({
  loading,
  value,
}: {
  loading: boolean
  value: React.ReactNode
}) => {
  if (loading) {
    return <Skeleton theme="light" className="h-4 w-8" />
  }
  return <>{value}</>
}

export default function Hero() {
  const { environments, loading: envLoading } = useEnvironments()
  const { data: liveSummary, loading: isLiveLoading } = useValidatorSummary()
  const {
    currentBlock,
    currentBlockLoading,
    currentBlockError,
    alphaPriceUsd,
    alphaPriceTao,
    alphaPriceLoading,
    alphaPriceError,
    taoPriceUsd,
    taoPriceLoading,
    taoPriceError,
  } = useSubtensorChain()
  const usdFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }),
    [],
  )

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

  const blockValue = currentBlockError
    ? 'Unavailable'
    : typeof currentBlock === 'number'
    ? currentBlock.toLocaleString()
    : currentBlockLoading
    ? 'Syncing…'
    : <StyledNA />

  const alphaPriceValue =
    alphaPriceError && !alphaPriceLoading
      ? 'Unavailable'
      : alphaPriceUsd != null && alphaPriceTao != null
      ? `ⴷ ${alphaPriceTao.toFixed(4)} (${formatUsd(alphaPriceUsd) ?? '—'})`
      : <StyledNA />

  const taoPriceValue =
    taoPriceError && !taoPriceLoading
      ? 'Unavailable'
      : taoPriceUsd != null
      ? formatUsd(taoPriceUsd) ?? '—'
      : <StyledNA />

  const cards: HeroCardProps[] = [
    {
      label: 'Models',
      value: totalModels == null ? <StyledNA /> : totalModels.toLocaleString(),
      loading: isLiveLoading,
    },
    {
      label: 'Eligible',
      value:
        eligibleModels == null ? (
          <StyledNA />
        ) : (
          eligibleModels.toLocaleString()
        ),
      loading: isLiveLoading,
    },
    {
      label: 'Environments',
      value:
        environments.length === 0 ? (
          <StyledNA />
        ) : (
          environments.length.toLocaleString()
        ),
      loading: envLoading,
    },
    {
      label: 'Block',
      value: blockValue,
      loading: currentBlockLoading,
    },
    {
      label: 'Alpha Price',
      value: alphaPriceValue,
      loading: alphaPriceLoading,
      valueClassName: 'text-xl',
    },
    {
      label: 'TAO Price',
      value: taoPriceValue,
      loading: taoPriceLoading,
    },
  ]

  return (
    <div className="px-3 md:px-5 mt-10 md:mt-20">
      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-3 xl:grid-cols-6 max-[520px]:grid-cols-1">
        {cards.map((card) => (
          <HeroCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  )
}

interface HeroCardProps {
  label: string
  value: React.ReactNode
  loading?: boolean
  valueClassName?: string
}

const HeroCard: React.FC<HeroCardProps> = ({
  label,
  value,
  loading = false,
  valueClassName = 'text-3xl',
}) => (
  <div className="text-light-smoke bg-white rounded-[4px] p-2 md:p-4 flex flex-col justify-between">
    <div className="text-xs font-mono uppercase tracking-wide leading-[80%]">
      {label}
    </div>

    <div className="mt-2 flex justify-between items-end">
      <div className={`${valueClassName} leading-[80%]`}>
        <MetricValue loading={loading} value={value} />
      </div>
      <div className="size-3 bg-light-iron [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
    </div>
  </div>
)
