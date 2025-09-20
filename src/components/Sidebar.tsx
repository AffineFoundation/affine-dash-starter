import React from 'react'
import { NavLink } from 'react-router-dom'
import { useEnvironments } from '../contexts/EnvironmentsContext'

export default function Sidebar() {
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments()

  const sidebarItemClass = (active: boolean) => {
    const base =
      'rounded-md w-full px-4 py-3 font-sans text-sm transition-colors text-left'
    if (active) {
      return `${base} bg-white text-gray-900 border-gray-200 dark:bg-dark-100 dark:text-white dark:border-dark-300`
    }
    return `${base} text-gray-600 border-gray-200 hover:bg-slate-100 hover:text-gray-800 dark:text-gray-300 dark:border-dark-300 dark:hover:bg-dark-100 dark:hover:text-white`
  }

  return (
    <aside className="pl-5 fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] overflow-y-auto">
      <nav className="mt-8 flex flex-col">
        <NavLink
          to="/"
          end
          className={({ isActive }) => sidebarItemClass(isActive)}
          title="Press N then 0 to switch to Overview"
        >
          <div className="flex items-center justify-between">
            <span>Overview</span>
            <span className="text-xs opacity-60">N+0</span>
          </div>
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
              <div className="flex items-center justify-between">
                <span className="truncate">{env}</span>
                <span className="text-xs opacity-60">N+{i + 1}</span>
              </div>
            </NavLink>
          ))}
      </nav>
    </aside>
  )
}
