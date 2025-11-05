import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ComposedChart,
  Bar,
  Line,
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
        {formatDateLabel(label ?? point.timestamp)}
      </div>
      <div className="mt-1 font-mono">
        Avg Score: {renderScore(point.score, 4)}
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

  const points = data?.data ?? []
  const topHotkey = data?.hotkey ?? null

  const chartData = points.map((point) => ({
    ...point,
    scoreComplement: 1 - (point.score ?? 0),
  }))

  const axisColor = colors.primary ?? (theme === 'dark' ? '#e2e8f0' : '#475569')
  const gridColor =
    theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'

  return (
    <Card
      theme={theme}
      title="Subnet Performance Trend"
      subtitle="Historical daily average performance of the current top miner."
    >
      <div className="mb-4 text-xs font-mono uppercase tracking-wide text-gray-600 dark:text-gray-300 break-all">
        Tracking hotkey: <span>{topHotkey ? topHotkey : 'Unavailable'}</span>
      </div>

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

      {!isLoading && !error && points.length === 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          No historical data available for the top miner in the past 30 days.
        </div>
      )}

      {!isLoading && !error && points.length > 0 && (
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 24, left: 24, bottom: 20 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F55845" />
                  <stop offset="100%" stopColor="#D39C37" />
                </linearGradient>
                <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#C3CFD7" />
                  <stop offset="100%" stopColor="#77858E" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="none"
                stroke={gridColor}
                vertical={true}
                horizontal={false}
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
              <Bar
                dataKey="score"
                stackId="bar"
                fill="url(#barGradient)"
                radius={[2, 2, 0, 0]}
                barSize={3}
              />
              <Bar
                dataKey="scoreComplement"
                stackId="bar"
                fill="#F5F5F5"
                radius={[0, 0, 2, 2]}
                barSize={3}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#lineGradient)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default SubnetPerformanceChart
