import React, { useEffect, useRef, useState } from 'react'

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

const CW = 700
const CH = 430
const DRIP_TOP = 162
const POOL_Y  = 328

const EMITTERS = [108, 162, 210, 258, 308, 356, 404, 452, 502, 552, 606, 650]

interface Drip {
  id: number
  x: number
  stalH: number
  maxStalH: number
  growRate: number
  width: number
  dropY: number
  dropR: number
  dropVy: number
  phase: 'growing' | 'falling' | 'shrinking'
}

interface Ripple {
  x: number
  r: number
  maxR: number
  life: number
}

const KonamiEaster: React.FC = () => {
  const [show, setShow] = useState(false)
  const seqRef    = useRef<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const next = [...seqRef.current, e.key].slice(-KONAMI.length)
      seqRef.current = next
      if (next.length === KONAMI.length && next.every((k, i) => k === KONAMI[i])) {
        setShow(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!show) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    const state = {
      drips:   [] as Drip[],
      ripples: [] as Ripple[],
      nextId:  0,
      spawnIn: 300,
    }

    let lastT = -1

    function drawBackground() {
      ctx.clearRect(0, 0, CW, CH)
    }

    function drawText() {
      ctx.save()
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.font         = "48px 'Lilita One', cursive"

      const lines = ['PARTE DELLA CIURMA', 'PARTE DELLA NAVE']
      const ys    = [72, 128]

      for (let i = 0; i < lines.length; i++) {
        const y = ys[i]
        const grd = ctx.createLinearGradient(0, y - 28, 0, y + 28)
        grd.addColorStop(0,    '#ffe566')
        grd.addColorStop(0.45, '#ffb200')
        grd.addColorStop(1,    '#cc6600')

        ctx.save()
        ctx.shadowColor  = 'rgba(255, 170, 0, 0.85)'
        ctx.shadowBlur   = 22
        ctx.shadowOffsetY = 2
        ctx.strokeStyle  = '#1a0050'
        ctx.lineWidth    = 5
        ctx.strokeText(lines[i], CW / 2, y)
        ctx.fillStyle    = grd
        ctx.fillText(lines[i], CW / 2, y)
        ctx.restore()
      }
      ctx.restore()
    }

    function drawStalactite(d: Drip) {
      if (d.stalH < 1) return
      const { x, stalH, width: w } = d
      const hw  = w / 2
      const top = DRIP_TOP
      const bot = top + stalH

      const grd = ctx.createLinearGradient(x - hw, top, x + hw, top)
      grd.addColorStop(0,    'rgba(160, 72, 0, 0.72)')
      grd.addColorStop(0.30, 'rgba(255, 185, 0, 0.95)')
      grd.addColorStop(0.55, 'rgba(255, 210, 30, 0.92)')
      grd.addColorStop(1,    'rgba(160, 72, 0, 0.72)')

      ctx.beginPath()
      ctx.moveTo(x - hw, top)
      ctx.bezierCurveTo(x - hw, top + stalH * 0.5, x - hw * 0.75, bot - 1, x, bot)
      ctx.bezierCurveTo(x + hw * 0.75, bot - 1, x + hw, top + stalH * 0.5, x + hw, top)
      ctx.closePath()
      ctx.fillStyle = grd
      ctx.fill()

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x - hw * 0.15, top)
      ctx.bezierCurveTo(x - hw * 0.08, top + stalH * 0.45, x - hw * 0.08, top + stalH * 0.65, x + hw * 0.05, bot - 3)
      ctx.strokeStyle  = 'rgba(255, 245, 160, 0.32)'
      ctx.lineWidth    = hw * 0.45
      ctx.lineCap      = 'round'
      ctx.stroke()
      ctx.restore()
    }

    function drawThread(d: Drip) {
      if (d.phase !== 'falling') return
      const threadTop = DRIP_TOP + d.stalH
      const threadBot = d.dropY - d.dropR * 0.9
      if (threadBot <= threadTop) return
      const threadLen  = threadBot - threadTop
      const maxThreadL = d.maxStalH * 1.8
      if (threadLen > maxThreadL) return

      const progress  = threadLen / maxThreadL
      const threadW   = Math.max(0.4, (1 - progress) * d.width * 0.22)
      const alpha     = Math.max(0, 0.75 - progress * 0.9)

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(d.x, threadTop)
      ctx.quadraticCurveTo(d.x + Math.sin(progress * Math.PI) * 2, (threadTop + threadBot) / 2, d.x, threadBot)
      ctx.strokeStyle = `rgba(255, 175, 0, ${alpha})`
      ctx.lineWidth   = threadW
      ctx.lineCap     = 'round'
      ctx.stroke()
      ctx.restore()
    }

    function drawDrop(d: Drip) {
      if (d.phase !== 'falling') return
      const { x, dropY, dropR, dropVy } = d
      const stretch = 1 + Math.min(dropVy * 0.038, 1.3)
      const rh = dropR * stretch
      const rw = dropR / Math.sqrt(stretch)

      const grd = ctx.createRadialGradient(x - rw * 0.28, dropY - rh * 0.15, rw * 0.05, x, dropY + rh * 0.15, rw * 1.7)
      grd.addColorStop(0,    'rgba(255, 235, 110, 0.98)')
      grd.addColorStop(0.38, 'rgba(255, 155, 0,  0.95)')
      grd.addColorStop(1,    'rgba(130, 55,  0,  0.88)')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, dropY - rh)
      ctx.bezierCurveTo(x + rw * 0.55, dropY - rh * 0.28, x + rw, dropY + rh * 0.28, x, dropY + rh)
      ctx.bezierCurveTo(x - rw, dropY + rh * 0.28, x - rw * 0.55, dropY - rh * 0.28, x, dropY - rh)
      ctx.closePath()
      ctx.fillStyle = grd
      ctx.fill()

      ctx.beginPath()
      ctx.ellipse(x - rw * 0.3, dropY - rh * 0.05, rw * 0.22, rh * 0.18, -0.35, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 248, 200, 0.52)'
      ctx.fill()
      ctx.restore()
    }

    function drawPool(nowMs: number) {
      const t = nowMs / 1000

      const poolGrd = ctx.createLinearGradient(0, POOL_Y, 0, CH)
      poolGrd.addColorStop(0,    'rgba(255, 172, 0, 0.92)')
      poolGrd.addColorStop(0.10, 'rgba(210, 118, 0, 0.95)')
      poolGrd.addColorStop(0.50, 'rgba(128, 56,  0, 0.98)')
      poolGrd.addColorStop(1,    'rgba(64,  24,  0, 1)')

      ctx.beginPath()
      ctx.moveTo(0, POOL_Y)
      for (let px = 0; px <= CW; px += 3) {
        const wy = POOL_Y
          + Math.sin(px * 0.021 + t * 1.7)  * 2.8
          + Math.sin(px * 0.041 + t * 2.8)  * 1.2
          + Math.sin(px * 0.009 + t * 0.9)  * 1.5
        ctx.lineTo(px, wy)
      }
      ctx.lineTo(CW, CH)
      ctx.lineTo(0,  CH)
      ctx.closePath()
      ctx.fillStyle = poolGrd
      ctx.fill()

      const shimCX = CW * 0.5 + Math.sin(t * 0.35) * CW * 0.28
      const shimGrd = ctx.createLinearGradient(shimCX - CW * 0.22, 0, shimCX + CW * 0.22, 0)
      shimGrd.addColorStop(0,    'rgba(255, 240, 130, 0)')
      shimGrd.addColorStop(0.5,  'rgba(255, 240, 130, 0.16)')
      shimGrd.addColorStop(1,    'rgba(255, 240, 130, 0)')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(0, POOL_Y - 4)
      for (let px = 0; px <= CW; px += 3) {
        const wy = POOL_Y + Math.sin(px * 0.021 + t * 1.7) * 2.8 - 2
        ctx.lineTo(px, wy)
      }
      ctx.lineTo(CW, POOL_Y - 4)
      ctx.closePath()
      ctx.fillStyle = shimGrd
      ctx.fill()
      ctx.restore()
    }

    function drawRipples() {
      for (const rp of state.ripples) {
        const alpha = (1 - rp.life) * 0.7
        ctx.beginPath()
        ctx.ellipse(rp.x, POOL_Y, rp.r, rp.r * 0.20, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 215, 70, ${alpha})`
        ctx.lineWidth   = 2
        ctx.stroke()

        if (rp.r > 14) {
          ctx.beginPath()
          ctx.ellipse(rp.x, POOL_Y, rp.r * 0.52, rp.r * 0.10, 0, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255, 215, 70, ${alpha * 0.45})`
          ctx.lineWidth   = 1.2
          ctx.stroke()
        }
      }
    }

    function drawUI() {
      ctx.save()
      ctx.font         = "13px 'Segoe UI', sans-serif"
      ctx.fillStyle    = 'rgba(255, 200, 80, 0.4)'
      ctx.textAlign    = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText('By Francesca "Leia" Sacco', CW - 10, CH - 7)
      ctx.restore()
    }

    function spawnDrip() {
      const x = EMITTERS[Math.floor(Math.random() * EMITTERS.length)] + (Math.random() - 0.5) * 8
      state.drips.push({
        id:        state.nextId++,
        x,
        stalH:     0,
        maxStalH:  24 + Math.random() * 32,
        growRate:  0.22 + Math.random() * 0.32,
        width:     5 + Math.random() * 4,
        dropY:     DRIP_TOP,
        dropR:     5 + Math.random() * 3.5,
        dropVy:    0,
        phase:     'growing',
      })
    }

    function frame(now: number) {
      const dt = lastT < 0 ? 16 : Math.min(now - lastT, 50)
      lastT = now

      state.spawnIn -= dt
      if (state.spawnIn <= 0) {
        spawnDrip()
        state.spawnIn = 420 + Math.random() * 620
      }

      const dead = new Set<number>()
      for (const d of state.drips) {
        if (d.phase === 'growing') {
          d.stalH += d.growRate * (dt / 16)
          if (d.stalH >= d.maxStalH) {
            d.phase  = 'falling'
            d.dropY  = DRIP_TOP + d.stalH
            d.dropVy = 1.2
            d.stalH  = d.maxStalH * 0.38
          }
        } else if (d.phase === 'falling') {
          d.dropVy += 0.42 * (dt / 16)
          d.dropY  += d.dropVy * (dt / 16)
          if (d.dropY - d.dropR >= POOL_Y) {
            state.ripples.push({ x: d.x, r: 2, maxR: 24 + d.dropR * 2.8, life: 0 })
            d.phase = 'shrinking'
          }
        } else if (d.phase === 'shrinking') {
          d.stalH -= 0.55 * (dt / 16)
          if (d.stalH <= 0) dead.add(d.id)
        }
      }
      state.drips   = state.drips.filter(d => !dead.has(d.id))

      for (const rp of state.ripples) {
        rp.life += dt / 1100
        rp.r     = rp.maxR * Math.sqrt(Math.min(rp.life, 1))
      }
      state.ripples = state.ripples.filter(r => r.life < 1)

      drawBackground()
      drawText()
      for (const d of state.drips) drawStalactite(d)
      for (const d of state.drips) drawThread(d)
      for (const d of state.drips) drawDrop(d)
      drawPool(now)
      drawRipples()
      drawUI()

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [show])

  if (!show) return null

  return (
    <div
      onClick={() => setShow(false)}
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          9999,
        background:      'radial-gradient(ellipse at center, rgba(46,8,112,0.95) 0%, rgba(8,0,24,0.98) 70%)',
        backdropFilter:  'blur(8px)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        cursor:          'pointer',
        animation:       'konami-fade 0.4s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{
          display:  'block',
          width:    '90vw',
          maxWidth: CW,
        }}
      />
    </div>
  )
}

export default KonamiEaster
