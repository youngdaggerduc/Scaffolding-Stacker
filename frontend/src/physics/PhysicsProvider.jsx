import { createContext, useContext, useRef } from 'react'
import * as CANNON from 'cannon-es'
import { useFrame } from '@react-three/fiber'

const PhysicsContext = createContext(null)

export function PhysicsProvider({ children }) {
  const worldRef = useRef(null)

  if (!worldRef.current) {
    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)
    // SAPBroadphase is far more stable for stacking than NaiveBroadphase
    world.broadphase = new CANNON.SAPBroadphase(world)
    world.allowSleep = true
    // More iterations = better contact resolution for tall stacks
    world.solver.iterations = 20
    world.solver.tolerance = 0.001
    // High friction keeps pieces from sliding off each other; minimal bounce
    world.defaultContactMaterial.friction = 0.7
    world.defaultContactMaterial.restitution = 0.05
    worldRef.current = world
  }

  useFrame((_, delta) => {
    worldRef.current.step(1 / 60, Math.min(delta, 0.1), 3)
  })

  return (
    <PhysicsContext.Provider value={worldRef.current}>
      {children}
    </PhysicsContext.Provider>
  )
}

export const useWorld = () => useContext(PhysicsContext)
