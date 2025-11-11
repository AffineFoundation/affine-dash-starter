import React from 'react'
import { useOverviewMetrics } from '../hooks/useOverviewMetrics'
import OverviewMetricCard from './OverviewMetricCard'

export default function Hero() {
  const { metrics } = useOverviewMetrics()

  return (
    <div className="px-3 md:px-5 mt-10 md:mt-20 lg:hidden">
      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-3 xl:grid-cols-6 max-[520px]:grid-cols-1">
        {metrics.map((card) => (
          <OverviewMetricCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  )
}
