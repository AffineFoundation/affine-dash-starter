import { useEffect, useState } from 'react'

export const useTailwindColors = (theme: 'light' | 'dark') => {
  const [colors, setColors] = useState<Record<string, string>>({})

  useEffect(() => {
    const getComputedColor = (className: string) => {
      const element = document.createElement('div')
      element.className = className
      element.style.display = 'none'
      document.body.appendChild(element)
      const color = getComputedStyle(element).color
      document.body.removeChild(element)
      return color
    }

    const resolvedColors = {
      // Chart colors
      purple: getComputedColor('text-chart-purple'),
      red: getComputedColor('text-chart-red'),
      teal: getComputedColor('text-chart-teal'),
      orange: getComputedColor('text-chart-orange'),
      green: getComputedColor('text-chart-green'),
      blue: getComputedColor('text-chart-blue'),

      // Text colors
      primary:
        theme === 'dark'
          ? getComputedColor('text-dark-500')
          : getComputedColor('text-light-500'),
      secondary:
        theme === 'dark'
          ? getComputedColor('text-dark-400')
          : getComputedColor('text-light-400'),

      // Background colors
      bg:
        theme === 'dark'
          ? getComputedColor('text-dark-75')
          : getComputedColor('text-light-75'),
    }

    setColors(resolvedColors)
  }, [theme])

  return colors
}
