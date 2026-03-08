import { useState, useEffect, useRef } from 'react'
import MarsMap from './components/MarsMap'
import rawMapData from './assets/mars_map_50x50.csv?raw'
import { findPath, Point } from './utils/Pathfinder'

const INITIAL_GRID = rawMapData
  .trim()
  .split('\n')
  .map((row) => row.split(',').map((cell) => cell.trim()))

let startX = 0, startY = 0
INITIAL_GRID.forEach((row, y) => {
  row.forEach((cell, x) => {
    if (cell === 'S') {
      startX = x
      startY = y
    }
  })
})

const START_POS: Point = { x: startX, y: startY }

export default function App() {
  // Setup & Limits
  const [hasStarted, setHasStarted] = useState(false)
  const [timeLimitHours, setTimeLimitHours] = useState<number>(24)
  
  // Rover State
  const [grid, setGrid] = useState<string[][]>(INITIAL_GRID)
  const [roverPos, setRoverPos] = useState<Point>(START_POS)
  const [battery, setBattery] = useState<number>(100)
  const [timeTicks, setTimeTicks] = useState<number>(0) // 1 tick = 30 mins
  const [inventory, setInventory] = useState({ B: 0, Y: 0, G: 0 })
  const [totalDistance, setTotalDistance] = useState<number>(0)
  
  // Simulation Control
  const [isRunning, setIsRunning] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState<number>(0)
  const [status, setStatus] = useState<string>('Ready') 
  const [logs, setLogs] = useState<string[]>([])

  // DOM Refs for Day/Night Cycle
  const sunRef = useRef<HTMLDivElement>(null)
  const moonRef = useRef<HTMLDivElement>(null)
  const visRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  // We start the visual time at 12 (Sunrise) instead of 0 (Sunset)
  const timeRef = useRef(12) 

  const stateRef = useRef({ 
    grid, 
    roverPos, 
    battery, 
    inventory, 
    path: [] as Point[], 
    timeTicks,
    totalDistance,
    status
  })
  
  useEffect(() => {
    stateRef.current = { grid, roverPos, battery, inventory, path: stateRef.current.path, timeTicks, totalDistance, status }
  }, [grid, roverPos, battery, inventory, timeTicks, totalDistance, status])

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg].slice(-12)) 
  }

  // --- PERFECTED DAY/NIGHT CYCLE LOGIC ---
  const updateSky = () => {
    if (sunRef.current && moonRef.current && visRef.current && wrapperRef.current) {
      const sunSize = 50
      const visualizationWidth = visRef.current.offsetWidth
      const visualizationHeight = visRef.current.offsetHeight
      const centerX = visualizationWidth / 2
      const centerY = visualizationHeight / 2
      const radiusX = visualizationWidth / 2
      const radiusY = visualizationHeight / 2

      const angle = (timeRef.current % 24) * (Math.PI / 12)
      const x = (centerX - sunSize / 2) + (radiusX - sunSize / 2) * Math.cos(angle)
      const y = (centerY - sunSize / 2) + (radiusY - sunSize / 2) * Math.sin(angle)

      sunRef.current.style.left = `${x}px`
      sunRef.current.style.top = `${y}px`
      moonRef.current.style.left = `${visualizationWidth - x - sunSize}px`
      moonRef.current.style.top = `${visualizationHeight - y - sunSize}px`

      visRef.current.style.background = 
        `radial-gradient(circle at center, rgba(0, 110, 255, ${Math.max(Math.sin(-angle) / 3, 0)}), rgba(1, 100, 240, ${Math.max(0.8 * Math.sin(-angle) / 3, 0)}))`
      
      wrapperRef.current.style.boxShadow = 
        `0 0 30px rgba(0, 110, 255, ${Math.max(Math.sin(-angle) / 3, 0)})`
    }
  }

  useEffect(() => {
    if (!hasStarted) return
    
    updateSky()

    if (!isRunning) return

    let animationFrameId: number
    let lastUpdate = Date.now()

    const animate = () => {
      const now = Date.now()
      const delta = now - lastUpdate

      if (delta >= 50) {
        timeRef.current += 0.1
        lastUpdate = now
        updateSky()
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationFrameId)
  }, [hasStarted, isRunning]) 
  // ----------------------------------------


  const findNextMineral = (currentGrid: string[][], currentPos: Point) => {
    let closestPath: Point[] | null = null
    for (let y = 0; y < currentGrid.length; y++) {
      for (let x = 0; x < currentGrid[y].length; x++) {
        const cell = currentGrid[y][x]
        if (cell === 'B' || cell === 'Y' || cell === 'G') {
          const path = findPath(currentGrid, currentPos, { x, y })
          if (path && (!closestPath || path.length < closestPath.length)) {
            closestPath = path
          }
        }
      }
    }
    return closestPath
  }

  // THE LOOP!!!!!!!!!!!!!!!!
  useEffect(() => {
    if (!isRunning) return

    const tickInterval = setInterval(() => {
      const state = stateRef.current
      if (state.status === 'Finished') { setIsRunning(false); return; }

      let newTicks = state.timeTicks + 1 
      const cycleTick = newTicks % 48 
      const isDay = cycleTick < 32
      const maxTicks = timeLimitHours * 2

      let energyChange = isDay ? 10 : 0
      let stepSpeed = 0
      let newPos = state.roverPos
      let newGrid = [...state.grid.map(row => [...row])]
      let newStatus = state.status

      const pathToStart = findPath(newGrid, state.roverPos, START_POS) || []
      const ticksLeft = maxTicks - newTicks
      
      if (newStatus !== 'Returning' && (ticksLeft <= pathToStart.length + 2)) {
         newStatus = 'Returning'
         state.path = pathToStart
         addLog(`> CRITICAL: Time limit approaching. Returning to base.`)
      }

      const currentCell = newGrid[state.roverPos.y][state.roverPos.x]

      if (newStatus === 'Returning' && state.roverPos.x === START_POS.x && state.roverPos.y === START_POS.y) {
         newStatus = 'Finished'
         energyChange -= 1 
         addLog(`> MISSION ACCOMPLISHED. Safely back at base.`)
         setIsRunning(false)
      } else if (newStatus !== 'Returning' && (currentCell === 'B' || currentCell === 'Y' || currentCell === 'G')) {
        if (state.battery + energyChange >= 2) {
          energyChange -= 2 
          setInventory((prev) => ({ ...prev, [currentCell]: prev[currentCell] + 1 }))
          newGrid[state.roverPos.y][state.roverPos.x] = '.' 
          setGrid(newGrid)
          newStatus = 'Mining'
        } else {
          energyChange -= 1 
          newStatus = 'Standby (Low Energy)'
        }
      } else {
        if (state.path.length === 0) {
          if (newStatus === 'Returning') {
             state.path = findPath(newGrid, state.roverPos, START_POS) || []
          } else {
             const newPath = findNextMineral(newGrid, state.roverPos)
             if (newPath && newPath.length > 0) {
                state.path = newPath 
                newStatus = 'Exploring'
             } else {
                state.path = findPath(newGrid, state.roverPos, START_POS) || []
                newStatus = 'Returning'
                addLog(`> All accessible minerals cleared. Returning to base.`)
             }
          }
        }

        if (state.path.length > 0) {
          let targetSpeed = 0
          if (state.battery >= 30 && isDay) targetSpeed = 3 
          else if (state.battery >= 15) targetSpeed = 2 
          else if (state.battery >= 3) targetSpeed = 1 

          let actualSpeed = Math.min(targetSpeed, state.path.length)

          if (actualSpeed > 0) {
            for (let i = 0; i < actualSpeed; i++) {
               newPos = state.path.shift()!
               stepSpeed++
               const cellAfterStep = newGrid[newPos.y][newPos.x]
               if (newStatus !== 'Returning' && (cellAfterStep === 'B' || cellAfterStep === 'Y' || cellAfterStep === 'G')) break
            }
            const energyCost = 2 * (stepSpeed * stepSpeed)
            energyChange -= energyCost
            setTotalDistance(prev => prev + stepSpeed)
            setRoverPos(newPos)
          } else {
            energyChange -= 1 
            if (state.battery + energyChange <= 0) {
                newStatus = 'Dead Battery'
                setIsRunning(false)
            }
          }
        } else if (newStatus !== 'Finished') {
           energyChange -= 1 
        }
      }

      const finalBattery = Math.min(100, Math.max(0, state.battery + energyChange))
      setBattery(finalBattery)
      setTimeTicks(newTicks)
      setCurrentSpeed(stepSpeed)
      setStatus(newStatus)
      
      const h = Math.floor(newTicks / 2)
      const m = (newTicks % 2) === 0 ? '00' : '30'
      addLog(`[T+${h}:${m}] Pos:[${newPos.x},${newPos.y}] | Bat:${finalBattery}% | Spd:${stepSpeed} | Status:${newStatus}`)

      if (newTicks >= maxTicks && newStatus !== 'Finished') {
         addLog(`> CRITICAL ERROR: Time limit exceeded. Rover lost on Mars.`)
         setIsRunning(false)
      }
    }, 250) 

    return () => clearInterval(tickInterval)
  }, [isRunning, timeLimitHours])

  const hours = Math.floor(timeTicks / 2)
  const minutes = (timeTicks % 2) === 0 ? '00' : '30'

  if (!hasStarted) {
    return (
      <div className="window-content flex-container-col" style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', boxSizing: 'border-box' }}>
        <div className="container panel glow" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--main-color-neon)', marginBottom: '20px' }}>MARS ROVER SETUP</h1>
          <p style={{ marginBottom: '10px' }}>Mission Duration (hours):</p>
          <input 
            type="number" 
            min="24"
            value={timeLimitHours} 
            onChange={(e) => setTimeLimitHours(Math.max(24, parseInt(e.target.value) || 24))}
            style={{ 
              background: 'var(--main-color-transparent-bg)', border: '1px solid var(--main-color)', color: 'var(--main-color-neon)', 
              padding: '10px', width: '100%', marginBottom: '20px', fontFamily: 'DSEG14Classic', fontSize: '20px', boxSizing: 'border-box'
            }}
          />
          <button 
            onClick={() => { setHasStarted(true); setIsRunning(true); }}
            style={{ 
              background: 'var(--main-color-transparent)', border: '1px solid var(--main-color-neon)', color: '#fff', 
              padding: '15px 30px', cursor: 'pointer', fontFamily: 'Conthrax', fontWeight: 'bold', width: '100%', boxShadow: '0 0 10px var(--main-color)'
            }}
          >
            LAUNCH ROVER
          </button>
        </div>
      </div>
    )
  }

  // MAIN DASHBOARD LAYOUT
  return (
    <div className="window-content flex-container-col" style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* ORIGINAL JS DAY/NIGHT CYCLE CONTROLLED BY REACT */}
      <div 
        ref={wrapperRef}
        className="day-night-visualization-wrapper" 
        style={{ zIndex: 0, position: 'absolute', top: '0', left: '0', width: '100%', height: '50%', pointerEvents: 'none' }}
      >
          <div 
            ref={visRef}
            className="day-night-visualization" 
            style={{ position: 'absolute', width: '100%', height: '200%', pointerEvents: 'none', clipPath: 'inset(0 0 50% 0)' }}
          >
            <div ref={sunRef} className="sun" style={{ position: 'absolute' }}></div>
            <div ref={moonRef} className="moon" style={{ position: 'absolute' }}></div>
          </div>
      </div>

      {/* Top Status Bar */}
      <div className="container panel" style={{ position: 'relative', zIndex: 10, padding: '10px 20px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
         <div className="glow" style={{ fontSize: '18px' }}>
            STATUS: <span style={{ color: 'var(--main-color-neon)' }}>{status.toUpperCase()}</span>
         </div>
         <div>
            <button 
              onClick={() => setIsRunning(!isRunning)}
              disabled={status === 'Finished' || status === 'Dead Battery' || timeTicks >= timeLimitHours * 2}
              style={{ background: isRunning ? 'rgba(255,0,0,0.3)' : 'var(--main-color-transparent)', border: `1px solid ${isRunning ? 'red' : 'var(--main-color)'}`, color: 'white', padding: '8px 20px', fontFamily: 'Conthrax', cursor: 'pointer' }}
            >
              {isRunning ? 'PAUSE SIM' : 'START SIM'}
            </button>
         </div>
      </div>

      {/* Map & Logs Section */}
      <div className="flex-container-row map-section" style={{ position: 'relative', zIndex: 10, flex: 1, minHeight: 0 }}>
        <div className="flex-container-row">
          <div className="dash-item-sidebar">
            <div className="vertical-bar-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'var(--main-bg-color)' }}>
              <div className="vertical-bar" style={{ height: `${battery}%`, transition: 'height 0.2s linear', backgroundColor: battery <= 20 ? 'red' : 'var(--border-color)' }}>{battery}%</div>
            </div>
          </div>
        </div>
        
        {/* Responsive Aspect-Ratio Map Container */}
        <div 
          className="map-container" 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            overflow: 'hidden', 
            flex: 2, 
            height: '100%', 
            padding: '10px', 
            boxSizing: 'border-box' 
          }}
        >
          {/* This inner wrapper forces the map to be a perfect square that shrinks/grows to the screen height! */}
          <div style={{ height: '100%', maxHeight: '100%', aspectRatio: '1 / 1', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <MarsMap grid={grid} roverPos={roverPos} />
          </div>
        </div>

        <div className="flex-container-col" style={{ flex: 1, marginLeft: '15px' }}>
          <div className="dash-item-sidebar" style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
             <div className="glow" style={{ fontSize: '14px', marginBottom: '10px', borderBottom: '1px solid var(--main-color-transparent)', paddingBottom: '5px' }}>SYSTEM LOGS</div>
             <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--main-color-neon)', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
               {logs.map((log, i) => <div key={i}>{log}</div>)}
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Dashboard / Telemetry Section */}
      <div className="container" style={{ position: 'relative', zIndex: 10, marginTop: '15px', flexShrink: 0 }}>
        <div className="panel" style={{ padding: '15px' }}>
          <div className="dashboard">
            <div className="dash-col">
              <div className="dash-item">
                 <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--main-color-transparent)' }}>Current speed:</p>
                 <p style={{ margin: 0 }}><span className="segment7">{currentSpeed}</span><span className="segment14" style={{ fontSize: '15px', marginLeft: '5px' }}>km/h</span></p>
              </div>
              <div className="dash-item" style={{ borderTop: '1px solid var(--main-color-transparent)', paddingTop: '10px' }}>
                 <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--main-color-transparent)' }}>Distance:</p>
                 <p style={{ margin: 0 }}><span className="segment7">{totalDistance}</span><span className="segment14" style={{ fontSize: '15px', marginLeft: '5px' }}>m</span></p>
              </div>
            </div>
            <div className="dash-col">
              <div className="dash-item">
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--main-color-transparent)' }}>Mission Time:</p>
                  <p style={{ margin: 0 }}>
                    <span className="segment7">{hours.toString().padStart(2, '0')}</span>
                    <span className="segment14" style={{ fontSize: '20px' }}>:</span>
                    <span className="segment7">{minutes}</span>
                  </p>
              </div>
            </div>
            <div className="dash-col">
               <div className="dash-item">
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--main-color-transparent)' }}>Minerals (B/Y/G):</p>
                  <p style={{ margin: 0, display: 'flex', gap: '15px' }}>
                    <span className="segment7" style={{ color: '#006eff', textShadow: '0 0 5px #006eff' }}>{inventory.B}</span> 
                    <span className="segment7" style={{ color: '#ffdd00', textShadow: '0 0 5px #ffdd00' }}>{inventory.Y}</span> 
                    <span className="segment7" style={{ color: '#00ff00', textShadow: '0 0 5px #00ff00' }}>{inventory.G}</span>
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}