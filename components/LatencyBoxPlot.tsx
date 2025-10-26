'use client';

import React, { useMemo } from 'react'
import type { LatencyDistributionByEnvRow } from '@/lib/types'
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
  ErrorBar,
} from 'recharts'
import Card from './Card'
import { useTailwindColors } from '../hooks/useTailwindColors'

interface Props {
  env: string; // e.g., 'SAT'
  theme: 'light' | 'dark';
  data: LatencyDistributionByEnvRow[];
  errorMessage?: string | null;
}

type StatRow = {
  hotkey: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  eRange: [number, number] // distances from median -> [median - min, max - median]
  eIQR: [number, number] // distances from median -> [median - q1, q3 - median]
}

function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return NaN
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

const truncHotkey = (s: string, max = 14) =>
  s.length <= max ? s : `${s.slice(0, 6)}…${s.slice(-7)}`

const LatencyBoxPlot: React.FC<Props> = ({ env, theme, data, errorMessage }) => {
  const colors = useTailwindColors(theme)

  const stats: StatRow[] = useMemo(() => {
    const rows = Array.isArray(data) ? data : []
    const byHotkey = new Map<string, number[]>()

    for (const r of rows) {
      if (r.latency_seconds == null) continue
      const arr = byHotkey.get(r.hotkey) ?? []
      arr.push(r.latency_seconds)
      byHotkey.set(r.hotkey, arr)
    }

    const out: StatRow[] = []
    for (const [hotkey, arr] of byHotkey.entries()) {
      if (arr.length === 0) continue
      const sorted = arr.slice().sort((a, b) => a - b)
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      const q1 = quantile(sorted, 0.25)
      const median = quantile(sorted, 0.5)
      const q3 = quantile(sorted, 0.75)
      out.push({
        hotkey,
        min,
        q1,
        median,
        q3,
        max,
        eRange: [median - min, max - median],
        eIQR: [median - q1, q3 - median],
      })
    }
    // Sort by median ascending for consistent layout
    out.sort((a, b) => a.median - b.median)
    return out
  }, [data])

  return (
    <Card
      title={`Latency Distribution (Top Miners) — ${env}`}
      theme={theme}
      className="overflow-hidden"
    >
      {errorMessage && (
        <div className="text-red-600 dark:text-red-400">{errorMessage}</div>
      )}
      {!errorMessage && stats.length === 0 && (
        <div style={{ width: '100%', height: 400 }}>
          <div className="h-full w-full animate-pulse bg-light-200 dark:bg-dark-200" />
        </div>
      )}

      {!errorMessage && stats.length > 0 && (
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={stats}
              margin={{ top: 12, right: 56, left: 56, bottom: 56 }}
            >
              <CartesianGrid strokeDasharray="none" stroke={colors.lines} />
              <XAxis
                dataKey="hotkey"
                stroke={colors.primary}
                tickMargin={8}
                interval={0}
                height={80}
                angle={-30}
                textAnchor="end"
                tickFormatter={truncHotkey}
              />
              <YAxis
                stroke={colors.primary}
                tickMargin={8}
                label={{
                  value: 'Latency (s)',
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
                formatter={(value: any, name: any, props: any) => {
                  if (name === 'Median')
                    return [Number(value).toFixed(3) + ' s', name]
                  return [value, name]
                }}
                labelFormatter={(label, payload: any) => {
                  const p =
                    Array.isArray(payload) && payload.length > 0
                      ? (payload[0].payload as StatRow)
                      : undefined
                  if (!p) return String(label)
                  return `${p.hotkey}
min=${p.min.toFixed(3)}s  q1=${p.q1.toFixed(3)}s  median=${p.median.toFixed(
                    3,
                  )}s  q3=${p.q3.toFixed(3)}s  max=${p.max.toFixed(3)}s`
                }}
              />
              <Legend
                iconSize={12}
                wrapperStyle={{ bottom: 0 }}
                formatter={(value) => (
                  <span style={{ fontSize: 12 }}>{value}</span>
                )}
              />
              {/* Scatter anchored at median; two ErrorBars for IQR and range to emulate box+whiskers */}
              <Scatter
                name="Median"
                data={stats}
                dataKey="median"
                fill={theme === 'dark' ? '#34d399' : '#16a34a'}
                shape="circle"
              >
                {/* Thicker bar to represent IQR (q1..q3) */}
                <ErrorBar
                  dataKey="eIQR"
                  width={20}
                  direction="y"
                  stroke={theme === 'dark' ? '#60a5fa' : '#3b82f6'}
                />
                {/* Thinner bar to represent full range (min..max) */}
                <ErrorBar
                  dataKey="eRange"
                  width={8}
                  direction="y"
                  stroke={theme === 'dark' ? '#ddd' : '#333'}
                />
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default LatencyBoxPlot
