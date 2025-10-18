import React from 'react'
import { Code2, Moon, Sun, ExternalLink } from 'lucide-react'
import HeaderLink from './HeaderLink'

interface HeaderProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="h-20">
      {/* <header className="z-40 fixed top-0 left-0 right-0 h-20 bg-light-100 dark:bg-dark-100 shadow-lg"> */}
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex gap-4 items-start">
          <img src="/logo.svg" alt="Logo" />

          <h1 className="text-xs w-80 font-sans mb-1 text-black/30 dark:text-dark-500 uppercase">
            <span className="font-bold text-black">AFFINE</span> — a
            decentralized ML network on Bittensor where subnets converge, models
            are trained, and contributors earn TAO.
          </h1>
          {/* <h1 className="text-2xl font-sans font-bold mb-1 text-light-500 dark:text-dark-500">
            AFFINE DASHBOARD
          </h1> */}

          {/* <p className="text-sm font-sans text-light-400 dark:text-dark-400">
            Real-time monitoring and performance metrics for Affine RL
            environments
          </p> */}
        </div>

        <nav className="flex items-center gap-6">
          <ul className="flex items-center gap-4 text-xs text-black">
            <li className="uppercase">Chat</li>
            <li className="uppercase">Research</li>
            <li className="uppercase text-gray-500">Dashboard</li>
          </ul>

          {/* <div className="flex items-center gap-4">
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
          </div> */}

          <button
            onClick={toggleTheme}
            className="rounded-full p-3 transition-colors duration-500 text-light-500 hover:bg-light-200 hover:text-light-highlight dark:text-dark-500 dark:hover:bg-dark-300 dark:hover:text-dark-highlight"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
