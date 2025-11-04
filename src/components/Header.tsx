import React from 'react'
import { Code2, Moon, Sun, ExternalLink } from 'lucide-react'
import HeaderLink from './HeaderLink'
import RedIndicator from './RedIndicator'

interface HeaderProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const Header: React.FC<HeaderProps> = ({}) => {
  return (
    <header className="md:h-20 mx-auto p-3 md:p-5 mb-11 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        <img src="/logo.svg" alt="Logo" />

        <div className="flex items-center gap-2 md:hidden">
          <h1 className="text-xs font-medium text-black uppercase leading-none tracking-wide">
            AFFINE
          </h1>
          <RedIndicator text="Live" live />
        </div>

        {/* DESKTOP */}
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-xs font-medium text-black uppercase leading-none tracking-wide">
            AFFINE
            <span className="text-black/30"> — Reasoning Commodification</span>
          </h1>
          <RedIndicator text="Live" live />
        </div>
      </div>

      {/* <nav className="flex items-center gap-8 text-xs font-medium text-black uppercase tracking-wide leading-[80%]">
        <a href="" className="text-light-slate relative">
          Dashboard
          <div className="size-2 absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black rounded-full" />
        </a>
        <div className="flex items-center gap-4">
          <HeaderLink
            href="https://taostats.io/subnets/120/metagraph"
            icon={ExternalLink}
          >
            METAGRAPH
          </HeaderLink>
          <HeaderLink
            href="https://github.com/AffineFoundation/affine"
            icon={Code2}
          >
            CODE
          </HeaderLink>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-full p-3 transition-colors duration-500 text-light-500 hover:bg-light-200 hover:text-light-highlight dark:text-dark-500 dark:hover:bg-dark-300 dark:hover:text-dark-highlight"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav> */}
    </header>
  )
}

export default Header
