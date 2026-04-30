import { useMemo } from 'react'

const STEEL = '#7a8088'
const STEEL_DARK = '#555c63'
const WOOD = '#7a5820'
const POLE_R = 0.048
const FLOOR_H = 1.8      // matches roughly one piece + gap
const MAX_FLOORS = 22
const FRAME_H = MAX_FLOORS * FLOOR_H
const FRAME_Z = -4.5
// X positions of the four vertical standards
const STD_X = [-5.6, -2.8, 2.8, 5.6]

function Pole({ x, z, height }) {
  return (
    <mesh position={[x, height / 2, z]} castShadow>
      <cylinderGeometry args={[POLE_R, POLE_R, height, 7]} />
      <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.28} />
    </mesh>
  )
}

function Ledger({ x1, x2, y, z }) {
  const cx = (x1 + x2) / 2
  const len = Math.abs(x2 - x1)
  return (
    <mesh position={[cx, y, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[POLE_R * 0.8, POLE_R * 0.8, len, 6]} />
      <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.35} />
    </mesh>
  )
}

function Transom({ x, y, z1, z2 }) {
  const cz = (z1 + z2) / 2
  const len = Math.abs(z2 - z1)
  return (
    <mesh position={[x, y, cz]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[POLE_R * 0.75, POLE_R * 0.75, len, 6]} />
      <meshStandardMaterial color={STEEL_DARK} metalness={0.8} roughness={0.35} />
    </mesh>
  )
}

function DiagBrace({ x1, y1, x2, y2, z }) {
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const angle = -Math.atan2(dy, dx)
  return (
    <mesh position={[cx, cy, z]} rotation={[0, 0, angle]}>
      <boxGeometry args={[len, 0.04, 0.04]} />
      <meshStandardMaterial color={STEEL_DARK} metalness={0.75} roughness={0.45} />
    </mesh>
  )
}

function Board({ y, x1, x2, z }) {
  const cx = (x1 + x2) / 2
  const len = Math.abs(x2 - x1) - 0.1
  return (
    <mesh position={[cx, y + 0.025, z]} receiveShadow>
      <boxGeometry args={[len, 0.05, 0.55]} />
      <meshStandardMaterial color={WOOD} roughness={0.92} metalness={0} />
    </mesh>
  )
}

export function ScaffoldFrame({ floorsBuilt = 0 }) {
  // How many ledger rows are visible — always show 2 ahead of the stack
  const visibleFloors = Math.min(floorsBuilt + 3, MAX_FLOORS)

  const ledgerRows = useMemo(() => {
    const rows = []
    for (let f = 0; f <= visibleFloors; f++) {
      const y = f * FLOOR_H
      // Horizontal ledgers across the full width and between each pair
      for (let i = 0; i < STD_X.length - 1; i++) {
        rows.push({ key: `l-${f}-${i}`, x1: STD_X[i], x2: STD_X[i + 1], y })
      }
    }
    return rows
  }, [visibleFloors])

  const braces = useMemo(() => {
    const b = []
    for (let f = 0; f < visibleFloors; f++) {
      const y1 = f * FLOOR_H
      const y2 = (f + 1) * FLOOR_H
      // One diagonal per outer bay, alternating direction
      if (f % 2 === 0) {
        b.push({ key: `br-L-${f}`, x1: STD_X[0], y1, x2: STD_X[1], y2 })
        b.push({ key: `br-R-${f}`, x1: STD_X[2], y1, x2: STD_X[3], y2 })
      } else {
        b.push({ key: `br-L-${f}`, x1: STD_X[1], y1, x2: STD_X[0], y2 })
        b.push({ key: `br-R-${f}`, x1: STD_X[3], y1, x2: STD_X[2], y2 })
      }
    }
    return b
  }, [visibleFloors])

  const boards = useMemo(() => {
    const b = []
    for (let f = 1; f <= visibleFloors; f += 2) {
      const y = f * FLOOR_H
      b.push({ key: `bd-${f}`, y, x1: STD_X[0], x2: STD_X[3] })
    }
    return b
  }, [visibleFloors])

  return (
    <group>
      {/* Permanent vertical standards — always full height */}
      {STD_X.map(x => (
        <Pole key={`std-${x}`} x={x} z={FRAME_Z} height={FRAME_H} />
      ))}

      {/* Ledgers grow with score */}
      {ledgerRows.map(r => (
        <Ledger key={r.key} x1={r.x1} x2={r.x2} y={r.y} z={FRAME_Z} />
      ))}

      {/* Diagonal braces */}
      {braces.map(b => (
        <DiagBrace key={b.key} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} z={FRAME_Z} />
      ))}

      {/* Scaffold boards */}
      {boards.map(b => (
        <Board key={b.key} y={b.y} x1={b.x1} x2={b.x2} z={FRAME_Z} />
      ))}
    </group>
  )
}
