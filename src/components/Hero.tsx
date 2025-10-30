import { NavLink } from 'react-router-dom'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import React, { useMemo } from 'react'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import { Skeleton } from './Skeleton'

const StyledNA = () => <span className="text-light-iron uppercase">N/A</span>

export default function Hero() {
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments()
  const { data: liveSummary, loading: isLiveLoading } = useValidatorSummary()

  const liveRows = useMemo(() => {
    if (!liveSummary) return []
    const cols = liveSummary.columns || []
    const idx = (name: string) => cols.indexOf(name)
    const iElig = idx('Elig')
    return liveSummary.rows.map((row) => ({
      eligible: String(row[iElig]).trim().toUpperCase().startsWith('Y'),
    }))
  }, [liveSummary])

  const sidebarItemClass = (active: boolean) => {
    const base =
      'rounded-full px-4 py-2 text-xs transition-colors duration-500 uppercase font-medium tracking-wide leading-[80%]'
    if (active) {
      return `${base} bg-black text-white`
    }
    return `${base} text-light-smoke`
  }

  return (
    <div className="px-3 md:px-5 md:flex md:justify-between md:items-end">
      <div className="grid grid-cols-3 gap-[10px] w-full md:w-2/5">
        <div className="text-light-smoke bg-white rounded-[4px] p-4">
          <div className="text-xs font-mono uppercase tracking-wide leading-[80%]">
            Models
          </div>

          <div className="mt-2 flex justify-between items-end">
            <div className="text-3xl leading-[80%]">
              {isLiveLoading ? (
                <Skeleton theme={'light'} className="h-4 w-8" />
              ) : liveRows.length === 0 ? (
                <StyledNA />
              ) : (
                liveRows.length
              )}
            </div>

            <div className="size-3 bg-light-iron [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
          </div>
        </div>

        <div className="text-light-smoke bg-white rounded-[4px] p-4">
          <div className="text-xs font-mono uppercase tracking-wide leading-[80%]">
            Eligible
          </div>

          <div className="mt-2 flex justify-between items-end">
            <div className="text-3xl leading-[80%]">
              {isLiveLoading ? (
                <Skeleton theme={'light'} className="h-4 w-8" />
              ) : liveRows.filter((r) => r.eligible).length === 0 ? (
                <StyledNA />
              ) : (
                liveRows.filter((r) => r.eligible).length
              )}
            </div>

            <div className="size-3 bg-light-iron [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
          </div>
        </div>

        <div className="text-light-smoke bg-white rounded-[4px] p-4">
          <div className="text-xs font-mono uppercase tracking-wide leading-[80%]">
            Environments
          </div>

          <div className="mt-2 flex justify-between items-end">
            <div className="text-3xl leading-[80%]">
              {envLoading ? (
                <Skeleton theme={'light'} className="h-4 w-8" />
              ) : environments.length === 0 ? (
                <StyledNA />
              ) : (
                environments.length
              )}
            </div>

            <div className="size-3 bg-light-iron [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
          </div>
        </div>
      </div>

      <nav className="flex items-center flex-wrap gap-1 bg-white p-[10px] rounded-full border border-black/6 mt-10 md:mt-0">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `${sidebarItemClass(isActive)} nav-item`}
          title="Press N then 0 to switch to Overview"
        >
          Overview
        </NavLink>

        {envLoading && <div className={sidebarItemClass(false)}>Loading…</div>}

        {!envLoading && envError && (
          <div className={sidebarItemClass(false)}>Error</div>
        )}

        {!envLoading &&
          !envError &&
          environments.map((env, i) => (
            <NavLink
              key={env}
              to={`/environment/${encodeURIComponent(env)}`}
              className={({ isActive }) =>
                `${sidebarItemClass(isActive)} nav-item`
              }
              title={`Press N then ${i + 1} to switch to ${env}`}
            >
              {env.replace(/.*:/, '')}
            </NavLink>
          ))}
      </nav>
    </div>
  )
}
