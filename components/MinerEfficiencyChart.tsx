'use client';

import React from 'react'
import { MinerEfficiencyRow } from '@/lib/types'
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
} from 'recharts'
import { Skeleton, SkeletonText } from './Skeleton'
import Card from './Card'

interface Props {
  theme: 'light' | 'dark';
  data: MinerEfficiencyRow[];
  errorMessage?: string | null;
}

type TooltipProps = {
  active?: boolean
  payload?: any[]
  label?: any
}

type RelayTooltipProps = TooltipProps & {
  onUpdate: (row: MinerEfficiencyRow | null) => void
}

const CustomTooltip: React.FC<RelayTooltipProps> = ({
  active,
  payload,
  onUpdate,
}) => {
  const lastKeyRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    let next: MinerEfficiencyRow | null = null
    if (active && payload && payload.length > 0) {
      next = payload[0].payload as MinerEfficiencyRow
    }
    const nextKey = next?.hotkey ?? null

    // Only update when the hovered point actually changes.
    if (nextKey !== lastKeyRef.current) {
      onUpdate(next)
      lastKeyRef.current = nextKey
    }
  }, [active, payload, onUpdate])

  return null
}

type ChartProps = {
  theme: 'light' | 'dark'
  data: MinerEfficiencyRow[]
  setHovered: (row: MinerEfficiencyRow | null) => void
}

const MinerScatterChart = React.memo<ChartProps>(function MinerScatterChartComponent({
  theme,
  data,
  setHovered,
}) {
    const axisColor = theme === 'dark' ? '#ddd' : '#333'
    const gridColor = theme === 'dark' ? '#333' : '#ddd'
    const dotColor = theme === 'dark' ? '#60a5fa' : '#3b82f6'

    return (
      <div style={{ width: '100%', height: 600 }}>
        <ResponsiveContainer>
          <ScatterChart
            margin={{ top: 32, right: 24, bottom: 56, left: 64 }}
            onMouseLeave={() => setHovered(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              dataKey="avg_latency"
              name="Avg Latency (s)"
              unit="s"
              stroke={axisColor}
              domain={[0, 'auto']}
              tickMargin={8}
              height={48}
              label={{
                value: 'Avg Latency (s) ↓ is better',
                position: 'bottom',
                offset: 28,
                fill: axisColor,
              }}
            />
            <YAxis
              type="number"
              dataKey="avg_score"
              name="Avg Score"
              stroke={axisColor}
              domain={[0, 1]}
              label={{
                value: 'Avg Score ↑ is better',
                angle: -90,
                position: 'left',
                offset: 0,
                fill: axisColor,
              }}
            />
            <Tooltip content={<CustomTooltip onUpdate={setHovered} />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 8 }}
              height={24}
            />
            <Scatter
              name="Miners"
              data={data}
              fill={dotColor}
              shape="circle"
              stroke={theme === 'dark' ? '#93c5fd' : '#1d4ed8'}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    )
})

const MinerEfficiencyChart: React.FC<Props> = ({ theme, data, errorMessage }) => {
  const [hovered, setHovered] = React.useState<MinerEfficiencyRow | null>(null)

  return (
    <Card title="Performance vs. Latency (7d Active Miners)" theme={theme}>
      <div
        className="mb-3 p-2 bg-gray-50 border border-gray-200 text-gray-900 dark:bg-black/40 dark:border-white/20 dark:text-white font-sans text-xs"
        style={{ minHeight: 80 }}
      >
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <>
            <div>
              <strong>Miner</strong>
            </div>
            <div>Hotkey: {hovered?.hotkey ?? '—'}</div>
            <div>Model: {hovered?.model ?? '—'}</div>
            <div>
              Avg Score: {hovered ? hovered.avg_score.toFixed(3) : '—'}
            </div>
            <div>
              Avg Latency:{' '}
              {hovered
                ? hovered.avg_latency == null
                  ? '—'
                  : `${hovered.avg_latency.toFixed(2)}s`
                : '—'}
            </div>
          </>
        </div>
      </div>

      {errorMessage && (
        <div className="text-red-600 dark:text-red-400">{errorMessage}</div>
      )}
      {!errorMessage && data.length === 0 && (
        <div style={{ width: '100%', height: 340 }}>
          <div className="h-full w-full animate-pulse bg-gray-100 dark:bg-gray-900" />
        </div>
      )}

      {!errorMessage && data.length > 0 && (
        <MinerScatterChart
          theme={theme}
          data={data}
          setHovered={setHovered}
        />
      )}
    </Card>
  )
}

export default MinerEfficiencyChart
