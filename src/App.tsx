import React, { useEffect, useRef } from 'react'
import AlveareMap from './AlveareMap'
import KonamiEaster from './KonamiEaster'
import beePng from './assets/bee.png'

const hexPts = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * (Math.PI / 180)
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

const buildGrid = (R: number, rows: number, cols: number): [number, number][] => {
  const W = R * Math.sqrt(3)
  const out: [number, number][] = []
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      out.push([W / 2 + col * W + (row % 2 === 1 ? W / 2 : 0), R + row * R * 1.5])
  return out
}

const HoneycombDecor: React.FC<{ style?: React.CSSProperties; variant?: 'A' | 'B' }> = ({
  style,
  variant = 'A',
}) => {
  if (variant === 'A') {
    const R = 22, W = R * Math.sqrt(3)
    const centers = buildGrid(R, 4, 4)
    return (
      <svg
        width={Math.ceil(W * 4 + W / 2)}
        height={Math.ceil(R * 6.5)}
        style={{ position: 'absolute', pointerEvents: 'none', zIndex: 0, ...style }}
        aria-hidden="true"
      >
        {centers.map(([cx, cy], i) => (
          <polygon key={i} points={hexPts(cx, cy, R)}
            stroke="#ffb200" strokeWidth="2"
            fill={i % 2 === 0 ? 'rgba(255,178,0,0.10)' : 'none'}
            opacity={0.40} />
        ))}
      </svg>
    )
  }

  const R = 17, W = R * Math.sqrt(3), COLS = 5
  const centers = buildGrid(R, 5, COLS)
  return (
    <svg
      width={Math.ceil(W * COLS + W / 2)}
      height={Math.ceil(R * 8)}
      style={{ position: 'absolute', pointerEvents: 'none', zIndex: 0, ...style }}
      aria-hidden="true"
    >
      {centers.map(([cx, cy], i) => {
        const row = Math.floor(i / COLS)
        const col = i % COLS
        const pat = (row * 2 + col) % 3
        return (
          <polygon key={i} points={hexPts(cx, cy, R)} stroke="#ffb200" strokeWidth="1.5"
            fill={pat === 0 ? 'rgba(255,178,0,0.16)' : 'none'}
            opacity={0.38} />
        )
      })}
    </svg>
  )
}

const BeeWander: React.FC<{
  zone: 'left' | 'right'
  delay?: number
  minInterval?: number
  maxInterval?: number
  damping?: number
  stiffness?: number
}> = ({
  zone,
  delay = 0,
  minInterval = 2500,
  maxInterval = 5000,
  damping = 0.93,
  stiffness = 0.005,
}) => {
  const beeRef = useRef<HTMLImageElement>(null)
  const stateRef = useRef({
    x: 0, y: 0,
    vx: 0, vy: 0,
    tx: 0, ty: 0,
    nextTarget: 0,
    initialized: false,
  })

  useEffect(() => {
    let raf: number

    const getZone = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const containerW = Math.min(vw * 0.9, 760)
      const centerL = (vw - containerW) / 2
      const centerR = centerL + containerW
      const pad = 15

      if (zone === 'right') {
        if (vw - centerR >= 80) {
          return { xMin: centerR - 80, xMax: vw - pad, yMin: 60, yMax: vh - 60 }
        }
        return { xMin: vw * 0.72, xMax: vw - pad, yMin: vh * 0.70, yMax: vh - pad }
      } else {
        if (centerL >= 80) {
          return { xMin: pad, xMax: centerL + 80, yMin: 60, yMax: vh - 60 }
        }
        return { xMin: pad, xMax: vw * 0.28, yMin: vh * 0.70, yMax: vh - pad }
      }
    }

    const tick = (now: number) => {
      const bee = beeRef.current
      if (!bee) { raf = requestAnimationFrame(tick); return }
      const s = stateRef.current

      if (!s.initialized) {
        const z = getZone()
        s.x = zone === 'right' ? z.xMax - 60 : z.xMin + 60
        s.y = (z.yMin + z.yMax) / 2
        s.tx = s.x
        s.ty = s.y
        s.nextTarget = now + delay + Math.random() * 600
        s.initialized = true
      }

      if (now > s.nextTarget) {
        const z = getZone()
        s.tx = z.xMin + Math.random() * (z.xMax - z.xMin)
        s.ty = z.yMin + Math.random() * (z.yMax - z.yMin)
        s.nextTarget = now + minInterval + Math.random() * (maxInterval - minInterval)
      }

      s.vx = s.vx * damping + (s.tx - s.x) * stiffness
      s.vy = s.vy * damping + (s.ty - s.y) * stiffness
      s.x += s.vx
      s.y += s.vy

      bee.style.left = `${s.x}px`
      bee.style.top = `${s.y}px`
      bee.style.transform = `translate(-50%, -50%)${zone === 'left' ? ' scaleX(-1)' : ''}`

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [zone, delay, minInterval, maxInterval, damping, stiffness])

  return (
    <img
      ref={beeRef}
      src={beePng}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'block',
        pointerEvents: 'none',
        width: 150,
        height: 'auto',
        zIndex: 10,
      }}
      aria-hidden="true"
      alt=""
    />
  )
}

const App: React.FC = () => {
  return (
    <div
      style={{
        height: '100vh',
        position: 'relative',
        background: '#5023a4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px 16px',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      <BeeWander
        zone="right"
        delay={0}
        minInterval={2000} maxInterval={5000}
        damping={0.93} stiffness={0.005}
      />
      <BeeWander
        zone="left"
        delay={2800}
        minInterval={3500} maxInterval={7500}
        damping={0.91} stiffness={0.004}
      />

      <HoneycombDecor style={{ top: 0, right: 0 }} variant="A" />
      <HoneycombDecor style={{ bottom: 0, left: 0 }} variant="B" />

      <header style={{ textAlign: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            color: '#ffd000',
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            fontFamily: "'Colo Pro', 'Lilita One', cursive",
            fontWeight: 400,
            letterSpacing: '0.04em',
            textShadow: '0 0 14px rgba(255,180,0,0.6), 0 0 30px rgba(255,140,0,0.3)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Solstizio di Ruolo 2026
        </h1>
        <p
          style={{
            color: '#f08c00',
            fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
            fontFamily: "'Colo Pro', 'Lilita One', cursive",
            fontWeight: 400,
            letterSpacing: '0.03em',
            textShadow: '0 0 10px rgba(240,140,0,0.3)',
            margin: '4px 0 0',
          }}
        >
          Realtà partecipanti
        </p>
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: 'min(760px, 90vw)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AlveareMap />
      </div>

      <footer
        style={{
          marginTop: 24,
          color: '#475569',
          fontSize: '0.75rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        SDR 2026 · Alveare delle Associazioni
      </footer>

      <KonamiEaster />
    </div>
  )
}

export default App
