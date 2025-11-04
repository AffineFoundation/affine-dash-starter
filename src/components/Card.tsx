import React from 'react'

interface CardProps {
  title?: React.ReactNode
  subtitle?: string
  theme: 'light' | 'dark'
  children: React.ReactNode
  headerActions?: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  theme,
  children,
  headerActions,
  className = '',
}) => {
  return (
    <div className={`rounded-md bg-white dark:bg-dark-100 ${className}`}>
      {title && (
        <div className="p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-sans font-medium uppercase">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1 text-xs font-sans uppercase tracking-wider text-light-400 dark:text-dark-400">
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">{headerActions}</div>
            )}
          </div>
        </div>
      )}
      <div className="p-2 md:p-4">{children}</div>
    </div>
  )
}

export default Card
