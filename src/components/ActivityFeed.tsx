import React, { useState } from 'react'
import { fetchActivity, type ActivityRow } from '../services/api'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Skeleton, SkeletonText } from './Skeleton'
import Card from './Card'
import Button from './Button'

type Theme = 'light' | 'dark'

interface ActivityFeedProps {
  theme: Theme
  limit?: number
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ theme, limit = 10 }) => {
  const {
    data,
    error: queryError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['activity', limit],
    queryFn: fetchActivity,
    staleTime: 60000, // show cached activity on revisit; no immediate remount refetch
    refetchOnMount: false,
    refetchInterval: 1000, // auto-refresh every second seamlessly
  })
  const rows: ActivityRow[] = Array.isArray(data) ? data.slice(0, limit) : []
  const [manualRefreshing, setManualRefreshing] = useState(false)

  const refreshButton = (
    <Button
      onClick={async () => {
        setManualRefreshing(true)
        try {
          await refetch()
        } finally {
          setManualRefreshing(false)
        }
      }}
      disabled={manualRefreshing}
      theme={theme}
      aria-label="Refresh activity feed"
      title="Refresh activity feed"
    >
      <RefreshCw size={14} className={manualRefreshing ? 'animate-spin' : ''} />
      {manualRefreshing ? 'Refreshing' : 'Refresh'}
    </Button>
  )

  return (
    <Card
      title="ACTIVITY FEED (Live)"
      subtitle="Latest rollouts across environments"
      theme={theme}
      headerActions={refreshButton}
      className="mb-6"
    >
      {isLoading && (
        <div className="divide-y divide-gray-300">
          {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
            <div
              key={i}
              className="py-3 grid grid-cols-12 gap-2 items-center text-light-500 dark:text-gray-200"
            >
              <div className="col-span-3">
                <SkeletonText theme={theme} className="h-3 w-24 mb-1" />
                <SkeletonText theme={theme} className="h-2 w-16" />
              </div>
              <div className="col-span-3">
                <SkeletonText theme={theme} className="h-3 w-28 mb-1" />
                <SkeletonText theme={theme} className="h-2 w-24" />
              </div>
              <div className="col-span-2">
                <SkeletonText theme={theme} className="h-3 w-16" />
              </div>
              <div className="col-span-2 text-right">
                <SkeletonText theme={theme} className="h-3 w-12 ml-auto mb-1" />
                <SkeletonText theme={theme} className="h-2 w-10 ml-auto" />
              </div>
              <div className="col-span-2 text-right">
                <Skeleton
                  theme={theme}
                  className="h-2 w-2 rounded-full ml-auto"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {queryError && (
        <div className="text-sm font-sans text-red-600 dark:text-red-400">
          {queryError instanceof Error
            ? queryError.message
            : String(queryError)}
        </div>
      )}

      {!isLoading && !queryError && rows.length === 0 && (
        <div className="text-sm font-sans text-gray-600 dark:text-gray-300">
          No recent activity available.
        </div>
      )}

      {!isLoading && !queryError && rows.length > 0 && (
        <div className="divide-y divide-light-200 dark:divide-dark-200">
          {rows.map((r, idx) => {
            const ts = new Date(r.ingested_at)
            return (
              <div
                key={`${r.uid}-${r.hotkey}-${idx}`}
                className="py-3 grid grid-cols-12 gap-2 items-center text-light-500 dark:text-dark-500"
              >
                <div className="col-span-3">
                  <div className="text-xs font-sans">{ts.toLocaleString()}</div>
                  <div className="text-[10px] font-sans text-light-400 dark:text-dark-400">
                    UID: {r.uid}
                  </div>
                </div>
                <div className="col-span-4 break-all">
                  <div className="text-xs font-sans">{r.hotkey}</div>
                  <div className="text-[10px] font-sans text-light-400 dark:text-dark-400">
                    {r.model}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-center text-xs font-sans uppercase tracking-wider">
                    {r.env_name}
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-xs font-sans">{r.score.toFixed(3)}</div>
                  <div
                    className={`text-[10px] font-sans ${
                      r.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {r.success ? 'success' : 'fail'}
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      r.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default ActivityFeed
