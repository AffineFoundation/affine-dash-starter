import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchScoreDistributionByEnv,
  type ScoreDistributionByEnvRow,
} from '../services/api'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  Legend,
} from 'recharts'
import Card from './Card'
import { useTailwindColors } from '../hooks/useTailwindColors'

interface Props {
  env: string // e.g., 'SAT'
  theme: 'light' | 'dark'
}

const bucketLabel = (bucket: number) => {
  const start = (bucket - 1) * 10
  const end = bucket * 10
  return `${start}-${end}%`
}

const ScoreDistributionHistogram: React.FC<Props> = ({ env, theme }) => {
  const colors = useTailwindColors(theme)
  const { data, isLoading, error } = useQuery<ScoreDistributionByEnvRow[]>({
    queryKey: ['score-distribution-by-env', env],
    queryFn: () => fetchScoreDistributionByEnv(env),
    enabled: Boolean(env),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnMount: false,
  })

  const chartData = useMemo(() => {
    const rows = Array.isArray(data) ? data : []
    // Ensure buckets 1..10 present
    const filled = Array.from({ length: 10 }, (_, i) => {
      const b = i + 1
      const found = rows.find((r) => r.score_bucket === b)
      return {
        bucket: b,
        label: bucketLabel(b),
        number_of_miners: found ? found.number_of_miners : 0,
      }
    })
    return filled
  }, [data])

  return (
    <Card title={`Score Distribution — ${env}`} theme={theme}>
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
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 24, left: 24, bottom: 20 }}
            >
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.blue} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="none" stroke={colors.lines} />
              <XAxis dataKey="label" stroke={colors.primary} tickMargin={8} />
              <YAxis
                stroke={colors.primary}
                tickMargin={8}
                label={{
                  value: 'Number of Miners',
                  angle: -90,
                  position: 'left',
                  offset: 0,
                  fill: colors.primary,
                }}
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
                formatter={(value: any) => [value, 'Miners']}
                labelFormatter={(label) => `Bucket: ${label}`}
              />
              <Legend
                iconSize={12}
                wrapperStyle={{ bottom: 0 }}
                formatter={(value) => (
                  <span style={{ fontSize: 12 }}>{value}</span>
                )}
              />
              <Bar
                dataKey="number_of_miners"
                name="Miners"
                fill="url(#blueGradient)"
                stroke={colors.blue}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default ScoreDistributionHistogram
