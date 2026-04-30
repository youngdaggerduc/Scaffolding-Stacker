export const SWING_AMPLITUDE = 3.5
export const SWING_HEIGHT_OFFSET = 5.5

export const PIECE_TYPES = [
  {
    id: 'standard',
    label: 'STANDARD',
    // Vertical tube — adds real height
    height: 1.8,
    radius: 0.065,
    // Physics box (wider than visual for stable contact surface)
    physBox: [0.18, 1.8, 0.18],
    color: '#9aa3ab',
    roughness: 0.25,
    metalness: 0.85,
  },
  {
    id: 'ledger',
    label: 'LEDGER',
    // Horizontal tube — lies along X axis, connects standards
    length: 2.6,
    radius: 0.055,
    physBox: [2.6, 0.13, 0.13],
    color: '#7a8295',
    roughness: 0.3,
    metalness: 0.8,
  },
  {
    id: 'platform',
    label: 'PLATFORM',
    size: [2.4, 0.22, 0.85],
    physBox: [2.4, 0.22, 0.85],
    color: '#f97316',
    roughness: 0.5,
    metalness: 0.35,
  },
]

// Vertical extent of the piece when locked in its canonical orientation
export function getPieceHeight(pt) {
  if (pt.id === 'standard') return pt.height
  if (pt.id === 'ledger')   return pt.radius * 2
  return pt.size[1]
}

export function randomPieceType(score) {
  // Standards are the backbone — always common
  // Ledgers increase slightly with score (harder to time on a tall stack)
  const ledgerChance = Math.min(0.22 + score * 0.01, 0.35)
  const weights = [1 - ledgerChance - 0.2, ledgerChance, 0.2]
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]
    if (r < acc) return PIECE_TYPES[i]
  }
  return PIECE_TYPES[0]
}
