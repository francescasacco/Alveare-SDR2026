import React, { useEffect, useRef } from 'react'
import AlveareMap from './AlveareMap'
import KonamiEaster from './KonamiEaster'
import beePng from './assets/bee.png'

const R_HEX = 22
const W_HEX = R_HEX * Math.sqrt(3)

const honeycombCenters: [number, number][] = []
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 4; col++) {
    honeycombCenters.push([
      W_HEX / 2 + col * W_HEX + (row % 2 === 1 ? W_HEX / 2 : 0),
      R_HEX + row * R_HEX * 1.5,
    ])
  }
}

const hexPoints = (cx: number, cy: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * (Math.PI / 180)
    return `${(cx + R_HEX * Math.cos(a)).toFixed(1)},${(cy + R_HEX * Math.sin(a)).toFixed(1)}`
  }).join(' ')

const HONEY_W = Math.ceil(W_HEX * 4 + W_HEX / 2)
const HONEY_H = Math.ceil(R_HEX * 6.5)

const HoneycombDecor: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    width={HONEY_W}
    height={HONEY_H}
    style={{ position: 'absolute', pointerEvents: 'none', zIndex: 0, ...style }}
    aria-hidden="true"
  >
    {honeycombCenters.map(([cx, cy], i) => (
      <polygon
        key={i}
        points={hexPoints(cx, cy)}
        stroke="#ffb200"
        strokeWidth="2"
        fill={i % 2 === 0 ? 'rgba(255,178,0,0.08)' : 'none'}
        opacity={0.35}
      />
    ))}
  </svg>
)

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
      const pad = 20

      if (zone === 'right') {
        if (vw - centerR >= 120) {
          return { xMin: centerR + pad, xMax: vw - pad, yMin: 60, yMax: vh - 60 }
        }
        return { xMin: vw * 0.72, xMax: vw - pad, yMin: vh * 0.72, yMax: vh - pad }
      } else {
        if (centerL >= 120) {
          return { xMin: pad, xMax: centerL - pad, yMin: 60, yMax: vh - 60 }
        }
        return { xMin: pad, xMax: vw * 0.28, yMin: vh * 0.72, yMax: vh - pad }
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

      <HoneycombDecor style={{ top: 0, right: 0 }} />
      <HoneycombDecor style={{ bottom: 0, left: 0 }} />

      <header style={{ textAlign: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            color: '#ffb200',
            fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
            fontFamily: "'Lilita One', cursive",
            fontWeight: 400,
            letterSpacing: '0.03em',
            WebkitTextStroke: '3px #1a0050',
            textShadow: '0 0 20px rgba(255,200,0,0.55), 0 0 40px rgba(255,160,0,0.3)',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          Solstizio di Ruolo 2026{<br />}Realtà partecipanti
        </h1>
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
