// Shared visual geometry for each piece type.
// All pieces render in their locked canonical orientation.

const STEEL_DARK = '#374151'
const STEEL_MID  = '#4b5563'

function StandardTube({ pt }) {
  const { radius, height } = pt
  const halfH    = height / 2
  const endCapR  = radius * 1.3
  const couplerR = radius * 1.55
  const couplerY = height * 0.2

  return (
    <>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 14]} />
        <meshStandardMaterial color={pt.color} metalness={pt.metalness} roughness={pt.roughness} />
      </mesh>
      {/* End caps */}
      {[halfH, -halfH].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[endCapR, endCapR, 0.045, 14]} />
          <meshStandardMaterial color={STEEL_MID} metalness={0.92} roughness={0.18} />
        </mesh>
      ))}
      {/* Coupler rings */}
      {[couplerY, -couplerY].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[couplerR, couplerR, 0.075, 14]} />
          <meshStandardMaterial color={STEEL_DARK} metalness={0.88} roughness={0.28} />
        </mesh>
      ))}
    </>
  )
}

function LedgerTube({ pt }) {
  // Horizontal tube lying along X axis
  const { radius, length } = pt
  const endCapR  = radius * 1.3
  const couplerR = radius * 1.5
  const halfL    = length / 2

  return (
    // Rotate cylinder 90° around Z so it lies along X
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshStandardMaterial color={pt.color} metalness={pt.metalness} roughness={pt.roughness} />
      </mesh>
      {/* End caps at each end (in rotated space, Y = half-length) */}
      {[halfL, -halfL].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[endCapR, endCapR, 0.04, 12]} />
          <meshStandardMaterial color={STEEL_MID} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* One coupler ring at the centre — where it would bolt to a standard */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[couplerR, couplerR, 0.07, 12]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.88} roughness={0.28} />
      </mesh>
    </group>
  )
}

function PlatformUnit({ pt }) {
  const [w, h, d] = pt.size
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={pt.size} />
        <meshStandardMaterial color={pt.color} roughness={pt.roughness} metalness={pt.metalness} />
      </mesh>
      {/* Raised edge rail */}
      <mesh position={[0, h / 2 + 0.025, 0]}>
        <boxGeometry args={[w - 0.1, 0.05, d - 0.1]} />
        <meshStandardMaterial color="#c2440f" roughness={0.4} metalness={0.6} wireframe />
      </mesh>
    </>
  )
}

export function PieceMesh({ pieceType }) {
  if (pieceType.id === 'standard') return <StandardTube pt={pieceType} />
  if (pieceType.id === 'ledger')   return <LedgerTube   pt={pieceType} />
  return <PlatformUnit pt={pieceType} />
}
