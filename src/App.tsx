import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import OverviewTable from './components/OverviewTable'
import ActivityFeed from './components/ActivityFeed'
import { ParallaxLightBeams } from './components/ParallaxLightBeams'
import { ParallaxNoise } from './components/ParallaxNoise'
import { useTheme } from './hooks/useTheme'
import { useEnvironments } from './contexts/EnvironmentsContext'
import EnvironmentPage from './pages/EnvironmentPage'
import ModelsTable from './components/ModelsTable'

// Lazy-load heavier components for better initial page load
const NetworkActivityChart = React.lazy(
  () => import('./components/NetworkActivityChart'),
)
const EnvironmentStatsChart = React.lazy(
  () => import('./components/EnvironmentStatsChart'),
)
const MinerEfficiencyChart = React.lazy(
  () => import('./components/MinerEfficiencyChart'),
)
const GpuMarketShareDonut = React.lazy(
  () => import('./components/GpuMarketShareDonut'),
)
const CostPerformanceScatter = React.lazy(
  () => import('./components/CostPerformanceScatter'),
)

function App() {
  const { theme, toggleTheme } = useTheme()
  const {
    environments,
    loading: envLoading,
    error: envError,
  } = useEnvironments()
  const navigate = useNavigate()

  // State for responsive tab management
  const [maxVisible, setMaxVisible] = React.useState<number>(6)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const moreRef = React.useRef<HTMLDivElement | null>(null)

  // Effect to adjust visible tabs based on window width
  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 480) setMaxVisible(2)
      else if (w < 640) setMaxVisible(3)
      else if (w < 768) setMaxVisible(4)
      else if (w < 1024) setMaxVisible(5)
      else if (w < 1280) setMaxVisible(6)
      else setMaxVisible(8)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Effect to close the "More" dropdown when clicking outside
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Refs for keyboard navigation shortcut (press 'n' then digits)
  const captureRef = React.useRef(false)
  const bufferRef = React.useRef<string>('')
  const timeoutRef = React.useRef<number | null>(null)

  // Effect for keyboard navigation shortcut
  React.useEffect(() => {
    const clearTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const commit = () => {
      const buf = bufferRef.current
      captureRef.current = false
      bufferRef.current = ''
      clearTimer()
      if (!buf) return
      const idx = parseInt(buf, 10)
      if (Number.isNaN(idx)) return
      if (idx === 0) {
        navigate('/')
        return
      }
      const targetIndex = idx - 1
      if (targetIndex >= 0 && targetIndex < environments.length) {
        const envName = environments[targetIndex]
        navigate(`/environment/${encodeURIComponent(envName)}`)
      }
    }

    const shouldIgnore = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return true
      const target = e.target as HTMLElement | null
      if (!target) return false
      const tag = target.tagName
      const editable = (target as HTMLElement).isContentEditable
      return (
        editable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (tag === 'DIV' && target.getAttribute('role') === 'textbox')
      )
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnore(e)) return

      if (!captureRef.current) {
        if (e.key.toLowerCase() === 'n') {
          captureRef.current = true
          bufferRef.current = ''
          clearTimer()
          e.preventDefault()
        }
        return
      }

      if (/^\d$/.test(e.key)) {
        bufferRef.current += e.key
        e.preventDefault()

        if (bufferRef.current.length >= 3) {
          commit()
          return
        }
        clearTimer()
        timeoutRef.current = window.setTimeout(commit, 600)
      } else {
        if (bufferRef.current) {
          commit()
        } else {
          captureRef.current = false
          bufferRef.current = ''
          clearTimer()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimer()
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [environments, navigate])

  return (
    <div className="min-h-screen transition-colors duration-300 bg-light-sand text-light-smoke relative overflow-hidden">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Hero />

      {/* Main Content */}
      <main className="mt-16 px-6 py-8 w-full">
        {/* Content */}
        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-6">
                <OverviewTable theme={theme} />

                <React.Suspense
                  fallback={
                    <div className="space-y-6">
                      <div className="h-64 border-2 rounded-none flex items-center justify-center">
                        <span className="text-xs font-sans">
                          Loading charts…
                        </span>
                      </div>
                      <div className="h-64 border-2 rounded-none flex items-center justify-center">
                        <span className="text-xs font-sans">
                          Loading charts…
                        </span>
                      </div>
                      <div className="h-64 border-2 rounded-none flex items-center justify-center">
                        <span className="text-xs font-sans">
                          Loading charts…
                        </span>
                      </div>
                    </div>
                  }
                >
                  <div className="columns-2 gap-4 space-y-4">
                    <div className="break-inside-avoid">
                      <NetworkActivityChart theme={theme} />
                    </div>
                    <div className="break-inside-avoid">
                      <EnvironmentStatsChart theme={theme} />
                    </div>
                    <div className="break-inside-avoid">
                      <MinerEfficiencyChart theme={theme} />
                    </div>
                    <div className="break-inside-avoid">
                      <GpuMarketShareDonut theme={theme} />
                    </div>
                    <div className="break-inside-avoid">
                      <CostPerformanceScatter theme={theme} />
                    </div>
                  </div>
                </React.Suspense>
              </div>
            }
          />
          <Route
            path="/environment/:envName"
            element={<EnvironmentPage theme={theme} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
