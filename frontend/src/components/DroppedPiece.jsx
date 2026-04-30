import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as CANNON from 'cannon-es'
import { useWorld } from '../physics/PhysicsProvider'
import { PieceMesh } from './PieceMesh'

function createBody(pieceType, position) {
  const [bw, bh, bd] = pieceType.physBox

  const body = new CANNON.Body({
    mass: 1,
    linearDamping: 0.08,   // snappy drop, minimal air resistance
    angularDamping: 1.0,   // redundant safety — angularFactor handles this
    allowSleep: true,
    sleepSpeedLimit: 0.08,
    sleepTimeLimit: 0.4,
  })

  body.addShape(new CANNON.Box(new CANNON.Vec3(bw / 2, bh / 2, bd / 2)))
  body.position.set(position.x, position.y, position.z)

  // Lock ALL rotation — orientation is set once at spawn and never changes
  body.angularFactor.set(0, 0, 0)

  return body
}

export function DroppedPiece({ position, pieceType, onSettle }) {
  const world = useWorld()
  const groupRef = useRef()
  const bodyRef = useRef()
  const settled = useRef(false)
  const settleTimer = useRef(0)
  const scalePunch = useRef(0)
  const onSettleRef = useRef(onSettle)
  useEffect(() => { onSettleRef.current = onSettle }, [onSettle])

  useEffect(() => {
    const body = createBody(pieceType, position)
    world.addBody(body)
    bodyRef.current = body
    return () => world.removeBody(body)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const body = bodyRef.current
    const group = groupRef.current
    if (!body || !group) return

    // Only sync position — rotation is locked so quaternion never changes
    group.position.copy(body.position)

    if (scalePunch.current > 0) {
      scalePunch.current = Math.max(0, scalePunch.current - delta * 4)
      const s = 1 + Math.sin(scalePunch.current * Math.PI) * 0.1
      group.scale.setScalar(s)
    }

    if (settled.current) return

    const hasDropped = body.position.y < position.y - 0.4
    const isCalm = body.velocity.length() < 0.25  // pieces settle faster with no spin

    if (hasDropped && isCalm) {
      settleTimer.current += delta
      if (settleTimer.current > 0.3) {
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
      <PieceMesh pieceType={pieceType} />
    </group>
  )
}
