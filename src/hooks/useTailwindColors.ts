import { useEffect, useState } from 'react'

export const useTailwindColors = () => {
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
      primary: getComputedColor('text-light-500 dark:text-dark-500'),
      secondary: getComputedColor('text-light-400 dark:text-dark-400'),

      // Background colors
      bg: getComputedColor('bg-light-75 dark:bg-dark-75'),
    }

    setColors(resolvedColors)
  }, [])

  return colors
}
