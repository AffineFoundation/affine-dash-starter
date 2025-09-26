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
      'rounded-md w-full px-4 py-3 font-sans text-sm transition-colors duration-500 text-left'
    if (active) {
      return `${base} bg-light-100 text-light-highlight border-light-300 dark:bg-dark-100 dark:text-dark-highlight dark:border-dark-300`
    }
    return `${base} text-light-500 border-light-300 hover:bg-light-75  dark:text-dark-500 dark:border-dark-300 dark:hover:bg-dark-75`
  }

  const hotkeyClass =
    'flex justify-center w-7 px-2 py-1 rounded-md border border-light-300 bg-light-50 dark:border-dark-350 dark:bg-dark-300'

  return (
    <aside className="pl-5 fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] overflow-y-auto">
      <nav className="mt-8 flex flex-col gap-[1px]">
        <div className="w-[4.5rem] self-end text-xs text-center text-light-400 opacity-60 mr-4 mb-2 select-none dark:text-dark-400 ">
          Hotkeys
        </div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => sidebarItemClass(isActive)}
          title="Press N then 0 to switch to Overview"
        >
          <div className="flex items-center justify-between">
            <span>Overview</span>
            {/* <span className="text-xs opacity-60">N+0</span> */}
            <div className="w-[4.5rem] text-xs opacity-60 flex items-center justify-between">
              <span className={hotkeyClass}>N</span>+
              <span className={hotkeyClass}>0</span>
            </div>
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
                <div className="w-[4.5rem] text-xs opacity-60 flex items-center justify-between">
                  <span className={hotkeyClass}>N</span>+
                  <span className={hotkeyClass}>{i + 1}</span>
                </div>
              </div>
            </NavLink>
          ))}
      </nav>
    </aside>
  )
}
