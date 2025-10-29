import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import OverviewTable from './components/OverviewTable'
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
  const [activeSection, setActiveSection] = React.useState<string>('')
  const moreRef = React.useRef<HTMLDivElement | null>(null)

  // Refs for chart sections
  const networkActivityRef = React.useRef<HTMLDivElement | null>(null)
  const environmentStatsRef = React.useRef<HTMLDivElement | null>(null)
  const minerEfficiencyRef = React.useRef<HTMLDivElement | null>(null)
  const gpuMarketShareRef = React.useRef<HTMLDivElement | null>(null)
  const costPerformanceRef = React.useRef<HTMLDivElement | null>(null)

  // Intersection Observer to track active section
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target
            let newSection = ''
            if (target === networkActivityRef.current) newSection = 'network'
            else if (target === environmentStatsRef.current)
              newSection = 'environment'
            else if (target === minerEfficiencyRef.current)
              newSection = 'performance'
            else if (target === gpuMarketShareRef.current) newSection = 'gpu'
            else if (target === costPerformanceRef.current) newSection = 'cost'

            if (newSection) {
              console.log('Setting active section:', newSection)
              setActiveSection(newSection)
            }
          }
        })
      },
      { threshold: 0.3, rootMargin: '-20% 0px -20% 0px' },
    )

    const refs = [
      networkActivityRef,
      environmentStatsRef,
      minerEfficiencyRef,
      gpuMarketShareRef,
      costPerformanceRef,
    ]
    refs.forEach((ref) => ref.current && observer.observe(ref.current))

    return () => observer.disconnect()
  }, [])

  // Scroll to section function
  const scrollToSection = (
    ref: React.RefObject<HTMLDivElement>,
    sectionName: string,
  ) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
    <div className="min-h-screen transition-colors duration-300 bg-light-sand text-light-smoke relative">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Hero />

      {/* Main Content */}
      <main className="mt-9 md:mt-16 px-3 md:px-5 pb-20 w-full">
        {/* Content */}
        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-28">
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
                  <div className="flex gap-16">
                    <aside className="w-60 sticky top-5 self-start h-fit hidden md:block">
                      <h3 className="font-mono uppercase text-xs leading-none tracking-wide">
                        ENVIRONMENT OVERVIEW
                      </h3>

                      <ul className="space-y-2 uppercase mt-5 font-medium text-sm leading-none tracking-wide">
                        <li
                          className={`flex items-center gap-2 transition-opacity duration-300 ease-out select-none ${
                            activeSection === 'network'
                              ? 'opacity-30 cursor-auto '
                              : 'cursor-pointer hover:opacity-30'
                          }`}
                          onClick={() =>
                            scrollToSection(networkActivityRef, 'network')
                          }
                        >
                          <div
                            className={`w-2 h-2 shrink-0 rounded-full bg-black transition-transform duration-300 ease-out ${
                              activeSection === 'network'
                                ? 'scale-1'
                                : 'scale-0'
                            }`}
                          />
                          Network Activity & Performance
                        </li>

                        <li
                          className={`flex items-center gap-2 transition-opacity duration-300 ease-out select-none ${
                            activeSection === 'environment'
                              ? 'opacity-30 cursor-auto '
                              : 'cursor-pointer hover:opacity-30'
                          }`}
                          onClick={() =>
                            scrollToSection(environmentStatsRef, 'environment')
                          }
                        >
                          <div
                            className={`w-2 h-2 shrink-0 rounded-full bg-black transition-transform duration-300 ease-out ${
                              activeSection === 'environment'
                                ? 'scale-1'
                                : 'scale-0'
                            }`}
                          />
                          Environment Popularity & Difficulty
                        </li>

                        <li
                          className={`flex items-center gap-2 transition-opacity duration-300 ease-out select-none ${
                            activeSection === 'performance'
                              ? 'opacity-30 cursor-auto '
                              : 'cursor-pointer hover:opacity-30'
                          }`}
                          onClick={() =>
                            scrollToSection(minerEfficiencyRef, 'performance')
                          }
                        >
                          <div
                            className={`w-2 h-2 shrink-0 rounded-full bg-black transition-transform duration-300 ease-out ${
                              activeSection === 'performance'
                                ? 'scale-1'
                                : 'scale-0'
                            }`}
                          />
                          Performance vs. Latency
                        </li>

                        <li
                          className={`flex items-center gap-2 transition-opacity duration-300 ease-out select-none ${
                            activeSection === 'gpu'
                              ? 'opacity-30 cursor-auto '
                              : 'cursor-pointer hover:opacity-30'
                          }`}
                          onClick={() =>
                            scrollToSection(gpuMarketShareRef, 'gpu')
                          }
                        >
                          <div
                            className={`w-2 h-2 shrink-0 rounded-full bg-black transition-transform duration-300 ease-out ${
                              activeSection === 'gpu' ? 'scale-1' : 'scale-0'
                            }`}
                          />
                          GPU Market Share
                        </li>

                        <li
                          className={`flex items-center gap-2 transition-opacity duration-300 ease-out select-none ${
                            activeSection === 'cost'
                              ? 'opacity-30 cursor-auto '
                              : 'cursor-pointer hover:opacity-30'
                          }`}
                          onClick={() =>
                            scrollToSection(costPerformanceRef, 'cost')
                          }
                        >
                          <div
                            className={`w-2 h-2 shrink-0 rounded-full bg-black transition-transform duration-300 ease-out ${
                              activeSection === 'cost' ? 'scale-1' : 'scale-0'
                            }`}
                          />
                          Cost vs Performance
                        </li>
                      </ul>
                    </aside>

                    <div className="flex flex-col gap-8 w-full">
                      <div
                        ref={networkActivityRef}
                        className="break-inside-avoid"
                      >
                        <NetworkActivityChart theme={theme} />
                      </div>

                      <div
                        ref={environmentStatsRef}
                        className="break-inside-avoid"
                      >
                        <EnvironmentStatsChart theme={theme} />
                      </div>

                      <div
                        ref={minerEfficiencyRef}
                        className="break-inside-avoid"
                      >
                        <MinerEfficiencyChart theme={theme} />
                      </div>

                      <div
                        ref={gpuMarketShareRef}
                        className="break-inside-avoid"
                      >
                        <GpuMarketShareDonut theme={theme} />
                      </div>

                      <div
                        ref={costPerformanceRef}
                        className="break-inside-avoid"
                      >
                        <CostPerformanceScatter theme={theme} />
                      </div>
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
