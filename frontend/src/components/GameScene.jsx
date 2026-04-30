import { useState, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { PhysicsProvider } from '../physics/PhysicsProvider'
import { Ground } from './Ground'
import { SwingingPiece } from './SwingingPiece'
import { DroppedPiece } from './DroppedPiece'
import { CameraRig } from './CameraRig'
import { ScaffoldFrame } from './ScaffoldFrame'
import { SWING_HEIGHT_OFFSET, SWING_AMPLITUDE } from '../constants'
import { MODULES, pickModule, pickChaosColors, getModuleHeight } from '../modules/moduleDefinitions'

let nextId = 0

// Polls the swing position ref each frame and reports it as a [-1, 1] aim ratio.
// Lives inside <Canvas> so it can use useFrame; results go up via callback.
function AimReporter({ swingPositionRef, onAim }) {
  useFrame(() => {
    const x = swingPositionRef.current?.x ?? 0
    onAim(Math.max(-1, Math.min(1, x / SWING_AMPLITUDE)))
  })
  return null
}

export function GameScene({
  onScoreChange, onGameOver, onModuleChange, onHeightChange, onAim,
}) {
  const [pieces, setPieces] = useState([])
  const [phase, setPhase] = useState('swinging')
  const [stackTopY, setStackTopY] = useState(0)
  const [score, setScore] = useState(0)
  const [nextModule, setNextModule] = useState(() => MODULES[0])
  const [nextColors, setNextColors] = useState(() => pickChaosColors(MODULES[0].colorRoles))
  const [shakeImpulse, setShakeImpulse] = useState(0)

  const swingPositionRef = useRef({ x: 0, y: 0, z: 0 })
  const phaseRef = useRef('swinging')
  const scoreRef = useRef(0)
  const stackTopRef = useRef(0)
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { stackTopRef.current = stackTopY }, [stackTopY])

  const swingSpeed = 1.0 + score * 0.04
  const swingHeight = stackTopY + SWING_HEIGHT_OFFSET + getModuleHeight(nextModule) / 2

  useEffect(() => { onModuleChange?.(nextModule) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      if (phaseRef.current !== 'swinging') return

      const spawnPos = { ...swingPositionRef.current }
      const id = nextId++
      const mod = nextModule
      const colors = nextColors
      const upcomingMod = pickModule(mod.id)
      const upcomingColors = pickChaosColors(upcomingMod.colorRoles)
      setNextModule(upcomingMod)
      setNextColors(upcomingColors)
      onModuleChange?.(upcomingMod)
      setPieces(prev => [...prev, { id, spawnPos, mod, colors }])
      setPhase('falling')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextModule, nextColors]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettle = (finalPos, mod) => {
    const pieceH = getModuleHeight(mod)
    const currentTop = stackTopRef.current
    const stackExists = currentTop > 0.3
    const fellOff = stackExists && finalPos.y < currentTop - pieceH * 0.6 - 0.5

    if (fellOff) {
      setPhase('gameover')
      onGameOver?.()
      return
    }

    const newTopY = finalPos.y + pieceH / 2
    setStackTopY(prev => {
      const next = Math.max(prev, newTopY)
      onHeightChange?.(next)
      return next
    })
    setScore(prev => {
      const next = prev + 1
      onScoreChange?.(next)
      return next
    })
    setPhase('swinging')
  }

  const handleLanded = (mod, mass) => {
    setShakeImpulse(Math.min(1.5, mass * 0.35))
  }

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 20, 8]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={40}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[-8, 6, -6]} intensity={0.5} color="#ff66cc" />
      <pointLight position={[8, 4, 6]} intensity={0.4} color="#66ffe7" />

      <CameraRig
        targetY={stackTopY}
        stackHeight={stackTopY}
        isGameOver={phase === 'gameover'}
        impulse={shakeImpulse}
        onImpulseConsumed={() => setShakeImpulse(0)}
      />

      <ScaffoldFrame floorsBuilt={score} />

      <AimReporter swingPositionRef={swingPositionRef} onAim={onAim || (() => {})} />

      <PhysicsProvider>
        <Ground />

        {phase === 'swinging' && (
          <SwingingPiece
            height={swingHeight}
            speed={swingSpeed}
            module={nextModule}
            colors={nextColors}
            positionRef={swingPositionRef}
          />
        )}

        {pieces.map((p, i) => (
          <DroppedPiece
            key={p.id}
            position={p.spawnPos}
            module={p.mod}
            colors={p.colors}
            onLanded={handleLanded}
            onSettle={
              phase === 'falling' && i === pieces.length - 1
                ? (pos) => handleSettle(pos, p.mod)
                : undefined
            }
          />
        ))}
      </PhysicsProvider>
    </>
  )
}
