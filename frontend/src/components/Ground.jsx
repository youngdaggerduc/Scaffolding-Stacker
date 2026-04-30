import { useEffect } from 'react'
import * as CANNON from 'cannon-es'
import { Grid } from '@react-three/drei'
import { useWorld } from '../physics/PhysicsProvider'

export function Ground() {
  const world = useWorld()

  useEffect(() => {
    const body = new CANNON.Body({ mass: 0 })
    body.addShape(new CANNON.Plane())
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(body)
    return () => world.removeBody(body)
  }, [world])

  return (
    <>
      {/* Base floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#222" roughness={0.95} />
      </mesh>

      {/* Construction-site grid overlay */}
      <Grid
        position={[0, 0.01, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#383838"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#f9731622"
        fadeDistance={40}
        fadeStrength={1.5}
        infiniteGrid={false}
      />
    </>
  )
}
