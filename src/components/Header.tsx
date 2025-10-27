import React from 'react'
import { Code2, Moon, Sun, ExternalLink } from 'lucide-react'
import HeaderLink from './HeaderLink'

interface HeaderProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="h-20 mx-auto p-5 mb-11 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src="/logo.svg" alt="Logo" />

        <h1 className="text-xs font-medium w-80 text-black/30 uppercase leading-none tracking-wide">
          <span className="text-black">AFFINE</span> — a decentralized RL
          network on Bittensor where subnets converge, models are trained, and
          contributors earn TAO.
        </h1>
      </div>

      <nav className="flex items-center gap-8 text-xs font-medium text-black uppercase tracking-wide leading-[80%]">
        <a href="">Chat</a>

        <a href="">Research</a>

        {/* Active simulation */}
        <a href="" className="text-light-slate relative">
          Dashboard
          <div className="size-2 absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black rounded-full" />
        </a>

        {/* DO WE STILL NEED THIS BELOW? */}

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

        {/* -------------------------------- */}

        {/* WILL WE IMPLEMENT THIS CHANGE THEME BUTTON? */}

        {/* <button
            onClick={toggleTheme}
            className="rounded-full p-3 transition-colors duration-500 text-light-500 hover:bg-light-200 hover:text-light-highlight dark:text-dark-500 dark:hover:bg-dark-300 dark:hover:text-dark-highlight"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button> */}
      </nav>
    </header>
  )
}

export default Header
