import React from 'react'
import type { OverviewMetric } from '../hooks/useOverviewMetrics'
import { Skeleton } from './Skeleton'

type OverviewMetricCardProps = OverviewMetric & {
  className?: string
  density?: 'default' | 'compact'
}

const MetricValue: React.FC<{ loading?: boolean; value: React.ReactNode }> = ({
  loading,
  value,
}) => {
  if (loading) {
    return <Skeleton theme="light" className="h-4 w-8" />
  }
  return <>{value}</>
}

const OverviewMetricCard: React.FC<OverviewMetricCardProps> = ({
  label,
  value,
  loading = false,
  valueClassName,
  className = '',
  title,
  density = 'default',
}) => {
  const paddingClass = density === 'compact' ? 'p-2' : 'p-2 md:p-4'
  const labelClass = density === 'compact' ? 'text-[10px]' : 'text-xs'
  const chevronSize = density === 'compact' ? 'size-2.5' : 'size-3'
  const compactValueOverride = density === 'compact' ? 'text-xl' : ''
  const resolvedValueClass = valueClassName ?? 'text-3xl'

  return (
    <div
      className={`text-light-smoke bg-white rounded-[4px] ${paddingClass} flex flex-col justify-between ${className}`}
      title={title}
    >
      <div
        className={`${labelClass} font-mono uppercase tracking-wide leading-[80%]`}
      >
        {label}
      </div>

      <div className="mt-2 flex justify-between items-end">
        <div className={`${resolvedValueClass} ${compactValueOverride} leading-[80%]`}>
          <MetricValue loading={loading} value={value} />
        </div>
        <div
          className={`${chevronSize} bg-light-iron [clip-path:polygon(0_100%,100%_0,100%_100%)]`}
        />
      </div>
    </div>
  )
}

export default OverviewMetricCard
