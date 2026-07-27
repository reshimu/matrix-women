import { describe, expect, it } from 'vitest'
import { defaultScene, normalizeScene } from './types'

describe('normalizeScene', () => {
  it('fills omitted values from the renderer-independent defaults', () => {
    expect(normalizeScene({ id: 'night-shift', effects: { particles: false } })).toEqual({
      ...defaultScene,
      id: 'night-shift',
      effects: { codeRain: true, particles: false, glow: true },
    })
  })
})
