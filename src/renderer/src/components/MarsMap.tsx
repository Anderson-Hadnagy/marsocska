import { useEffect, useRef } from 'react'

const CELL_SIZE = 12 // Internal rendering size (50 * 12 = 600px)

const COLORS: Record<string, string> = {
  '.': '#c1440e',
  '#': '#555555',
  'B': '#3b82f6',
  'Y': '#eab308',
  'G': '#22c55e',
  'S': '#ffffff',
}

interface MarsMapProps {
  grid: string[][]
  roverPos: { x: number; y: number }
}

export default function MarsMap({ grid, roverPos }: MarsMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || grid.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 1. Map rajzolás 
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        ctx.fillStyle = COLORS[cell] || '#000000'
        ctx.fillRect(colIndex * CELL_SIZE, rowIndex * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'
        ctx.strokeRect(colIndex * CELL_SIZE, rowIndex * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      })
    })

    // 2. A genyó ami meny 
    ctx.fillStyle = '#ef4444' 
    ctx.beginPath()
    ctx.arc(
      roverPos.x * CELL_SIZE + CELL_SIZE / 2,
      roverPos.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

  }, [grid, roverPos]) // Ujra rajzol

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={50 * CELL_SIZE} // Internal resolution stays the same!
        height={50 * CELL_SIZE}
        style={{ 
          width: '100%',       // CSS visually scales it to fit the box
          height: '100%', 
          objectFit: 'contain', // Keeps it a perfect square
          boxShadow: '0 0 15px var(--main-color-transparent)',
          border: '1px solid var(--main-color-transparent)'
        }}
      />
    </div>
  )
}