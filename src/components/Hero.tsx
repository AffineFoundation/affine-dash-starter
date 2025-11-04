import { useEnvironments } from '../contexts/EnvironmentsContext'
import React, { useMemo } from 'react'
import { useValidatorSummary } from '../hooks/useValidatorSummary'
import { Skeleton } from './Skeleton'
import ResponsiveNav from './ResponsiveNav'

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
      'rounded-full px-4 py-2 text-xs transition-colors duration-500 ease-out uppercase font-medium tracking-wide leading-[80%]'
    if (active) {
      return `${base} bg-black text-white`
    }
    return `${base} text-light-smoke hover:bg-light-sand`
  }

  return (
    <div className="px-3 md:px-5 md:flex md:justify-between md:items-end mt-10 md:mt-20">
      <div className="grid grid-cols-3 gap-[10px] w-full md:w-2/5">
        <div className="text-light-smoke bg-white rounded-[4px] p-2 md:p-4 flex flex-col justify-between">
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

        <div className="text-light-smoke bg-white rounded-[4px] p-2 md:p-4 flex flex-col justify-between">
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

        <div className="text-light-smoke bg-white rounded-[4px] p-2 md:p-4 flex flex-col justify-between">
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

      <ResponsiveNav
        environments={environments}
        envLoading={envLoading}
        envError={envError}
        sidebarItemClass={sidebarItemClass}
      />
    </div>
  )
}
