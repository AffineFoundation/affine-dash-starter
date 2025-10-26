'use client';

import React from 'react'
import { EnvironmentStatsRow } from '@/lib/types'
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
  theme: 'light' | 'dark';
  data: EnvironmentStatsRow[];
  errorMessage?: string | null;
}

const compactNumber = (n: number) =>
  new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)

const EnvironmentStatsChart: React.FC<Props> = ({ theme, data, errorMessage }) => {
  const colors = useTailwindColors(theme)

  return (
    <Card
      title="Environment Popularity & Difficulty"
      theme={theme}
      className="min-h-[38rem]"
    >
      {errorMessage && (
        <div className="text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {!errorMessage && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={data ?? []}
              margin={{ top: 12, right: 56, left: 56, bottom: 20 }}
              barGap={4}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="none" stroke={colors.lines} />
              <XAxis
                dataKey="env_name"
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
                  value: 'Success %',
                  angle: 90,
                  position: 'right',
                  offset: 15,
                  fill: colors.primary,
                }}
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                allowDecimals={false}
                tickFormatter={(v: number) => `${v}%`}
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
                formatter={(value: any, name: string) => {
                  if (name === 'Success %')
                    return [`${(value as number).toFixed(1)}%`, name]
                  return [value, name]
                }}
              />
              <Legend
                iconSize={12}
                wrapperStyle={{ bottom: 0 }}
                formatter={(value) => (
                  <span style={{ fontSize: 12 }}>{value}</span>
                )}
              />
              <Bar
                yAxisId="left"
                dataKey="total_rollouts"
                name="Total Rollouts"
                fill={colors.red}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="success_rate"
                name="Success %"
                fill={colors.blue}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default EnvironmentStatsChart
