import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { SWING_AMPLITUDE } from '../constants'
import { PieceMesh } from './PieceMesh'

export function SwingingPiece({ height, speed, pieceType, positionRef }) {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    const x = Math.sin(clock.elapsedTime * speed) * SWING_AMPLITUDE
    if (groupRef.current) groupRef.current.position.set(x, height, 0)
    if (positionRef) positionRef.current = { x, y: height, z: 0 }
  })

  return (
    <group ref={groupRef}>
      <PieceMesh pieceType={pieceType} />
    </group>
  )
}
