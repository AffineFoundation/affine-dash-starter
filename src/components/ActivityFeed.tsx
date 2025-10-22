import React, { useState } from 'react'
import { fetchActivity, type ActivityRow } from '../services/api'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Skeleton, SkeletonText } from './Skeleton'
import Button from './Button'
import RedIndicator from './RedIndicator'

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
    <button
      onClick={async () => {
        setManualRefreshing(true)
        try {
          await refetch()
        } finally {
          setManualRefreshing(false)
        }
      }}
      disabled={manualRefreshing}
      aria-label="Refresh activity feed"
      title="Refresh activity feed"
      className="flex items-center gap-2 text-light-smoke font-medium uppercase tracking-wide leading-none text-sm"
    >
      {manualRefreshing ? 'Refreshing' : 'Refresh'}
      <RefreshCw size={14} className={manualRefreshing ? 'animate-spin' : ''} />
    </button>
  )

  return (
    <aside className="pt-10 text-light-smoke divide-y divide-light-geyser">
      <header className="flex items-start justify-between pb-5">
        <div className="leading-none tracking-wide">
          <h3 className="text-xs  font-mono flex gap-3 items-center uppercase">
            Activity Feed
            <RedIndicator text="Live" live />
          </h3>

          <p className="mt-3 font-medium text-sm   text-light-slate ">
            Latest rollouts across environments
          </p>
        </div>

        <div className="flex items-center gap-2">{refreshButton}</div>
      </header>

      <div>
        {isLoading && (
          <div className="divide-y divide-light-geyser">
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
                  <SkeletonText
                    theme={theme}
                    className="h-3 w-12 ml-auto mb-1"
                  />
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
          <div className="text-sm font-sans text-light-400 dark:text-dark-400">
            No recent activity available.
          </div>
        )}

        {!isLoading && !queryError && rows.length > 0 && (
          <div className="divide-y divide-light-geyser">
            {rows.map((r, idx) => {
              const ts = new Date(r.ingested_at)
              return (
                <div
                  key={`${r.uid}-${r.hotkey}-${idx}`}
                  className="py-5 grid grid-cols-12 gap-2 items-start text-light-smoke"
                >
                  <div className="col-span-3">
                    <div className="text-sm leading-none tracking-wide font-mono">
                      {(() => {
                        const date = new Date(ts)
                        const day = date.getDate()
                        const month = date.getMonth() + 1
                        const year = date.getFullYear()
                        const hours = date
                          .getHours()
                          .toString()
                          .padStart(2, '0')
                        const minutes = date
                          .getMinutes()
                          .toString()
                          .padStart(2, '0')
                        const seconds = date
                          .getSeconds()
                          .toString()
                          .padStart(2, '0')

                        return (
                          <>
                            {`${month}.${day}.${year}`}
                            <br />
                            {`${hours}:${minutes}:${seconds}`}
                          </>
                        )
                      })()}
                    </div>

                    {/* STILL NEEDED? NOT ON NEW DESIGN */}

                    {/* <div className="text-[10px] font-sans text-light-400 dark:text-dark-400">
                      UID: {r.uid}
                    </div> */}

                    {/* ------------------ */}
                  </div>

                  <div className="col-span-4 break-all font-medium text-sm leading-none tracking-wide">
                    <div className="uppercase">{r.hotkey}</div>
                    <div className="text-light-slate mt-1">{r.model}</div>
                  </div>

                  <div className="col-span-2 font-medium text-sm leading-none tracking-wide">
                    <div className="uppercase">{r.env_name}</div>
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-1 font-medium text-sm leading-none tracking-wide">
                    <div
                      className={
                        r.success ? 'text-light-goblin' : 'text-light-scarlet'
                      }
                    >
                      {r.score.toFixed(3)}
                    </div>

                    <div
                      className={`size-2 rounded-full ${
                        r.success ? 'bg-light-goblin' : 'bg-light-scarlet'
                      }`}
                    />

                    {/* <div
                      className={`text-[10px] font-sans ${
                        r.success
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {r.success ? 'success' : 'fail'}
                    </div> */}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

export default ActivityFeed
