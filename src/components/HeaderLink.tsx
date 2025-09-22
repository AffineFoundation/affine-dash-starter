import React from 'react'
import { LucideIcon } from 'lucide-react'

interface HeaderLinkProps {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}

const HeaderLink: React.FC<HeaderLinkProps> = ({ href, icon: Icon, children }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border rounded-md flex items-center gap-2 px-3 py-2 font-sans text-xs uppercase tracking-wider transition-colors duration-500 text-gray-700 hover:bg-gray-900 hover:text-white dark:bg-dark-200 dark:border-dark-300 dark:text-dark-500 dark:hover:border-dark-350"
    >
      <Icon size={12} />
      {children}
    </a>
  )
}

export default HeaderLink