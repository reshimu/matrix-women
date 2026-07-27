import { describe, expect, it } from 'vitest'
import { normalizeScene } from '../scene'
import { deriveWebglUniforms } from './webglUniforms'

describe('deriveWebglUniforms', () => {
  it('derives uniforms from the default scene layers', () => {
    const scene = normalizeScene({})
    const uniforms = deriveWebglUniforms(scene)
    expect(uniforms.glowIntensity).toBeCloseTo(0.7 * 0.6)
    expect(uniforms.rainDensity).toBeCloseTo(0.4 * 0.38)
    expect(uniforms.portraitOpacity).toBe(1)
    expect(uniforms.sparkle).toBe(0)
  })

  it('zeroes a uniform when its matching effect flag is disabled, even though the layer is configured', () => {
    const scene = normalizeScene({ effects: { glow: false, codeRain: false } })
    expect(deriveWebglUniforms(scene)).toEqual({
      glowIntensity: 0,
      rainDensity: 0,
      portraitOpacity: 1,
      sparkle: 0,
    })
  })

  it('derives sparkle from a particles layer scaled by count and opacity', () => {
    const scene = normalizeScene({
      layers: [
        { id: 'subject', type: 'portrait', opacity: 1 },
        { id: 'dust', type: 'particles', opacity: 0.5, count: 100 },
      ],
    })
    expect(deriveWebglUniforms(scene).sparkle).toBeCloseTo(0.25)
  })

  it('caps sparkle at 1 for particle counts above 200', () => {
    const scene = normalizeScene({
      layers: [
        { id: 'subject', type: 'portrait', opacity: 1 },
        { id: 'dust', type: 'particles', opacity: 1, count: 200 },
      ],
    })
    expect(deriveWebglUniforms(scene).sparkle).toBe(1)
  })
})
