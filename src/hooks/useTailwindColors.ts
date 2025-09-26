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
      red: getComputedColor('text-dark-highlight'),
      blue: getComputedColor('text-light-highlight'),
      purple: getComputedColor('text-chart-purple'),
      teal: getComputedColor('text-chart-teal'),
      orange: getComputedColor('text-chart-orange'),
      green: getComputedColor('text-chart-green'),

      // Theme colors
      primary:
        theme === 'dark'
          ? getComputedColor('text-dark-400')
          : getComputedColor('text-light-400'),
      secondary:
        theme === 'dark'
          ? getComputedColor('text-dark-400')
          : getComputedColor('text-light-400'),
      bg:
        theme === 'dark'
          ? getComputedColor('text-dark-75')
          : getComputedColor('text-light-75'),
      lines:
        theme === 'dark'
          ? getComputedColor('text-dark-300')
          : getComputedColor('text-light-300'),
    }

    setColors(resolvedColors)
  }, [theme])

  return colors
}
