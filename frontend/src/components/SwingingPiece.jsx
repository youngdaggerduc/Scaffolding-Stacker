import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { SWING_AMPLITUDE } from '../constants'
import { ScaffoldModule } from './ScaffoldModule'

export function SwingingPiece({ height, speed, module: mod, colors, positionRef }) {
  const groupRef = useRef()
  const innerRef = useRef()

  useFrame(({ clock }) => {
    const e = clock.elapsedTime
    const t = e * speed
    const x = Math.sin(t) * SWING_AMPLITUDE
    // pendulum lean in direction of travel
    const tiltZ = Math.cos(t) * 0.08
    // gentle vertical bob and idle yaw — gives the module life
    const bob = Math.sin(e * 1.6) * 0.08
    const yaw = Math.sin(e * 0.7) * 0.18

    if (groupRef.current) {
      groupRef.current.position.set(x, height + bob, 0)
      groupRef.current.rotation.z = tiltZ
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = yaw
    }
    // expose actual visible position so the drop spawns where the player sees it
    if (positionRef) positionRef.current = { x, y: height + bob, z: 0 }
  })

  return (
    <group ref={groupRef}>
      <group ref={innerRef}>
        <ScaffoldModule module={mod} colors={colors} />
      </group>
    </group>
  )
}
