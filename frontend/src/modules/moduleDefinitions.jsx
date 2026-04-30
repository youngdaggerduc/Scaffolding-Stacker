import { Fragment } from 'react'

// Brainrot palette — saturated, clashing colours used across modules
export const CHAOS_COLORS = [
  '#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff',
  '#06ffa5', '#ff4081', '#00d9ff', '#ff9f1c', '#e63946',
  '#9d4edd', '#f72585', '#7209b7', '#48cae4', '#ff5400',
  '#39ff14', '#ff10f0', '#fdf500', '#00ffe7', '#ff3131',
]

export function pickChaosColors(n) {
  const pool = [...CHAOS_COLORS].sort(() => Math.random() - 0.5)
  return pool.slice(0, n)
}

// ─── building-block primitives ──────────────────────────────────────────────

const FRAME_R = 0.06

function Pole({ x = 0, y = 0, z = 0, height, color }) {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <cylinderGeometry args={[FRAME_R, FRAME_R, height, 8]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
    </mesh>
  )
}

function Beam({ from, to, color, r = FRAME_R * 0.85 }) {
  const [x1, y1, z1] = from
  const [x2, y2, z2] = to
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, cz = (z1 + z2) / 2
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
  // align cylinder (default Y) with the beam vector
  const ax = dx / len, ay = dy / len, az = dz / len
  const yaw = Math.atan2(ax, az)
  const pitch = -Math.asin(ay)
  return (
    <mesh position={[cx, cy, cz]} rotation={[pitch, yaw, 0]} castShadow>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
    </mesh>
  )
}

function Plank({ x = 0, y, z = 0, w, d, color }) {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.08, d]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
    </mesh>
  )
}

function Box3D({ x = 0, y, z = 0, size, color, rough = 0.5, metal = 0.4 }) {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  )
}

function Cyl({ x = 0, y, z = 0, r, h, color, rotation = [0, 0, 0] }) {
  return (
    <mesh position={[x, y, z]} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, 16]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
    </mesh>
  )
}

function Sphere({ x = 0, y, z = 0, r, color }) {
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <sphereGeometry args={[r, 14, 12]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </mesh>
  )
}

