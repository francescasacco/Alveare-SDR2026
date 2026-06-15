import React, { useEffect, useRef, useState } from 'react'
import alveareSvg from './assets/alveare.svg'
import { logos } from './logos'
import Tooltip from './Tooltip'

interface TooltipState {
  label: string
  x: number
  y: number
}

function pathCentroid(d: string): { cx: number; cy: number } | null {
  const pts: Array<[number, number]> = []
  let cx = 0, cy = 0
  const cmds = d.match(/[MmZzLlHhVvCcSsQqTtAa][^MmZzLlHhVvCcSsQqTtAa]*/g) ?? []
  for (const token of cmds) {
    const cmd = token[0]
    const n = (token.slice(1).match(/[-\d.e]+/g) ?? []).map(Number)
    if (cmd === 'M') {
      for (let i = 0; i + 1 < n.length; i += 2) { cx = n[i]; cy = n[i + 1]; pts.push([cx, cy]) }
    } else if (cmd === 'm') {
      for (let i = 0; i + 1 < n.length; i += 2) { cx += n[i]; cy += n[i + 1]; pts.push([cx, cy]) }
    } else if (cmd === 'L') {
      for (let i = 0; i + 1 < n.length; i += 2) { cx = n[i]; cy = n[i + 1]; pts.push([cx, cy]) }
    } else if (cmd === 'l') {
      for (let i = 0; i + 1 < n.length; i += 2) { cx += n[i]; cy += n[i + 1]; pts.push([cx, cy]) }
    } else if (cmd === 'H') {
      for (const v of n) { cx = v; pts.push([cx, cy]) }
    } else if (cmd === 'h') {
      for (const v of n) { cx += v; pts.push([cx, cy]) }
    } else if (cmd === 'V') {
      for (const v of n) { cy = v; pts.push([cx, cy]) }
    } else if (cmd === 'v') {
      for (const v of n) { cy += v; pts.push([cx, cy]) }
    } else if (cmd === 'C') {
      for (let i = 0; i + 5 < n.length; i += 6) { cx = n[i + 4]; cy = n[i + 5]; pts.push([cx, cy]) }
    } else if (cmd === 'c') {
      for (let i = 0; i + 5 < n.length; i += 6) { cx += n[i + 4]; cy += n[i + 5]; pts.push([cx, cy]) }
    } else if (cmd === 'S' || cmd === 'Q') {
      for (let i = 0; i + 3 < n.length; i += 4) { cx = n[i + 2]; cy = n[i + 3]; pts.push([cx, cy]) }
    } else if (cmd === 's' || cmd === 'q') {
      for (let i = 0; i + 3 < n.length; i += 4) { cx += n[i + 2]; cy += n[i + 3]; pts.push([cx, cy]) }
    } else if (cmd === 'T') {
      for (let i = 0; i + 1 < n.length; i += 2) { cx = n[i]; cy = n[i + 1]; pts.push([cx, cy]) }
    } else if (cmd === 't') {
      for (let i = 0; i + 1 < n.length; i += 2) { cx += n[i]; cy += n[i + 1]; pts.push([cx, cy]) }
    } else if (cmd === 'A') {
      for (let i = 0; i + 6 < n.length; i += 7) { cx = n[i + 5]; cy = n[i + 6]; pts.push([cx, cy]) }
    } else if (cmd === 'a') {
      for (let i = 0; i + 6 < n.length; i += 7) { cx += n[i + 5]; cy += n[i + 6]; pts.push([cx, cy]) }
    }
  }
  if (pts.length < 3) return null
  return {
    cx: pts.reduce((s, p) => s + p[0], 0) / pts.length,
    cy: pts.reduce((s, p) => s + p[1], 0) / pts.length,
  }
}

const AlveareMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgText, setSvgText] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  useEffect(() => {
    fetch(alveareSvg)
      .then(r => r.text())
      .then(text => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'image/svg+xml')
        const svgEl = doc.documentElement
        svgEl.setAttribute('width', '100%')
        svgEl.removeAttribute('height')
        svgEl.setAttribute('overflow', 'visible')
        Array.from(svgEl.children).forEach(child => {
          child.removeAttribute('clip-path')
          Array.from(child.children).forEach(grandchild => grandchild.removeAttribute('clip-path'))
        })

        const vb = (svgEl.getAttribute('viewBox') ?? '0 0 810 1012.49997').split(' ').map(Number)
        const cropTop = 127
        const cropBottom = 137
        svgEl.setAttribute('viewBox', `${vb[0]} ${vb[1] + cropTop} ${vb[2]} ${vb[3] - cropTop - cropBottom}`)

        const centerX = logos.reduce((s, l) => s + l.cx, 0) / logos.length
        const centerY = logos.reduce((s, l) => s + l.cy, 0) / logos.length

        const yellowPaths = Array.from(
          doc.querySelectorAll<SVGPathElement>('path[fill="#ffb200"]')
        )

        const wrapperEntries: Array<{ wrapper: Element; angle: number }> = []

        yellowPaths.forEach(path => {
          const borderClip = path.parentElement
          const imageClip = borderClip?.previousElementSibling
          if (!borderClip || !imageClip) return

          const center = pathCentroid(path.getAttribute('d') ?? '')
          if (!center) return

          const logo = logos.reduce((best, curr) =>
            Math.hypot(curr.cx - center.cx, curr.cy - center.cy) <
            Math.hypot(best.cx - center.cx, best.cy - center.cy)
              ? curr : best
          )

          const wrapper = doc.createElementNS('http://www.w3.org/2000/svg', 'g')
          const isEmpty = !logo.label
          wrapper.setAttribute('class', isEmpty ? 'logo-hex-empty' : 'logo-hex popping')
          wrapper.setAttribute('data-logo-id', String(logo.id))

          borderClip.parentElement!.insertBefore(wrapper, imageClip)
          wrapper.appendChild(imageClip)
          wrapper.appendChild(borderClip)

          if (!isEmpty) {
            const dx = logo.cx - centerX
            const dy = logo.cy - centerY
            const rawAngle = Math.atan2(dx, -dy)
            const angle = rawAngle < 0 ? rawAngle + Math.PI * 2 : rawAngle
            wrapperEntries.push({ wrapper, angle })
          }
        })

        wrapperEntries.sort((a, b) => a.angle - b.angle)
        wrapperEntries.forEach(({ wrapper }, i) => {
          wrapper.setAttribute('style', `animation-delay: ${i * 25}ms`)
        })

        setSvgText(new XMLSerializer().serializeToString(svgEl))
      })
  }, [])

  useEffect(() => {
    if (!svgText || !containerRef.current) return
    const maxDelay = (logos.length - 1) * 25 + 400
    const timer = setTimeout(() => {
      containerRef.current?.querySelectorAll<Element>('.logo-hex.popping').forEach(el => {
        el.classList.remove('popping')
      })
    }, maxDelay)
    return () => clearTimeout(timer)
  }, [svgText])

  const getLogo = (target: EventTarget) => {
    const g = (target as Element).closest('[data-logo-id]')
    if (!g) return null
    return logos.find(l => l.id === parseInt(g.getAttribute('data-logo-id') ?? '0')) ?? null
  }

  const handleClick = (e: React.MouseEvent) => {
    const logo = getLogo(e.target)
    if (logo?.url && logo.url !== '#') {
      window.open(logo.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const logo = getLogo(e.target)
    if (!logo || !logo.label) {
      if (tooltip) setTooltip(null)
      return
    }
    setTooltip({ label: logo.label, x: e.clientX, y: e.clientY })
  }

  if (svgText === null) {
    return <div style={{ width: '100%', aspectRatio: '810 / 748' }} />
  }

  return (
    <>
      <div
        ref={containerRef}
        className="alveare-mount"
        style={{ width: '100%' }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        dangerouslySetInnerHTML={{ __html: svgText }}
      />
      {tooltip && <Tooltip {...tooltip} />}
    </>
  )
}

export default AlveareMap
