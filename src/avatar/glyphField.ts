/**
 * Pure glyph-field state: which glyph each cell shows, how rain columns advance,
 * and how a luminance grid becomes per-cell brightness. Browser-free so every
 * rule is unit-testable; the canvas work lives in MatrixAvatar.
 */

export const GLYPH_CHARSET = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ΛΣΞΨΦ<>+=*'

export const BRIGHTNESS_TIERS = [
  '#0a2f18',
  '#0f5426',
  '#17853a',
  '#22b552',
  '#43e07c',
  '#8effb0',
  '#eafff2',
] as const

export const LUMINANCE_FLOOR = 0.055
export const CHURN_RATE_PER_SECOND = 2.4 // expected glyph swaps per cell per minute ≈ 4%/frame at 60fps
const BREATH_HZ = 0.22
const BREATH_DEPTH = 0.07
const WAVE_SPEED = 0.13 // full sweeps per second
const WAVE_WIDTH = 0.045
const WAVE_GAIN = 0.14

export type Rng = () => number

export type RainColumn = {
  head: number // in rows, can be negative while waiting to enter
  speed: number // rows per second
  trail: number // rows of fading tail
}

export type GlyphFieldState = {
  cols: number
  rows: number
  glyphs: Uint8Array
  backRain: RainColumn[]
  frontRain: RainColumn[]
  elapsed: number
}

function spawnColumn(rows: number, rng: Rng): RainColumn {
  return {
    head: -rng() * rows * 1.5,
    speed: rows * (0.12 + rng() * 0.22),
    trail: 4 + Math.floor(rng() * 10),
  }
}

export function createGlyphFieldState(cols: number, rows: number, rng: Rng): GlyphFieldState {
  const glyphs = new Uint8Array(cols * rows)
  for (let i = 0; i < glyphs.length; i += 1) glyphs[i] = Math.floor(rng() * GLYPH_CHARSET.length)
  const backRain = Array.from({ length: cols }, () => spawnColumn(rows, rng))
  const frontRain = Array.from({ length: Math.ceil(cols / 5) }, () => spawnColumn(rows, rng))
  return { cols, rows, glyphs, backRain, frontRain, elapsed: 0 }
}

function advanceRain(columns: RainColumn[], rows: number, dt: number, rng: Rng) {
  for (const column of columns) {
    column.head += column.speed * dt
    if (column.head - column.trail > rows) {
      const next = spawnColumn(rows, rng)
      column.head = next.head
      column.speed = next.speed
      column.trail = next.trail
    }
  }
}

export function advanceGlyphField(state: GlyphFieldState, dt: number, rng: Rng): void {
  state.elapsed += dt
  const swapProbability = Math.min(1, CHURN_RATE_PER_SECOND * dt)
  for (let i = 0; i < state.glyphs.length; i += 1) {
    if (rng() < swapProbability) state.glyphs[i] = Math.floor(rng() * GLYPH_CHARSET.length)
  }
  advanceRain(state.backRain, state.rows, dt, rng)
  advanceRain(state.frontRain, state.rows, dt, rng)
}

/** Breathing multiplier — the figure's global luminous inhale/exhale. */
export function breathAt(elapsed: number): number {
  return 1 + BREATH_DEPTH * Math.sin(elapsed * 2 * Math.PI * BREATH_HZ)
}

/** A soft brightness band that drifts down the figure, like a scanline of life. */
export function waveBoostAt(rowNormalized: number, elapsed: number): number {
  const phase = (elapsed * WAVE_SPEED) % 1
  const distance = Math.abs(rowNormalized - phase)
  const wrapped = Math.min(distance, 1 - distance)
  return WAVE_GAIN * Math.exp(-(wrapped * wrapped) / (2 * WAVE_WIDTH * WAVE_WIDTH))
}

/**
 * Sobel gradient magnitude over the luminance grid, normalized 0..1.
 * Edges are where the hologram's rim light lives.
 */
export function computeEdgeMap(luminance: Float32Array, cols: number, rows: number): Float32Array {
  const edges = new Float32Array(cols * rows)
  const at = (col: number, row: number) => {
    const c = Math.min(cols - 1, Math.max(0, col))
    const r = Math.min(rows - 1, Math.max(0, row))
    return luminance[r * cols + c]
  }
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const gx =
        -at(col - 1, row - 1) - 2 * at(col - 1, row) - at(col - 1, row + 1) +
        at(col + 1, row - 1) + 2 * at(col + 1, row) + at(col + 1, row + 1)
      const gy =
        -at(col - 1, row - 1) - 2 * at(col, row - 1) - at(col + 1, row - 1) +
        at(col - 1, row + 1) + 2 * at(col, row + 1) + at(col + 1, row + 1)
      edges[row * cols + col] = Math.min(1, Math.hypot(gx, gy) / 2)
    }
  }
  return edges
}

/**
 * Final per-cell brightness 0..1 for a figure cell: shaped luminance, breathing,
 * the traveling wave, and the Sobel rim boost. Below the floor → 0 (cell empty).
 */
export function cellBrightness(
  luminance: number,
  edge: number,
  rowNormalized: number,
  elapsed: number,
): number {
  if (luminance < LUMINANCE_FLOOR && edge < 0.32) return 0
  const shaped = Math.pow(luminance, 0.85)
  const value = shaped * (0.62 + 0.38 * breathAt(elapsed)) + waveBoostAt(rowNormalized, elapsed) * shaped + edge * 0.8
  return Math.min(1, value)
}

/** Map a 0..1 brightness onto a tier index of the glyph atlas. */
export function brightnessTier(value: number, tierCount: number = BRIGHTNESS_TIERS.length): number {
  if (value <= 0) return -1
  return Math.min(tierCount - 1, Math.floor(value * tierCount))
}
