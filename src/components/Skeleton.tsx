import React from 'react'

export type Theme = 'light' | 'dark'

type SkeletonProps = {
  theme: Theme
  className?: string
}

/**
 * Generic skeleton block. Use width/height via className.
 * Example: <Skeleton theme={theme} className="h-4 w-24" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  theme,
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse rounded-sm bg-gray-100 dark:bg-dark-400 ${className}`}
    />
  )
}

/**
 * Slightly lighter/darker variant for text-like skeletons.
 * Example: <SkeletonText theme={theme} className="h-3 w-16" />
 */
export const SkeletonText: React.FC<SkeletonProps> = ({
  theme,
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse rounded-sm bg-gray-200 dark:bg-dark-500 ${className}`}
    />
  )
}
