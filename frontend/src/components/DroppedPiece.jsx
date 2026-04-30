import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as CANNON from 'cannon-es'
import { useWorld } from '../physics/PhysicsProvider'
import { ScaffoldModule } from './ScaffoldModule'
import { getModuleMass } from '../modules/moduleDefinitions'

function createBody(mod, position) {
  const [bw, bh, bd] = mod.bounds
  const mass = getModuleMass(mod)

  const body = new CANNON.Body({
    mass,
    linearDamping: 0.2,
    angularDamping: 0.85,
    allowSleep: true,
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 0.5,
  })

  // shapeOffset shifts centre of mass for "uneven" modules
  const offset = mod.massOffset
    ? new CANNON.Vec3(mod.massOffset[0], 0, mod.massOffset[1] || 0)
    : new CANNON.Vec3(0, 0, 0)
  body.addShape(new CANNON.Box(new CANNON.Vec3(bw / 2, bh / 2, bd / 2)), offset)
  body.position.set(position.x, position.y, position.z)

  // Subtle spawn tilt — small enough that wide modules still seat reliably
  const tiltX = (Math.random() - 0.5) * 0.05
  const tiltZ = (Math.random() - 0.5) * 0.05
  body.quaternion.setFromEuler(tiltX, 0, tiltZ)

  // Lock yaw spin; allow gentle pitch/roll so towers can tip when overloaded
  body.angularFactor.set(1, 0, 1)

  return body
}

export function DroppedPiece({ position, module: mod, colors, onSettle, onLanded }) {
  const world = useWorld()
  const groupRef = useRef()
  const bodyRef = useRef()
  const settled = useRef(false)
  const settleTimer = useRef(0)
  const scalePunch = useRef(0)
  const contactApplied = useRef(false)
  const onSettleRef = useRef(onSettle)
  const onLandedRef = useRef(onLanded)
  useEffect(() => { onSettleRef.current = onSettle }, [onSettle])
  useEffect(() => { onLandedRef.current = onLanded }, [onLanded])

  useEffect(() => {
    const body = createBody(mod, position)

    const onContact = () => {
      if (contactApplied.current) return
      contactApplied.current = true
      // Tiny lateral nudge proportional to mass — heavier pieces shake more
      const nudge = 0.08
      body.velocity.x += (Math.random() - 0.5) * nudge
      body.velocity.z += (Math.random() - 0.5) * nudge * 0.6
      body.angularVelocity.x += (Math.random() - 0.5) * 0.15
      body.angularVelocity.z += (Math.random() - 0.5) * 0.15
      // Notify the scene so it can shake the camera proportional to mass
      onLandedRef.current?.(mod, body.mass)
    }

    body.addEventListener('collide', onContact)
    world.addBody(body)
    bodyRef.current = body
    return () => {
      body.removeEventListener('collide', onContact)
      world.removeBody(body)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const body = bodyRef.current
    const group = groupRef.current
    if (!body || !group) return

    group.position.copy(body.position)
    group.quaternion.copy(body.quaternion)

    if (scalePunch.current > 0) {
      scalePunch.current = Math.max(0, scalePunch.current - delta * 4)
      const s = 1 + Math.sin(scalePunch.current * Math.PI) * 0.08
      group.scale.setScalar(s)
    }

    if (settled.current) return

    const hasDropped = body.position.y < position.y - 0.4
    const isCalm =
      body.velocity.length() < 0.3 &&
      body.angularVelocity.length() < 0.5

    if (hasDropped && isCalm) {
      settleTimer.current += delta
      if (settleTimer.current > 0.4) {
        settled.current = true
        scalePunch.current = 1
        onSettleRef.current?.({
          x: body.position.x,
          y: body.position.y,
          z: body.position.z,
        })
      }
    } else {
      settleTimer.current = 0
    }
  })

  return (
    <group ref={groupRef}>
      <ScaffoldModule module={mod} colors={colors} />
    </group>
  )
}
