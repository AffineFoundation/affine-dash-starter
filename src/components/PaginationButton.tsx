import React from 'react'

interface PaginationButtonProps {
  onClick: () => void
  disabled?: boolean
  theme: 'light' | 'dark'
  title: string
  children: React.ReactNode
}

const PaginationButton: React.FC<PaginationButtonProps> = ({
  onClick,
  disabled = false,
  theme,
  title,
  children
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="transition-colors duration-300 inline-flex items-center justify-center h-8 w-8 text-xs font-sans rounded-md disabled:opacity-50 border-gray-400 hover:bg-gray-100 dark:text-dark-500 dark:hover:text-dark-highlight dark:hover:bg-dark-200"
      title={title}
    >
      {children}
    </button>
  )
}

export default PaginationButton