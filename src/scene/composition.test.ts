import { describe, expect, it } from 'vitest'
import { normalizeScene } from './types'
import { selectActiveLayers } from './composition'

describe('selectActiveLayers', () => {
  it('keeps the portrait layer and default-enabled effect layers for the default scene', () => {
    const scene = normalizeScene({})
    expect(selectActiveLayers(scene).map((layer) => layer.id)).toEqual([
      'subject',
      'matrix-rain',
      'ambient-light',
    ])
  })

  it('drops a layer whose matching effect flag is disabled, even though the layer is still configured', () => {
    const scene = normalizeScene({ effects: { codeRain: false, glow: false } })
    expect(selectActiveLayers(scene).map((layer) => layer.id)).toEqual(['subject'])
  })

  it('includes a particles layer only when effects.particles is enabled', () => {
    const withParticles = normalizeScene({
      layers: [{ id: 'subject', type: 'portrait', opacity: 1 }, { id: 'dust', type: 'particles', opacity: 0.5, count: 12 }],
    })
    expect(selectActiveLayers(withParticles).map((layer) => layer.id)).toEqual(['subject', 'dust'])

    const withoutParticles = normalizeScene({
      layers: [{ id: 'subject', type: 'portrait', opacity: 1 }, { id: 'dust', type: 'particles', opacity: 0.5, count: 12 }],
      effects: { particles: false },
    })
    expect(selectActiveLayers(withoutParticles).map((layer) => layer.id)).toEqual(['subject'])
  })

  it('never drops the portrait layer regardless of effect flags', () => {
    const scene = normalizeScene({ effects: { codeRain: false, particles: false, glow: false } })
    expect(selectActiveLayers(scene).map((layer) => layer.id)).toEqual(['subject'])
  })
})
