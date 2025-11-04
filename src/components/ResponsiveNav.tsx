import { NavLink } from 'react-router-dom'
import React, { useRef, useEffect, useState } from 'react'

interface ResponsiveNavProps {
  environments: string[]
  envLoading: boolean
  envError: any
  sidebarItemClass: (active: boolean) => string
}

export default function ResponsiveNav({
  environments,
  envLoading,
  envError,
  sidebarItemClass,
}: ResponsiveNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const [visibleItems, setVisibleItems] = useState<number>(-1)
  const [showDropdown, setShowDropdown] = useState(false)

  const allItems = [
    {
      type: 'overview',
      to: '/',
      label: 'Overview',
      title: 'Press N then 0 to switch to Overview',
    },
    ...(envLoading ? [{ type: 'loading', label: 'Loading…' }] : []),
    ...(envError ? [{ type: 'error', label: 'Error' }] : []),
    ...(!envLoading && !envError
      ? environments.map((env, i) => ({
          type: 'env',
          to: `/environment/${encodeURIComponent(env)}`,
          label: env.replace(/.*:/, ''),
          title: `Press N then ${i + 1} to switch to ${env}`,
        }))
      : []),
  ]

  useEffect(() => {
    const checkOverflow = () => {
      if (!navRef.current) return

      const isMobile = window.innerWidth < 768

      if (isMobile) {
        // Mobile: show Overview + active item only
        const activeIndex = allItems.findIndex((item) => {
          if (item.type === 'overview') {
            return window.location.pathname === '/'
          }
          if (item.type === 'env') {
            return window.location.pathname === item.to
          }
          return false
        })

        if (activeIndex === 0 || activeIndex === -1) {
          // Overview is active or no match found
          setVisibleItems(1) // Show only Overview
        } else {
          // Show Overview + active item
          setVisibleItems(activeIndex + 1)
        }
        return
      }

      // Desktop: original overflow logic
      const nav = navRef.current
      const items = nav.querySelectorAll('.nav-item')
      const navWidth = nav.offsetWidth - 20
      let totalWidth = 0

      for (let i = 0; i < items.length; i++) {
        const item = items[i] as HTMLElement
        totalWidth += item.offsetWidth + (i > 0 ? 4 : 0)
      }

      if (totalWidth <= navWidth) {
        setVisibleItems(-1)
        return
      }

      const dropdownWidth = 44
      const availableWidth = navWidth - dropdownWidth - 8
      totalWidth = 0
      let visible = 0

      for (let i = 0; i < items.length; i++) {
        const item = items[i] as HTMLElement
        const itemWidth = item.offsetWidth + (i > 0 ? 4 : 0)
        if (totalWidth + itemWidth <= availableWidth) {
          totalWidth += itemWidth
          visible++
        } else {
          break
        }
      }

      setVisibleItems(visible)
    }

    const timer = setTimeout(checkOverflow, 0)
    window.addEventListener('resize', checkOverflow)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [allItems.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  let visibleNavItems, hiddenNavItems

  if (isMobile) {
    // Mobile: show "Environment" text + active item
    const activeItem = allItems.find((item) => {
      if (item.type === 'overview') return window.location.pathname === '/'
      if (item.type === 'env') return window.location.pathname === item.to
      return false
    })

    visibleNavItems = activeItem ? [activeItem] : [allItems[0]]
    hiddenNavItems = allItems.filter((item) => item !== activeItem)
  } else {
    // Desktop: original logic
    visibleNavItems =
      visibleItems === -1 ? allItems : allItems.slice(0, visibleItems)
    hiddenNavItems = visibleItems === -1 ? [] : allItems.slice(visibleItems)
  }

  return (
    <nav
      ref={navRef}
      className="relative flex items-center justify-between bg-white p-[10px] rounded-full border border-black/6 mt-10 md:mt-0 md:max-w-[50vw]"
    >
      <div className="flex items-center gap-1">
        {isMobile && (
          <span className="text-xs text-light-smoke uppercase font-medium tracking-wide px-2">
            Environment
          </span>
        )}
        {visibleNavItems.map((item, idx) => {
          if (item.type === 'loading' || item.type === 'error') {
            return (
              <div
                key={item.type}
                className={`${sidebarItemClass(false)} nav-item`}
              >
                {item.label}
              </div>
            )
          }
          return (
            <NavLink
              key={item.to || idx}
              to={item.to!}
              end={item.type === 'overview'}
              className={({ isActive }) =>
                `${sidebarItemClass(isActive)} nav-item`
              }
              title={item.title}
            >
              {item.label}
            </NavLink>
          )
        })}
      </div>

      {hiddenNavItems.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="dropdown-btn flex items-center gap-1 rounded-full  text-xs bg-light-haze text-light-smoke uppercase font-medium tracking-wide leading-[80%]"
          >
            <span className="hidden md:inline px-4 py-2 whitespace-nowrap">
              See More ({hiddenNavItems.length})
            </span>
            <svg
              className={`w-5 h-5 md:hidden transition-transform duration-500 ease-out ${
                showDropdown ? 'rotate-180' : ''
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-black/6 rounded-md shadow-sm py-1 z-10">
              {hiddenNavItems.map((item, idx) => {
                if (item.type === 'loading' || item.type === 'error') {
                  return (
                    <div
                      key={item.type}
                      className="px-3 py-2 text-xs text-light-smoke"
                    >
                      {item.label}
                    </div>
                  )
                }
                return (
                  <NavLink
                    key={item.to || idx}
                    to={item.to!}
                    end={item.type === 'overview'}
                    className={({ isActive }) =>
                      `block px-3 py-2 text-xs uppercase hover:bg-light-sand ${
                        isActive ? 'bg-black text-white' : 'text-light-smoke'
                      }`
                    }
                    title={item.title}
                    onClick={() => setShowDropdown(false)}
                  >
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
