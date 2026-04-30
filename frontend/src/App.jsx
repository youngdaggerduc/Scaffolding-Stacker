import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { GameScene } from './components/GameScene'
import { PIECE_TYPES } from './constants'
import './App.css'

export default function App() {
  const [score, setScore] = useState(0)
  const [height, setHeight] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  const [popKey, setPopKey] = useState(0)
  const [pieceType, setPieceType] = useState(PIECE_TYPES[0])
  const [finalHeight, setFinalHeight] = useState(0)

  const handleGameOver = useCallback(() => {
    setFinalHeight(h => h)  // snapshot already set via onHeightChange
    setGameOver(true)
  }, [])

  const handleScoreChange = useCallback((next) => {
    setScore(next)
    setPopKey(k => k + 1)
  }, [])

  const handleHeightChange = useCallback((h) => {
    setHeight(h)
    setFinalHeight(h)
  }, [])

  const restart = useCallback(() => {
    setScore(0)
    setHeight(0)
    setFinalHeight(0)
    setGameOver(false)
    setPieceType(PIECE_TYPES[0])
    setGameKey(k => k + 1)
  }, [])

  const pieceColors = {
    board: '#c8913a',
    standard: '#9ca3af',
    platform: '#f97316',
  }

  const displayHeight = height.toFixed(1)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      {/* Score + height + piece type HUD */}
      {!gameOver && (
        <div
          key={popKey}
          className="score-pop"
          style={{
            position: 'absolute', top: 20, left: '50%',
            zIndex: 10, textAlign: 'center',
            pointerEvents: 'none', fontFamily: 'monospace', userSelect: 'none',
          }}
        >
          {/* Score */}
          <div style={{ color: '#f97316', fontSize: 52, fontWeight: 900, textShadow: '0 2px 20px #000d', lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ color: '#444', fontSize: 10, letterSpacing: 4, marginTop: 2 }}>
            PIECES PLACED
          </div>

          {/* Height meter */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
            <span style={{ color: '#22c55e', fontSize: 22, fontWeight: 700 }}>{displayHeight}</span>
            <span style={{ color: '#166534', fontSize: 11, letterSpacing: 2 }}>m HIGH</span>
          </div>

          {/* Piece type indicator */}
          <div style={{
            marginTop: 12,
            border: `1px solid ${pieceColors[pieceType.id]}33`,
            padding: '5px 14px',
            display: 'inline-block',
          }}>
            <div style={{ color: '#333', fontSize: 9, letterSpacing: 3, marginBottom: 2 }}>DROPPING</div>
            <div style={{ color: pieceColors[pieceType.id], fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
              {pieceType.label}
            </div>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(50,8,0,0.94) 100%)',
          fontFamily: 'monospace', userSelect: 'none',
        }}>
          <div style={{
            width: '100%', height: 10, marginBottom: 44,
            background: 'repeating-linear-gradient(90deg, #f97316 0px, #f97316 22px, #111 22px, #111 44px)',
          }} />

          <div style={{ color: '#f97316', fontSize: 13, letterSpacing: 6, marginBottom: 16 }}>
            ⚠ STRUCTURE FAILURE ⚠
          </div>

          <div style={{ color: '#fff', fontSize: 76, fontWeight: 900, lineHeight: 1, textShadow: '0 4px 32px #f9731677' }}>
            {score}
          </div>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 3, marginTop: 6 }}>
            PIECES PLACED
          </div>

          {/* Height stat on game over */}
          <div style={{ marginTop: 16, marginBottom: 48, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ color: '#22c55e', fontSize: 32, fontWeight: 700 }}>{finalHeight.toFixed(1)}</span>
            <span style={{ color: '#166534', fontSize: 13, letterSpacing: 2 }}>METRES TALL</span>
          </div>

          <button
            onClick={restart}
            style={{
              background: '#f97316', color: '#000', border: 'none',
              padding: '14px 52px', fontSize: 15, fontWeight: 900,
              fontFamily: 'monospace', letterSpacing: 4, cursor: 'pointer',
              textTransform: 'uppercase', transition: 'background 0.15s',
              boxShadow: '0 4px 28px #f9731644',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fb923c'}
            onMouseLeave={e => e.currentTarget.style.background = '#f97316'}
          >
            REBUILD
          </button>
          <div style={{ color: '#444', fontSize: 11, letterSpacing: 3, marginTop: 14 }}>OR PRESS SPACE</div>

          <div style={{
            width: '100%', height: 10, marginTop: 44,
            background: 'repeating-linear-gradient(90deg, #f97316 0px, #f97316 22px, #111 22px, #111 44px)',
          }} />
        </div>
      )}

      {gameOver && <SpaceToRestart onRestart={restart} />}

      <Canvas
        shadows
        camera={{ position: [0, 7, 14], fov: 55 }}
        style={{ background: 'linear-gradient(to bottom, #080810 0%, #1c1308 100%)' }}
      >
        <GameScene
          key={gameKey}
          onScoreChange={handleScoreChange}
          onGameOver={handleGameOver}
          onPieceTypeChange={setPieceType}
          onHeightChange={handleHeightChange}
        />
      </Canvas>
    </div>
  )
}

function SpaceToRestart({ onRestart }) {
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); onRestart() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onRestart])
  return null
}
