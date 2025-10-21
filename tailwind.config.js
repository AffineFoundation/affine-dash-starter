/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          50: '#F7F9FC',
          75: '#EDF2F7',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          350: '#64748B',
          400: '#475569',
          500: '#334155',
          highlight: '#6366F1',
          // NEW DESIGN COLORS:
          sand: '#F5F5F5',
          smoke: '#0D0C10',
          iron: '#DEE2E4',
          slate: '#77858E',
        },
        // dark: {
        //   50: '#080A05',
        //   75: '#14161D',
        //   100: '#171925',
        //   200: '#1D1F32',
        //   300: '#23253F',
        //   350: '#2F3057',
        //   400: '#75719C',
        //   500: '#C3C6E2',
        //   highlight: '#E66669',
        // },
        chart: {
          purple: '#92439E',
          teal: '#1B9AAA',
          orange: '#C87924',
          green: '#336D57',
        },
      },
      fontFamily: {
        sans: ['PP Neue Montreal', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
