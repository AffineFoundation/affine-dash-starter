import React from 'react'

export function ParallaxNoise() {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      setMousePos({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none opacity-10 z-50">
      {/* Layer 1 - Dense texture */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)`,
          background: `
            radial-gradient(circle at 25% 25%, transparent 0.5px, rgba(71, 85, 105, 0.3) 0.5px, rgba(71, 85, 105, 0.3) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, transparent 0.5px, rgba(71, 85, 105, 0.2) 0.5px, rgba(71, 85, 105, 0.2) 1px, transparent 1px),
            radial-gradient(circle at 25% 75%, transparent 0.5px, rgba(71, 85, 105, 0.25) 0.5px, rgba(71, 85, 105, 0.25) 1px, transparent 1px),
            radial-gradient(circle at 75% 25%, transparent 0.5px, rgba(71, 85, 105, 0.18) 0.5px, rgba(71, 85, 105, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '4px 4px, 6px 6px, 3px 3px, 5px 5px',
        }}
      />

      {/* Layer 2 - Medium texture */}
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)`,
          background: `
            radial-gradient(circle at 33% 33%, transparent 0.5px, rgba(71, 85, 105, 0.16) 0.5px, rgba(71, 85, 105, 0.16) 1px, transparent 1px),
            radial-gradient(circle at 66% 66%, transparent 0.5px, rgba(71, 85, 105, 0.24) 0.5px, rgba(71, 85, 105, 0.24) 1px, transparent 1px),
            radial-gradient(circle at 33% 66%, transparent 0.5px, rgba(71, 85, 105, 0.19) 0.5px, rgba(71, 85, 105, 0.19) 1px, transparent 1px),
            radial-gradient(circle at 66% 33%, transparent 0.5px, rgba(71, 85, 105, 0.21) 0.5px, rgba(71, 85, 105, 0.21) 1px, transparent 1px)
          `,
          backgroundSize: '8px 8px, 12px 12px, 6px 6px, 10px 10px',
        }}
      />

      {/* Layer 3 - Fine texture */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
          background: `
            radial-gradient(circle at 20% 20%, transparent 0.5px, rgba(71, 85, 105, 0.08) 0.5px, rgba(71, 85, 105, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, transparent 0.5px, rgba(71, 85, 105, 0.11) 0.5px, rgba(71, 85, 105, 0.11) 1px, transparent 1px),
            radial-gradient(circle at 20% 80%, transparent 0.5px, rgba(71, 85, 105, 0.09) 0.5px, rgba(71, 85, 105, 0.09) 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, transparent 0.5px, rgba(71, 85, 105, 0.07) 0.5px, rgba(71, 85, 105, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px, 20px 20px, 14px 14px, 18px 18px',
        }}
      />

      {/* Layer 4 - Ultra fine texture */}
      <div
        className="absolute inset-0 transition-transform duration-400 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px)`,
          background: `
            radial-gradient(circle at 50% 50%, transparent 0.5px, rgba(71, 85, 105, 0.06) 0.5px, rgba(71, 85, 105, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '2px 2px',
        }}
      />
    </div>
  )
}
