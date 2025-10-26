'use client';

import React from 'react'

interface ButtonProps {
  onClick: () => void
  theme: 'light' | 'dark'
  children: React.ReactNode
  disabled?: boolean
  className?: string
  'aria-label'?: string
  title?: string
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  theme,
  children,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  title,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md flex items-center gap-2 px-3 h-9 font-sans text-xs uppercase tracking-wider transition-colors duration-500 disabled:opacity-60 bg-light-75 text-light-500 hover:bg-light-50 dark:bg-dark-200 dark:text-dark-500 dark:hover:bg-dark-300 ${className}`}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  )
}

export default Button
