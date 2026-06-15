import React, { useState } from 'react'
import { logos, SVG_VIEW_W, SVG_VIEW_H, HEX_RX, HEX_RY, type LogoEntry } from './logos'
import Tooltip from './Tooltip'

interface TooltipState {
  entry: LogoEntry
  x: number
  y: number
}

const HexOverlay: React.FC = () => {
  const [tip, setTip] = useState<TooltipState | null>(null)

  const handleClick = (entry: LogoEntry) => {
    if (entry.url && entry.url !== '#') {
      window.open(entry.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleMouseEnter = (e: React.MouseEvent, entry: LogoEntry) => {
    setTip({ entry, x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
  }

  return (
    <>
      <svg
        viewBox={`0 0 ${SVG_VIEW_W} ${SVG_VIEW_H}`}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        aria-label="Loghi associazioni cliccabili"
      >
        {logos.map((entry) => (
          <ellipse
            key={entry.id}
            cx={entry.cx}
            cy={entry.cy}
            rx={HEX_RX}
            ry={HEX_RY}
            fill="transparent"
            stroke="transparent"
            onClick={() => handleClick(entry)}
            onMouseEnter={(e) => handleMouseEnter(e, entry)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTip(null)}
            role="button"
            tabIndex={0}
            aria-label={`${entry.label}${entry.url !== '#' ? ` — ${entry.url}` : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClick(entry)
            }}
            onFocus={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setTip({
                entry,
                x: rect.left + rect.width / 2,
                y: rect.top,
              })
            }}
            onBlur={() => setTip(null)}
          />
        ))}

        {tip && (
          <ellipse
            cx={tip.entry.cx}
            cy={tip.entry.cy}
            rx={HEX_RX}
            ry={HEX_RY}
            fill="rgba(255,178,0,0.15)"
            stroke="rgba(255,178,0,0.55)"
            strokeWidth={2}
            pointerEvents="none"
          />
        )}
      </svg>

      {tip && (
        <Tooltip
          label={tip.entry.label}
          url={tip.entry.url}
          x={tip.x}
          y={tip.y}
        />
      )}
    </>
  )
}

export default HexOverlay
