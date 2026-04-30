import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { GameScene } from './components/GameScene'
import { MODULES } from './modules/moduleDefinitions'
import './App.css'

const TIER_COLOR = {
  small:  '#06ffa5',
  medium: '#ffbe0b',
  large:  '#ff006e',
}

export default function App() {
  const [score, setScore] = useState(0)
  const [height, setHeight] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  const [popKey, setPopKey] = useState(0)
  const [currentModule, setCurrentModule] = useState(MODULES[0])
  const [finalHeight, setFinalHeight] = useState(0)
  const compassRef = useRef(null)
  const compassFillRef = useRef(null)

  const handleGameOver = useCallback(() => {
    setFinalHeight(h => h)
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

  // Aim is in [-1, 1]. Updates DOM directly (avoids re-rendering React on every frame).
  const handleAim = useCallback((aim) => {
    if (compassRef.current) {
      compassRef.current.style.transform = `translateX(${aim * 50}%)`
      const centred = Math.abs(aim) < 0.08
      compassRef.current.style.background = centred ? '#06ffa5' : '#ffbe0b'
      compassRef.current.style.boxShadow = centred
        ? '0 0 22px #06ffa5cc'
        : '0 0 12px #ffbe0b88'
    }
    if (compassFillRef.current) {
      const centred = Math.abs(aim) < 0.08
      compassFillRef.current.style.opacity = centred ? '1' : '0.35'
    }
  }, [])

  const restart = useCallback(() => {
    setScore(0)
    setHeight(0)
    setFinalHeight(0)
    setGameOver(false)
    setCurrentModule(MODULES[0])
    setGameKey(k => k + 1)
  }, [])

  const tierColor = TIER_COLOR[currentModule.tier] || '#fff'
  const displayHeight = height.toFixed(1)

  // HUD slides up as the tower grows so it never blocks the action.
  // Caps at -180px once the stack is past ~14m.
  const hudShift = Math.min(height * 12, 180)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>

      {!gameOver && (
        <div
          key={popKey}
          className="score-pop"
          style={{
            position: 'absolute', top: 20, left: '50%',
            transform: `translate(-50%, -${hudShift}px)`,
            transition: 'transform 0.4s cubic-bezier(.2,.7,.2,1)',
            zIndex: 10, textAlign: 'center',
            pointerEvents: 'none', fontFamily: 'monospace', userSelect: 'none',
          }}
        >
          <div style={{ color: '#f72585', fontSize: 52, fontWeight: 900, textShadow: '0 2px 20px #000d', lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ color: '#444', fontSize: 10, letterSpacing: 4, marginTop: 2 }}>
            MODULES STACKED
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
            <span style={{ color: '#22c55e', fontSize: 22, fontWeight: 700 }}>{displayHeight}</span>
            <span style={{ color: '#166534', fontSize: 11, letterSpacing: 2 }}>m HIGH</span>
          </div>

          <div style={{
            marginTop: 12,
            border: `1px solid ${tierColor}55`,
            background: '#0009',
            padding: '5px 14px',
            display: 'inline-block',
          }}>
            <div style={{ color: '#444', fontSize: 9, letterSpacing: 3, marginBottom: 2 }}>NEXT MODULE</div>
            <div style={{ color: tierColor, fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
              {currentModule.name}
            </div>
            <div style={{ color: '#666', fontSize: 8, letterSpacing: 2, marginTop: 2 }}>
              {currentModule.tier.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Drop-aim compass — bottom-centre, turns green when over the centre line */}
      {!gameOver && (
        <div style={{
          position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, width: 320, fontFamily: 'monospace', userSelect: 'none',
          pointerEvents: 'none',
        }}>
          <div style={{
            color: '#888', fontSize: 9, letterSpacing: 4, textAlign: 'center', marginBottom: 6,
          }}>
            DROP AIM
          </div>
          <div style={{
            position: 'relative', height: 12,
            background: '#0008',
            border: '1px solid #ffffff22',
            borderRadius: 8,
            overflow: 'visible',
          }}>
            {/* centre target zone */}
            <div ref={compassFillRef} style={{
              position: 'absolute', left: '50%', top: -2, width: 18, height: 16,
              transform: 'translateX(-50%)',
              background: '#06ffa522',
              border: '1px solid #06ffa566',
              borderRadius: 4,
              transition: 'opacity 0.15s',
            }} />
            {/* tick marks */}
            {[-0.66, -0.33, 0.33, 0.66].map(t => (
              <div key={t} style={{
                position: 'absolute', left: `${50 + t * 50}%`, top: 3, width: 1, height: 6,
                background: '#ffffff33',
              }} />
            ))}
            {/* indicator */}
            <div ref={compassRef} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 14, height: 14,
              marginLeft: -7, marginTop: -7,
              background: '#ffbe0b',
              border: '2px solid #000',
              borderRadius: '50%',
              transition: 'background 0.1s, box-shadow 0.1s',
              willChange: 'transform',
            }} />
          </div>
          <div style={{
            color: '#444', fontSize: 8, letterSpacing: 3, textAlign: 'center', marginTop: 6,
          }}>
            SPACE TO DROP
          </div>
        </div>
      )}

      {gameOver && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(50,8,40,0.94) 100%)',
          fontFamily: 'monospace', userSelect: 'none',
        }}>
          <div style={{
            width: '100%', height: 10, marginBottom: 44,
            background: 'repeating-linear-gradient(90deg, #f72585 0px, #f72585 22px, #111 22px, #111 44px)',
          }} />

          <div style={{ color: '#f72585', fontSize: 13, letterSpacing: 6, marginBottom: 16 }}>
            ⚠ STRUCTURE FAILURE ⚠
          </div>

          <div style={{ color: '#fff', fontSize: 76, fontWeight: 900, lineHeight: 1, textShadow: '0 4px 32px #f7258577' }}>
            {score}
          </div>
          <div style={{ color: '#666', fontSize: 11, letterSpacing: 3, marginTop: 6 }}>
            MODULES STACKED
          </div>

          <div style={{ marginTop: 16, marginBottom: 48, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ color: '#22c55e', fontSize: 32, fontWeight: 700 }}>{finalHeight.toFixed(1)}</span>
            <span style={{ color: '#166534', fontSize: 13, letterSpacing: 2 }}>METRES TALL</span>
          </div>

          <button
            onClick={restart}
            style={{
              background: '#f72585', color: '#000', border: 'none',
              padding: '14px 52px', fontSize: 15, fontWeight: 900,
              fontFamily: 'monospace', letterSpacing: 4, cursor: 'pointer',
              textTransform: 'uppercase', transition: 'background 0.15s',
              boxShadow: '0 4px 28px #f7258544',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ff4081'}
            onMouseLeave={e => e.currentTarget.style.background = '#f72585'}
          >
            REBUILD
          </button>
          <div style={{ color: '#444', fontSize: 11, letterSpacing: 3, marginTop: 14 }}>OR PRESS SPACE</div>

          <div style={{
            width: '100%', height: 10, marginTop: 44,
            background: 'repeating-linear-gradient(90deg, #f72585 0px, #f72585 22px, #111 22px, #111 44px)',
          }} />
        </div>
      )}

      {gameOver && <SpaceToRestart onRestart={restart} />}

      <Canvas
        shadows
        camera={{ position: [0, 7, 14], fov: 55 }}
        style={{ background: 'linear-gradient(to bottom, #0a0820 0%, #2a0838 100%)' }}
      >
        <GameScene
          key={gameKey}
          onScoreChange={handleScoreChange}
          onGameOver={handleGameOver}
          onModuleChange={setCurrentModule}
          onHeightChange={handleHeightChange}
          onAim={handleAim}
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
