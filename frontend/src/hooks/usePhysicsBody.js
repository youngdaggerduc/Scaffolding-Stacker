import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWorld } from '../physics/PhysicsProvider'

export function usePhysicsBody(createBody) {
  const world = useWorld()
  const meshRef = useRef()
  const bodyRef = useRef()

  useEffect(() => {
    const body = createBody()
    world.addBody(body)
    bodyRef.current = body
    return () => world.removeBody(body)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (meshRef.current && bodyRef.current) {
      meshRef.current.position.copy(bodyRef.current.position)
      meshRef.current.quaternion.copy(bodyRef.current.quaternion)
    }
  })

  return { meshRef, bodyRef }
}
