import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchNetworkActivity, NetworkActivityRow } from '../services/api'
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Line,
  Tooltip,
  Legend,
} from 'recharts'
import Card from './Card'
import { useTailwindColors } from '../hooks/useTailwindColors'

interface Props {
  theme: 'light' | 'dark'
}

const formatDate = (isoDate: string) => {
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return isoDate
  }
}

const compactNumber = (n: number) =>
  new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)

const NetworkActivityChart: React.FC<Props> = ({ theme }) => {
  const colors = useTailwindColors()
  const { data, isLoading, error } = useQuery<NetworkActivityRow[]>({
    queryKey: ['network-activity'],
    queryFn: fetchNetworkActivity,
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchOnMount: false,
  })

  // Normalize server and mock data to expose two lines:
  // - avg_all_plot: daily average over all models (continuous)
  // - avg_top50_daily_plot: daily average over top 50 models for that day (dynamic cohort)
  const chartData = (data ?? []).map((row) => ({
    ...row,
    // API returns { avg_all, avg_top50_daily }; mock has only { average_score }
    avg_all_plot: (row as any).avg_all ?? (row as any).average_score ?? null,
    avg_top50_daily_plot: (row as any).avg_top50_daily ?? null,
  }))

  return (
    <Card title="Network Activity & Performance (Last 60 Days)" theme={theme}>
      {error && (
        <div className="text-red-600 dark:text-red-400">
          {(error as Error).message}
        </div>
      )}
      {isLoading && !error && (
        <div style={{ width: '100%', height: 300 }}>
          <div className="h-full w-full animate-pulse bg-light-200 dark:bg-dark-200" />
        </div>
      )}

      {!isLoading && !error && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 56, left: 56, bottom: 20 }}
            >
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.primary} />
              <XAxis
                dataKey="period"
                tickFormatter={formatDate}
                stroke={colors.primary}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke={colors.primary}
                tickFormatter={(v: number) => compactNumber(v)}
                tickMargin={8}
                label={{
                  value: 'Total Rollouts',
                  angle: -90,
                  position: 'left',
                  offset: 15,
                  fill: colors.primary,
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={colors.primary}
                label={{
                  value: 'Avg Score',
                  angle: 90,
                  position: 'right',
                  offset: 15,
                  fill: colors.primary,
                }}
                domain={[0, 1]}
                tickFormatter={(v: number) => v.toFixed(2)}
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  background: colors.bg,
                  border: 'none',
                  borderRadius: 8,
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.7)',
                  padding: '20px',
                  color: colors.secondary,
                }}
                labelFormatter={(label) => `Date: ${formatDate(String(label))}`}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="total_rollouts"
                name="Total Rollouts"
                fill="url(#blueGradient)"
                stroke={colors.blue}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_all_plot"
                name="Average Score (All Models)"
                stroke={colors.green}
                dot={false}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_top50_daily_plot"
                name="Average Score (Top 50 Daily)"
                stroke={colors.orange}
                strokeDasharray="5 3"
                dot={false}
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default NetworkActivityChart
