import React from 'react'
import { Code2, Moon, Sun, ExternalLink } from 'lucide-react'

interface HeaderProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="z-50 fixed top-0 left-0 right-0 h-20 bg-slate-100 dark:bg-dark-100">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-bold mb-1 text-gray-900 dark:text-dark-500">
            AFFINE DASHBOARD
          </h1>
          <p className="text-sm font-sans text-gray-600 dark:text-dark-400">
            Real-time monitoring and performance metrics for Affine RL
            environments
          </p>
        </div>

        <nav className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <a
              href="https://taostats.io/subnets/120/metagraph"
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-md flex items-center gap-2 px-3 py-2 font-sans text-xs uppercase tracking-wider transition-colors text-gray-700 hover:bg-gray-900 hover:text-white dark:bg-dark-200  dark:border-dark-300 dark:text-dark-500 dark:hover:bg-white dark:hover:text-black"
            >
              <ExternalLink size={12} />
              METAGRAPH
            </a>
            <a
              href="https://github.com/AffineFoundation/affine"
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-md flex items-center gap-2 px-3 py-2 font-sans text-xs uppercase tracking-wider transition-colors text-gray-700 hover:bg-gray-900 hover:text-white dark:bg-dark-200 dark:border-dark-300  dark:text-dark-500 dark:hover:bg-white dark:hover:text-black"
            >
              <Code2 size={12} />
              CODE
            </a>
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-full p-2 border transition-colors border-gray-400 text-gray-700 hover:bg-gray-100 dark:bg-dark-200 dark:border-dark-300 dark:text-dark-500 dark:hover:bg-dark-200"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
