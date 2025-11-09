import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import Card from './Card'
import { Skeleton } from './Skeleton'
import {
  fetchSubnetPerformanceTrend,
  type SubnetPerformanceTrendPoint,
  type SubnetPerformanceTrendResponse,
} from '../services/api'
import { useTailwindColors } from '../hooks/useTailwindColors'

interface Props {
  theme: 'light' | 'dark'
}

type TooltipProps = {
  active?: boolean
  payload?: Array<{
    payload: SubnetPerformanceTrendPoint
    [key: string]: unknown
  }>
  label?: string
}

const formatDateLabel = (iso: string | undefined) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
  })
}

const formatFullDateTime = (iso: string | undefined) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const renderScore = (score: number | null | undefined, fractionDigits = 3) => {
  if (score == null || !Number.isFinite(score)) return '—'
  return score.toFixed(fractionDigits)
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as SubnetPerformanceTrendPoint
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/20 dark:bg-black/80 dark:text-white">
      <div className="font-semibold">
        {formatFullDateTime(label ?? point.timestamp)}
      </div>
      <div className="mt-1 text-[11px]">
        Block: <span className="font-mono">{point.block.toLocaleString()}</span>
      </div>
      <div className="font-mono">
        Top Accuracy: {renderScore(point.score, 4)}
      </div>
    </div>
  )
}

const SubnetPerformanceChart: React.FC<Props> = ({ theme }) => {
  const colors = useTailwindColors(theme)
  const { data, isLoading, error } = useQuery<SubnetPerformanceTrendResponse>({
    queryKey: ['subnet-performance-trend'],
    queryFn: fetchSubnetPerformanceTrend,
    staleTime: 60_000,
    refetchInterval: 180_000,
    refetchOnMount: false,
  })

  const points = data ?? []
  const chartData = points.filter(
    (point): point is SubnetPerformanceTrendPoint & { score: number } => {
      if (typeof point.score !== 'number') return false
      return Number.isFinite(point.score)
    }
  )

  const axisColor = colors.primary ?? (theme === 'dark' ? '#e2e8f0' : '#475569')
  const gridColor =
    theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
  const gradientId = 'subnetTrendArea'

  const hasChartData = chartData.length > 0

  return (
    <Card theme={theme} title="Performance">
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {(error as Error).message ?? 'Failed to load trend data'}
        </div>
      )}

      {isLoading && !error && (
        <div className="h-72 w-full">
          <Skeleton theme={theme} className="h-full w-full" />
        </div>
      )}

      {!isLoading && !error && !hasChartData && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          No performance data available for the past 30 days.
        </div>
      )}

      {!isLoading && !error && hasChartData && (
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 24, left: 24, bottom: 20 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F55845" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#D39C37" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="none"
                stroke={gridColor}
                vertical={false}
                horizontal={true}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value: string) => formatDateLabel(value)}
                stroke={axisColor}
                tickMargin={8}
                tick={{
                  fill: axisColor,
                  fontSize: 12,
                  fontFamily: 'PP Neue Montreal, Inter, system-ui, sans-serif',
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                stroke={axisColor}
                tickFormatter={(value: number) => value.toFixed(2)}
                tickMargin={8}
                tick={{
                  fill: axisColor,
                  fontSize: 12,
                  fontFamily: 'PP Neue Montreal, Inter, system-ui, sans-serif',
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#F55845"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default SubnetPerformanceChart
