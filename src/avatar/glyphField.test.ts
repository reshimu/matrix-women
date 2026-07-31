import { describe, expect, it } from 'vitest'
import {
  BRIGHTNESS_TIERS,
  GLYPH_CHARSET,
  LUMINANCE_FLOOR,
  advanceGlyphField,
  breathAt,
  brightnessTier,
  cellBrightness,
  computeEdgeMap,
  createGlyphFieldState,
  waveBoostAt,
} from './glyphField'

function fixedRng(value: number) {
  return () => value
}

function sequenceRng(values: number[]) {
  let index = 0
  return () => {
    const value = values[index % values.length]
    index += 1
    return value
  }
}

describe('createGlyphFieldState', () => {
  it('fills every cell with a glyph index inside the charset', () => {
    const state = createGlyphFieldState(8, 6, sequenceRng([0, 0.25, 0.5, 0.75, 0.999]))
    expect(state.glyphs.length).toBe(48)
    for (const glyph of state.glyphs) {
      expect(glyph).toBeGreaterThanOrEqual(0)
      expect(glyph).toBeLessThan(GLYPH_CHARSET.length)
    }
  })

  it('spawns one back-rain column per grid column and sparser front rain', () => {
    const state = createGlyphFieldState(20, 30, fixedRng(0.5))
    expect(state.backRain.length).toBe(20)
    expect(state.frontRain.length).toBe(4)
  })
})

describe('advanceGlyphField', () => {
  it('advances rain heads by speed × dt', () => {
    const state = createGlyphFieldState(4, 40, fixedRng(0.5))
    const before = state.backRain.map((column) => column.head)
    advanceGlyphField(state, 0.5, fixedRng(0.99))
    state.backRain.forEach((column, i) => {
      expect(column.head).toBeCloseTo(before[i] + column.speed * 0.5, 5)
    })
  })

  it('churns glyphs when the rng fires and leaves them when it does not', () => {
    const still = createGlyphFieldState(6, 6, fixedRng(0.4))
    const frozen = Array.from(still.glyphs)
    advanceGlyphField(still, 0.016, fixedRng(0.99)) // 0.99 > swap probability → no swaps
    expect(Array.from(still.glyphs)).toEqual(frozen)

    const churning = createGlyphFieldState(6, 6, fixedRng(0.4))
    advanceGlyphField(churning, 0.016, sequenceRng([0, 0.7])) // rng 0 < probability → swap, to glyph 0.7×len
    const expected = Math.floor(0.7 * GLYPH_CHARSET.length)
    expect(churning.glyphs[0]).toBe(expected)
  })

  it('recycles a rain column that scrolled past the bottom', () => {
    const state = createGlyphFieldState(1, 10, fixedRng(0.5))
    state.backRain[0].head = 40
    state.backRain[0].trail = 2
    advanceGlyphField(state, 0.016, fixedRng(0.2))
    expect(state.backRain[0].head).toBeLessThan(0)
  })

  it('accumulates elapsed time', () => {
    const state = createGlyphFieldState(2, 2, fixedRng(0.5))
    advanceGlyphField(state, 0.25, fixedRng(0.99))
    advanceGlyphField(state, 0.25, fixedRng(0.99))
    expect(state.elapsed).toBeCloseTo(0.5)
  })
})

describe('breathing and wave', () => {
  it('breathAt oscillates around 1', () => {
    expect(breathAt(0)).toBeCloseTo(1)
    let min = Infinity
    let max = -Infinity
    for (let t = 0; t < 6; t += 0.05) {
      const value = breathAt(t)
      min = Math.min(min, value)
      max = Math.max(max, value)
    }
    expect(min).toBeLessThan(0.95)
    expect(max).toBeGreaterThan(1.05)
  })

  it('waveBoostAt peaks where the wave currently is and wraps around', () => {
    const atPeak = waveBoostAt(0, 0)
    const offPeak = waveBoostAt(0.5, 0)
    expect(atPeak).toBeGreaterThan(offPeak)
    expect(waveBoostAt(0.999, 0)).toBeGreaterThan(offPeak) // wrap: 0.999 is near phase 0
  })
})

describe('computeEdgeMap', () => {
  it('marks a hard vertical boundary as an edge and flat regions as none', () => {
    const cols = 6
    const rows = 4
    const luminance = new Float32Array(cols * rows)
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        luminance[row * cols + col] = col < 3 ? 0 : 1
      }
    }
    const edges = computeEdgeMap(luminance, cols, rows)
    expect(edges[1 * cols + 0]).toBe(0) // deep in the dark half
    expect(edges[1 * cols + 5]).toBe(0) // deep in the lit half
    expect(edges[1 * cols + 2]).toBeGreaterThan(0.5) // at the boundary
    expect(edges[1 * cols + 3]).toBeGreaterThan(0.5)
  })
})

describe('cellBrightness and tiers', () => {
  it('returns 0 below the luminance floor unless a strong edge rescues it', () => {
    expect(cellBrightness(LUMINANCE_FLOOR / 2, 0, 0.5, 0)).toBe(0)
    expect(cellBrightness(LUMINANCE_FLOOR / 2, 0.6, 0.5, 0)).toBeGreaterThan(0)
  })

  it('clamps to 1 and maps monotonically onto atlas tiers', () => {
    expect(cellBrightness(1, 1, 0.5, 0)).toBe(1)
    expect(brightnessTier(0)).toBe(-1)
    expect(brightnessTier(0.01)).toBe(0)
    expect(brightnessTier(1)).toBe(BRIGHTNESS_TIERS.length - 1)
    let previous = -1
    for (let value = 0.01; value <= 1; value += 0.01) {
      const tier = brightnessTier(value)
      expect(tier).toBeGreaterThanOrEqual(previous)
      previous = tier
    }
  })
})
