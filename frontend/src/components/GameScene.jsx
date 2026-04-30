import { useState, useRef, useEffect } from 'react'
import { PhysicsProvider } from '../physics/PhysicsProvider'
import { Ground } from './Ground'
import { SwingingPiece } from './SwingingPiece'
import { DroppedPiece } from './DroppedPiece'
import { CameraRig } from './CameraRig'
import { ScaffoldFrame } from './ScaffoldFrame'
import { SWING_HEIGHT_OFFSET, PIECE_TYPES, getPieceHeight, randomPieceType } from '../constants'

let nextId = 0

export function GameScene({ onScoreChange, onGameOver, onPieceTypeChange, onHeightChange }) {
  const [pieces, setPieces] = useState([])
  const [phase, setPhase] = useState('swinging')
  const [stackTopY, setStackTopY] = useState(0)
  const [score, setScore] = useState(0)
  const [nextPiece, setNextPiece] = useState(() => PIECE_TYPES[0])

  const swingPositionRef = useRef({ x: 0, y: 0, z: 0 })
  const phaseRef = useRef('swinging')
  const scoreRef = useRef(0)
  const stackTopRef = useRef(0)  // ref copy so settle callback is never stale
  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { stackTopRef.current = stackTopY }, [stackTopY])

  const swingSpeed = 1.2 + score * 0.06
  const swingHeight = stackTopY + SWING_HEIGHT_OFFSET

  useEffect(() => { onPieceTypeChange?.(nextPiece) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      if (phaseRef.current !== 'swinging') return

      const spawnPos = { ...swingPositionRef.current }
      const id = nextId++
      const pieceType = nextPiece
      const upcoming = randomPieceType(scoreRef.current)
      setNextPiece(upcoming)
      onPieceTypeChange?.(upcoming)
      setPieces(prev => [...prev, { id, spawnPos, pieceType }])
      setPhase('falling')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextPiece]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettle = (finalPos, pieceType) => {
    const pieceH = getPieceHeight(pieceType)
    const currentTop = stackTopRef.current

    // Fell off: piece settled more than 1.5m below the current stack top.
    // Works reliably for locked pieces since they can't tumble into odd positions.
    const stackExists = currentTop > 0.3
    const fellOff = stackExists && finalPos.y < currentTop - 1.5

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

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 8]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-8, 6, -6]} intensity={0.6} color="#ffaa44" />

      <CameraRig
        targetY={stackTopY}
        stackHeight={stackTopY}
        isGameOver={phase === 'gameover'}
      />

      <ScaffoldFrame floorsBuilt={score} />

      <PhysicsProvider>
        <Ground />

        {phase === 'swinging' && (
          <SwingingPiece
            height={swingHeight}
            speed={swingSpeed}
            pieceType={nextPiece}
            positionRef={swingPositionRef}
          />
        )}

        {pieces.map((p, i) => (
          <DroppedPiece
            key={p.id}
            position={p.spawnPos}
            pieceType={p.pieceType}
            onSettle={
              phase === 'falling' && i === pieces.length - 1
                ? (pos) => handleSettle(pos, p.pieceType)
                : undefined
            }
          />
        ))}
      </PhysicsProvider>
    </>
  )
}
