import React from 'react'
import { NavLink } from 'react-router-dom'
import { useEnvironments } from '../contexts/EnvironmentsContext'

interface SidebarProps {
  theme: 'light' | 'dark'
}

export default function Sidebar({ theme }: SidebarProps) {
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments()

  const sidebarItemClass = (active: boolean) => {
    const base = 'w-full px-4 py-3 font-sans text-sm transition-colors text-left border-b'
    if (active) {
      return `${base} ${
        theme === 'dark'
          ? 'bg-gray-800 text-white border-gray-700'
          : 'bg-white text-gray-900 border-gray-200'
      }`
    }
    return `${base} ${
      theme === 'dark'
        ? 'text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white'
        : 'text-gray-600 border-gray-200 hover:bg-slate-100 hover:text-gray-800'
    }`
  }

  return (
    <aside className={`fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] overflow-y-auto border-r-2 ${
      theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <nav className="flex flex-col">
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

        {envLoading && (
          <div className={sidebarItemClass(false)}>Loading…</div>
        )}
        {!envLoading && envError && (
          <div className={sidebarItemClass(false)}>Error</div>
        )}
        {!envLoading && !envError && environments.map((env, i) => (
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