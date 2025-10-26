'use client';

import React from 'react'

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
  theme: 'light' | 'dark'
  children: React.ReactNode
  position?: 'left' | 'middle' | 'right'
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  active,
  onClick,
  theme,
  children,
  position = 'middle',
}) => {
  const roundedClass =
    position === 'left'
      ? 'rounded-l-md'
      : position === 'right'
      ? 'rounded-r-md'
      : 'rounded-sm'

  return (
    <button
      onClick={onClick}
      className={`transition-colors duration-500 h-8 px-3 text-xs font-sans ${roundedClass} ${
        active
          ? 'bg-light-50 text-light-highlight dark:bg-dark-200 dark:text-dark-highlight'
          : 'bg-light-200 text-light-500 hover:bg-light-75 dark:bg-dark-75 dark:text-dark-500 dark:hover:bg-dark-300'
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

export default ToggleButton
