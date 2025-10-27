import { NavLink } from 'react-router-dom'
import { useEnvironments } from '../contexts/EnvironmentsContext'
import RedIndicator from './RedIndicator'
import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Hero() {
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments()
  const [visibleCount, setVisibleCount] = useState(environments.length)
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!navRef.current) return

      const navWidth = navRef.current.offsetWidth
      const children = Array.from(
        navRef.current.querySelectorAll('.nav-item'),
      ) as HTMLElement[]
      let totalWidth = 0
      let count = 0

      // Account for the "See More" button width
      const seeMoreButtonWidth = 150

      for (const item of children) {
        totalWidth += item.offsetWidth + 8 // 8 is for gap-2
        if (totalWidth < navWidth - seeMoreButtonWidth) {
          count++
        } else {
          break
        }
      }
      setVisibleCount(count)
    }

    // Use a timeout to ensure the DOM is updated before calculating
    const timer = setTimeout(calculateVisibleItems, 100)
    window.addEventListener('resize', calculateVisibleItems)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', calculateVisibleItems)
    }
  }, [environments])

  const sidebarItemClass = (active: boolean) => {
    const base =
      'rounded-full px-6 py-3 text-sm transition-colors duration-500 uppercase font-medium tracking-wide leading-[80%]'
    if (active) {
      return `${base} bg-black text-white`
    }
    return `${base} text-light-smoke`
  }

  const visibleItems = environments.slice(0, visibleCount - 1)
  const hiddenItems = environments.slice(visibleCount - 1)

  return (
    <div className="px-5 flex justify-between items-center">
      <div className="flex items-start gap-3">
        <h1 className="uppercase text-7xl leading-[80%]">Dashboard</h1>

        <RedIndicator text="Live" live />
      </div>

      <nav
        ref={navRef}
        className="flex items-center gap-2 bg-white p-[10px] rounded-full border border-black/6"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${sidebarItemClass(isActive)} nav-item`
          }
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
          visibleItems.map((env, i) => (
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

        {hiddenItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 rounded-full px-6 py-3 text-sm transition-colors duration-500 uppercase font-medium tracking-wide leading-[80%] text-light-smoke bg-light-sand"
            >
              See more ({hiddenItems.length}) <ChevronDown size={16} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-light-100 dark:bg-dark-100 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                {hiddenItems.map(env => (
                  <NavLink
                    key={env}
                    to={`/environment/${encodeURIComponent(env)}`}
                    className="block px-4 py-2 text-sm text-light-500 hover:bg-light-200 dark:text-dark-300 dark:hover:bg-dark-200"
                    onClick={() => setDropdownOpen(false)}
                  >
                    {env.replace(/.*:/, '')}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  )
}
