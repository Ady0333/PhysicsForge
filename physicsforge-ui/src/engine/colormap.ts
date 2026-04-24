// Viridis colormap: maps normalized value [0,1] → [r,g,b]
const VIRIDIS: [number, number, number][] = [
  [0.267, 0.005, 0.329],
  [0.283, 0.141, 0.458],
  [0.253, 0.265, 0.530],
  [0.207, 0.372, 0.553],
  [0.164, 0.471, 0.558],
  [0.128, 0.567, 0.551],
  [0.135, 0.659, 0.518],
  [0.267, 0.749, 0.441],
  [0.478, 0.821, 0.318],
  [0.741, 0.873, 0.150],
  [0.993, 0.906, 0.144],
]

export function viridis(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t))
  const scaled  = clamped * (VIRIDIS.length - 1)
  const lo      = Math.floor(scaled)
  const hi      = Math.min(lo + 1, VIRIDIS.length - 1)
  const frac    = scaled - lo
  return [
    VIRIDIS[lo][0] + frac * (VIRIDIS[hi][0] - VIRIDIS[lo][0]),
    VIRIDIS[lo][1] + frac * (VIRIDIS[hi][1] - VIRIDIS[lo][1]),
    VIRIDIS[lo][2] + frac * (VIRIDIS[hi][2] - VIRIDIS[lo][2]),
  ]
}

/** Convert flat grid [0..1] floats → Float32Array of RGB for Three.js */
export function gridToColors(grid: number[]): Float32Array {
  const colors = new Float32Array(grid.length * 3)
  for (let i = 0; i < grid.length; i++) {
    const [r, g, b] = viridis(grid[i])
    colors[i * 3 + 0] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }
  return colors
}