import React, { useMemo } from 'react'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import { useValidatorSummary } from './useValidatorSummary'
import useSubtensorChain from './useSubtensorChain'

const StyledNA = () => <span className="text-light-iron uppercase">N/A</span>

export type OverviewMetric = {
  label: string
  value: React.ReactNode
  loading?: boolean
  valueClassName?: string
  title?: string
}

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

export const useOverviewMetrics = () => {
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
  const usdFormatter = useUsdFormatter()

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
    : '—'
  const blockTitle = currentBlockError ?? undefined

  const alphaPriceValue =
    alphaPriceError && !alphaPriceLoading
      ? 'Unavailable'
      : alphaPriceUsd != null && alphaPriceTao != null
      ? `ⴷ ${alphaPriceTao.toFixed(4)} (${formatUsd(alphaPriceUsd) ?? '—'})`
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

  const taoPriceValue =
    taoPriceError && !taoPriceLoading
      ? 'Unavailable'
      : taoPriceUsd != null
      ? formatUsd(taoPriceUsd) ?? '—'
      : <StyledNA />
  const taoPriceTitle =
    taoPriceLoading || taoPriceUsd != null
      ? undefined
      : taoPriceError ?? undefined

  const metrics: OverviewMetric[] = useMemo(
    () => [
      {
        label: 'Models',
        value:
          totalModels == null ? <StyledNA /> : totalModels.toLocaleString(),
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
        title: envError ?? undefined,
      },
      {
        label: 'Block',
        value: blockValue,
        loading: currentBlockLoading,
        title: blockTitle,
      },
      {
        label: 'Alpha Price',
        value: alphaPriceValue,
        loading: alphaPriceLoading,
        valueClassName: 'text-xl',
        title: alphaPriceTitle,
      },
      {
        label: 'TAO Price',
        value: taoPriceValue,
        loading: taoPriceLoading,
        title: taoPriceTitle,
      },
    ],
    [
      alphaPriceLoading,
      alphaPriceTitle,
      alphaPriceValue,
      blockTitle,
      blockValue,
      eligibleModels,
      envError,
      envLoading,
      environments.length,
      isLiveLoading,
      taoPriceLoading,
      taoPriceTitle,
      taoPriceValue,
      totalModels,
    ],
  )

  return { metrics }
}
