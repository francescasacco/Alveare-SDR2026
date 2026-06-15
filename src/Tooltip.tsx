import React from 'react'

interface TooltipProps {
  label: string
  x: number
  y: number
}

const Tooltip: React.FC<TooltipProps> = ({ label, x, y }) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -115%)',
        background: 'rgba(10, 10, 25, 0.92)',
        color: '#fff',
        padding: '8px 14px',
        borderRadius: 8,
        fontSize: '0.8rem',
        pointerEvents: 'none',
        zIndex: 9999,
        border: '1px solid #ffb200',
        minWidth: 150,
        textAlign: 'center',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ fontWeight: 700, color: '#ffb200' }}>
        {label}
      </div>
    </div>
  )
}

export default Tooltip