// Frame helper: 4 corner poles + top platform + side cross braces
function HFrame({ w, h, d, frameColor, deckColor, braceColor }) {
  const hw = w / 2 - FRAME_R, hd = d / 2 - FRAME_R
  const yMid = 0
  const yBot = -h / 2, yTop = h / 2
  return (
    <Fragment>
      {/* 4 corner poles */}
      {[[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].map(([x, z], i) => (
        <Pole key={`p${i}`} x={x} y={yMid} z={z} height={h} color={frameColor} />
      ))}
      {/* top deck */}
      <Plank y={yTop - 0.04} w={w} d={d} color={deckColor} />
      {/* side ledgers (top and bottom rim, front + back) */}
      <Beam from={[-hw, yTop - 0.1, hd]} to={[hw, yTop - 0.1, hd]} color={braceColor} />
      <Beam from={[-hw, yTop - 0.1, -hd]} to={[hw, yTop - 0.1, -hd]} color={braceColor} />
      <Beam from={[-hw, yBot + 0.1, hd]} to={[hw, yBot + 0.1, hd]} color={braceColor} />
      <Beam from={[-hw, yBot + 0.1, -hd]} to={[hw, yBot + 0.1, -hd]} color={braceColor} />
      {/* X cross braces on front face */}
      <Beam from={[-hw, yBot + 0.1, hd]} to={[hw, yTop - 0.1, hd]} color={braceColor} />
      <Beam from={[hw, yBot + 0.1, hd]} to={[-hw, yTop - 0.1, hd]} color={braceColor} />
      {/* X cross braces on back face */}
      <Beam from={[-hw, yBot + 0.1, -hd]} to={[hw, yTop - 0.1, -hd]} color={braceColor} />
      <Beam from={[hw, yBot + 0.1, -hd]} to={[-hw, yTop - 0.1, -hd]} color={braceColor} />
    </Fragment>
  )
}

// ─── Module definitions ─────────────────────────────────────────────────────
//
// Each module:
//   id, name           — identity / HUD label
//   bounds [w, h, d]   — physics AABB (also defines stacking surface)
//   massScale          — multiplier on base mass (size will also influence)
//   weight             — selection probability weight
//   tier               — 'small' | 'medium' | 'large' (drives feedback)
//   build(colors)      — returns JSX of the module visual centred at origin
//
// Visual primitives are placed relative to the module's bounding box centre,
// so the body's position lines up with the visual centroid. Some modules
// (HANGING_WEIGHT, SIDE_HOUSE) intentionally render visual flair OUTSIDE the
// bounds — purely cosmetic; the physics box stays clean for stable stacking.

export const MODULES = [
  {
    id: 'narrow_tower',
    name: 'NARROW TOWER',
    bounds: [1.6, 2.4, 1.6],
    massScale: 1.0,
    weight: 1.2,
    tier: 'medium',
    colorRoles: 3,
    build: ([c1, c2, c3]) => (
      <HFrame w={1.6} h={2.4} d={1.6} frameColor={c1} deckColor={c2} braceColor={c3} />
    ),
  },
  {
    id: 'wide_platform',
    name: 'WIDE PLATFORM',
    bounds: [3.4, 1.0, 1.8],
    massScale: 1.4,
    weight: 1.0,
    tier: 'large',
    colorRoles: 3,
    build: ([c1, c2, c3]) => (
      <HFrame w={3.4} h={1.0} d={1.8} frameColor={c1} deckColor={c2} braceColor={c3} />
    ),
  },
  {
    id: 'double_frame',
    name: 'DOUBLE FRAME',
    bounds: [2.8, 1.8, 1.4],
    massScale: 1.2,
    weight: 1.0,
    tier: 'medium',
    colorRoles: 4,
    build: ([c1, c2, c3, c4]) => (
      <Fragment>
        <group position={[-0.7, 0, 0]}>
          <HFrame w={1.4} h={1.8} d={1.4} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        <group position={[0.7, 0, 0]}>
          <HFrame w={1.4} h={1.8} d={1.4} frameColor={c4} deckColor={c2} braceColor={c3} />
        </group>
        <Beam from={[-0.7, 0, 0]} to={[0.7, 0, 0]} color={c3} />
      </Fragment>
    ),
  },
  {
    id: 'offset_platform',
    name: 'OFFSET DECK',
    bounds: [2.6, 1.4, 1.6],
    massScale: 1.1,
    weight: 0.9,
    tier: 'medium',
    colorRoles: 3,
    build: ([c1, c2, c3]) => (
      <Fragment>
        {/* base frame on the right */}
        <group position={[0.55, 0, 0]}>
          <HFrame w={1.5} h={1.4} d={1.6} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        {/* cantilevered plank to the left */}
        <Plank x={-0.7} y={0.66} w={1.6} d={1.4} color={c2} />
        <Beam from={[-1.4, 0.6, 0.6]} to={[-0.05, 0.66, 0.6]} color={c3} />
        <Beam from={[-1.4, 0.6, -0.6]} to={[-0.05, 0.66, -0.6]} color={c3} />
      </Fragment>
    ),
  },
  {
    id: 'cross_braced',
    name: 'X-FRAME',
    bounds: [2.0, 2.6, 1.4],
    massScale: 1.05,
    weight: 1.0,
    tier: 'medium',
    colorRoles: 3,
    build: ([c1, c2, c3]) => (
      <HFrame w={2.0} h={2.6} d={1.4} frameColor={c1} deckColor={c2} braceColor={c3} />
    ),
  },
  {
    id: 'tiny_house',
    name: 'TINY HOUSE',
    bounds: [2.2, 2.0, 1.8],
    massScale: 1.15,
    weight: 0.7,
    tier: 'medium',
    colorRoles: 5,
    build: ([c1, c2, c3, c4, c5]) => (
      <Fragment>
        {/* scaffold base, ~half height */}
        <group position={[0, -0.4, 0]}>
          <HFrame w={2.2} h={1.2} d={1.8} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        {/* house walls on top of deck */}
        <Box3D y={0.55} size={[1.4, 0.8, 1.2]} color={c4} rough={0.7} />
        {/* roof — pyramid out of two stretched boxes */}
        <mesh position={[0, 1.05, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[1.0, 0.7, 4]} />
          <meshStandardMaterial color={c5} metalness={0.3} roughness={0.6} />
        </mesh>
        {/* tiny window */}
        <Box3D y={0.55} z={0.61} size={[0.35, 0.35, 0.02]} color="#fff" metal={0.1} />
      </Fragment>
    ),
  },
  {
    id: 'water_tank',
    name: 'WATER TANK',
    bounds: [2.0, 2.4, 2.0],
    massScale: 1.5,
    weight: 0.7,
    tier: 'medium',
    colorRoles: 4,
    build: ([c1, c2, c3, c4]) => (
      <Fragment>
        <group position={[0, -0.5, 0]}>
          <HFrame w={2.0} h={1.4} d={2.0} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        {/* tank cylinder */}
        <Cyl y={0.65} r={0.7} h={1.0} color={c4} />
        {/* tank cap */}
        <Cyl y={1.2} r={0.3} h={0.15} color={c3} />
      </Fragment>
    ),
  },
  {
    id: 'hanging_weight',
    name: 'HANG LOAD',
    bounds: [2.4, 1.6, 1.4],
    massScale: 1.2,
    weight: 0.7,
    tier: 'medium',
    colorRoles: 4,
    massOffset: [0.5, 0],   // shift centre of mass to one side
    build: ([c1, c2, c3, c4]) => (
      <Fragment>
        <HFrame w={2.4} h={1.6} d={1.4} frameColor={c1} deckColor={c2} braceColor={c3} />
        {/* arm sticking out the right */}
        <Beam from={[1.2, 0.5, 0]} to={[2.0, 0.5, 0]} color={c3} />
        <Beam from={[2.0, 0.5, 0]} to={[2.0, -0.2, 0]} color={c3} />
        <Sphere x={2.0} y={-0.45} r={0.28} color={c4} />
      </Fragment>
    ),
  },
  {
    id: 'staircase',
    name: 'STAIRCASE',
    bounds: [2.4, 1.8, 1.4],
    massScale: 1.2,
    weight: 0.8,
    tier: 'medium',
    colorRoles: 3,
    build: ([c1, c2, c3]) => (
      <Fragment>
        {/* frame underneath */}
        <group position={[0, -0.1, 0]}>
          <HFrame w={2.4} h={1.6} d={1.4} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        {/* stepped boxes */}
        {[0, 1, 2, 3].map(i => (
          <Box3D
            key={i}
            x={-0.9 + i * 0.6}
            y={0.78 + i * 0.18}
            size={[0.55, 0.18, 1.2]}
            color={i % 2 ? c2 : c3}
          />
        ))}
      </Fragment>
    ),
  },
  {
    id: 'l_shape',
    name: 'L-FRAME',
    bounds: [2.6, 1.6, 2.6],
    massScale: 1.25,
    weight: 0.7,
    tier: 'large',
    colorRoles: 3,
    massOffset: [-0.4, -0.4],
    build: ([c1, c2, c3]) => (
      <Fragment>
        <group position={[-0.55, 0, 0.55]}>
          <HFrame w={1.5} h={1.6} d={1.5} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        <group position={[0.55, 0, -0.55]}>
          <HFrame w={1.5} h={1.6} d={1.5} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
      </Fragment>
    ),
  },
  {
    id: 'mega_wide',
    name: 'MEGA DECK',
    bounds: [4.4, 0.9, 1.8],
    massScale: 1.7,
    weight: 0.6,
    tier: 'large',
    colorRoles: 3,
    build: ([c1, c2, c3]) => (
      <HFrame w={4.4} h={0.9} d={1.8} frameColor={c1} deckColor={c2} braceColor={c3} />
    ),
  },
  {
    id: 'twin_towers',
    name: 'TWIN TOWERS',
    bounds: [3.0, 2.6, 1.4],
    massScale: 1.3,
    weight: 0.7,
    tier: 'large',
    colorRoles: 4,
    build: ([c1, c2, c3, c4]) => (
      <Fragment>
        <group position={[-0.85, 0, 0]}>
          <HFrame w={1.2} h={2.6} d={1.4} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        <group position={[0.85, 0, 0]}>
          <HFrame w={1.2} h={2.6} d={1.4} frameColor={c4} deckColor={c2} braceColor={c3} />
        </group>
        {/* connecting bridge */}
        <Plank y={0.4} w={1.7} d={0.8} color={c2} />
      </Fragment>
    ),
  },
  {
    id: 'chimney',
    name: 'CHIMNEY',
    bounds: [1.8, 2.6, 1.8],
    massScale: 1.15,
    weight: 0.6,
    tier: 'medium',
    colorRoles: 4,
    build: ([c1, c2, c3, c4]) => (
      <Fragment>
        <group position={[0, -0.45, 0]}>
          <HFrame w={1.8} h={1.6} d={1.8} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        <Box3D y={0.7} size={[0.55, 1.1, 0.55]} color={c4} rough={0.85} metal={0.1} />
        <Box3D y={1.3} size={[0.65, 0.12, 0.65]} color="#222" rough={0.95} metal={0} />
      </Fragment>
    ),
  },
  {
    id: 'flag_pole',
    name: 'FLAG POST',
    bounds: [1.8, 2.0, 1.8],
    massScale: 1.0,
    weight: 0.7,
    tier: 'medium',
    colorRoles: 4,
    build: ([c1, c2, c3, c4]) => (
      <Fragment>
        <HFrame w={1.8} h={2.0} d={1.8} frameColor={c1} deckColor={c2} braceColor={c3} />
        {/* flag pole sticks up beyond the bounds (visual only) */}
        <Pole y={1.3} height={1.6} color="#ddd" />
        <Box3D x={0.45} y={1.7} size={[0.9, 0.5, 0.02]} color={c4} metal={0.1} rough={0.8} />
      </Fragment>
    ),
  },
  {
    id: 'crate_stack',
    name: 'CRATE STACK',
    bounds: [2.2, 1.8, 1.6],
    massScale: 1.2,
    weight: 0.9,
    tier: 'medium',
    colorRoles: 5,
    build: ([c1, c2, c3, c4, c5]) => (
      <Fragment>
        <group position={[0, -0.35, 0]}>
          <HFrame w={2.2} h={1.1} d={1.6} frameColor={c1} deckColor={c2} braceColor={c3} />
        </group>
        <Box3D x={-0.55} y={0.55} size={[0.7, 0.7, 0.7]} color={c4} rough={0.75} metal={0.1} />
        <Box3D x={0.4} y={0.45} size={[0.55, 0.55, 0.55]} color={c5} rough={0.75} metal={0.1} />
        <Box3D x={0.4} y={0.95} size={[0.45, 0.45, 0.45]} color={c4} rough={0.75} metal={0.1} />
      </Fragment>
    ),
  },
]

// Selection with anti-repeat: returns a new module, biased away from `lastId`.
// Uses each module's `weight` for distribution.
export function pickModule(lastId) {
  const adjusted = MODULES.map(m => ({
    m,
    w: m.id === lastId ? m.weight * 0.25 : m.weight,
  }))
  const total = adjusted.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * total
  for (const { m, w } of adjusted) {
    r -= w
    if (r <= 0) return m
  }
  return MODULES[0]
}

// Vertical extent used for stack-top tracking
export function getModuleHeight(mod) {
  return mod.bounds[1]
}

// Mass scales with bounding-box volume × explicit massScale.
export function getModuleMass(mod) {
  const [w, h, d] = mod.bounds
  const vol = w * h * d
  return Math.max(0.6, vol * 0.18) * mod.massScale
}
