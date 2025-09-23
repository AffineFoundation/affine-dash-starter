import React from 'react'

export function ParallaxLightBeams() {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 60
      const y = (e.clientY / window.innerHeight - 0.5) * 60
      setMousePos({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none opacity-10 z-40">
      {/* Large beams - fastest parallax */}
      <div
        className="absolute top-20 left-[28%] w-8 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-lg transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.5}px, ${
            mousePos.y * 1.5
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-8 left-[22%] w-10 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-xl transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${mousePos.x * 2}px, ${
            mousePos.y * 2
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-44 left-[48%] w-12 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-2xl transition-transform duration-120 ease-out"
        style={{
          transform: `translate(${mousePos.x * 2.2}px, ${
            mousePos.y * 2.2
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-32 left-[72%] w-8 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-lg transition-transform duration-350 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.4}px, ${
            mousePos.y * 1.4
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-40 left-[78%] w-9 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-xl transition-transform duration-220 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.75}px, ${
            mousePos.y * 1.75
          }px) rotate(45deg)`,
        }}
      />

      {/* Medium beams - medium parallax */}
      <div
        className="absolute top-24 left-[41%] w-5 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-md transition-transform duration-450 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.2}px, ${
            mousePos.y * 1.2
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-46 left-[47%] w-6 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-lg transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.1}px, ${
            mousePos.y * 1.1
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-28 left-[53%] w-5 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-md transition-transform duration-550 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.9}px, ${
            mousePos.y * 0.9
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-52 left-[49%] w-6 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-lg transition-transform duration-520 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.08}px, ${
            mousePos.y * 1.08
          }px) rotate(45deg)`,
        }}
      />

      {/* Thin beams - slowest parallax */}
      <div
        className="absolute top-60 left-[39%] w-3 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-sm opacity-60 transition-transform duration-600 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.4}px, ${
            mousePos.y * 0.4
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-16 left-[44%] w-4 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-md opacity-60 transition-transform duration-650 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${
            mousePos.y * 0.5
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-36 left-[54%] w-3 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-sm opacity-60 transition-transform duration-750 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.3}px, ${
            mousePos.y * 0.3
          }px) rotate(45deg)`,
        }}
      />

      {/* Corner beams - scattered */}
      <div
        className="absolute top-12 left-[15%] w-4 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-md opacity-40 transition-transform duration-400 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.8}px, ${
            mousePos.y * 0.8
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-56 left-[75%] w-5 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-lg opacity-50 transition-transform duration-320 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.3}px, ${
            mousePos.y * 1.3
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-72 left-[25%] w-3 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-sm opacity-30 transition-transform duration-600 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.6}px, ${
            mousePos.y * 0.6
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-4 left-[68%] w-6 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-xl opacity-45 transition-transform duration-280 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.6}px, ${
            mousePos.y * 1.6
          }px) rotate(45deg)`,
        }}
      />

      {/* Extra thin corner beams */}
      <div
        className="absolute top-8 left-[8%] w-1 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-sm opacity-50 transition-transform duration-800 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.2}px, ${
            mousePos.y * 0.2
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-64 left-[5%] w-1 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-sm opacity-45 transition-transform duration-900 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.15}px, ${
            mousePos.y * 0.15
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-20 left-[85%] w-1 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-sm opacity-50 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.25}px, ${
            mousePos.y * 0.25
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-48 left-[88%] w-1 h-full bg-gradient-to-b from-transparent via-[#6E61C9] to-transparent transform rotate-45 blur-sm opacity-45 transition-transform duration-850 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.18}px, ${
            mousePos.y * 0.18
          }px) rotate(45deg)`,
        }}
      />
      <div
        className="absolute top-76 left-[82%] w-1 h-full bg-gradient-to-b from-transparent via-[#EB676B] to-transparent transform rotate-45 blur-sm opacity-40 transition-transform duration-950 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.12}px, ${
            mousePos.y * 0.12
          }px) rotate(45deg)`,
        }}
      />
    </div>
  )
}
