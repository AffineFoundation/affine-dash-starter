import { NavLink } from 'react-router-dom'
import { useEnvironments } from '../contexts/EnvironmentsContext'

export default function Hero() {
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments()

  const sidebarItemClass = (active: boolean) => {
    const base =
      'rounded-full px-6 py-3 text-sm transition-colors duration-500 uppercase font-medium tracking-wide'
    if (active) {
      return `${base} bg-black text-white`
    }
    return `${base} text-light-smoke`
  }

  return (
    <div className="px-5 flex justify-between items-center">
      <div className="flex items-start gap-3">
        <h1 className="uppercase text-7xl leading-none">Dashboard</h1>

        <div className="flex items-center gap-1 border border-red-500 text-red-500 py-[2px] px-1 rounded-[4px] font-mono uppercase tracking-wide text-xs">
          <div className="rounded-full bg-red-500 size-1" />

          <span className="leading-none">Live</span>
        </div>
      </div>

      <nav className="flex gap-2 bg-white p-[10px] rounded-full border border-black/6">
        <NavLink
          to="/"
          end
          className={({ isActive }) => sidebarItemClass(isActive)}
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
              className={({ isActive }) => sidebarItemClass(isActive)}
              title={`Press N then ${i + 1} to switch to ${env}`}
            >
              {env}
            </NavLink>
          ))}

        <NavLink
          to=""
          className="rounded-full px-6 py-3 text-sm transition-colors duration-500 uppercase font-medium tracking-wide text-light-smoke bg-light-sand"
          title=""
        >
          See more (4)
        </NavLink>
      </nav>
    </div>
  )
}
