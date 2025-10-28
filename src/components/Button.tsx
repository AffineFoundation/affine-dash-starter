import React from 'react'

interface ButtonProps {
  onClick: () => void
  theme: 'light' | 'dark'
  children: React.ReactNode
  disabled?: boolean
  className?: string
  'aria-label'?: string
  title?: string
  variant?: 'default' | 'secondary'
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  theme,
  children,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  title,
  variant = 'default',
}) => {
  const baseClasses =
    'rounded-md flex items-center gap-2 px-3 h-9 font-sans text-xs uppercase tracking-wider transition-colors duration-500 disabled:opacity-60'

  const variantClasses = {
    default:
      'bg-light-75 text-light-500 hover:bg-light-50 dark:bg-dark-200 dark:text-dark-500 dark:hover:bg-dark-300',
    secondary:
      'bg-[#e9ebed] text-[#758691] hover:bg-opacity-80 dark:bg-[#e9ebed] dark:text-[#758691] dark:hover:bg-opacity-80',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  )
}

export default Button
