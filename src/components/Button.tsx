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
      className={`rounded-md flex items-center gap-2 px-3 h-9 font-sans text-xs uppercase tracking-wider transition-colors duration-500 disabled:opacity-60 ${
        theme === 'dark'
          ? 'bg-dark-200 text-dark-500 hover:bg-dark-300'
          : 'bg-gray-400 text-gray-700 hover:bg-gray-100'
      } ${className}`}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  )
}

export default Button
