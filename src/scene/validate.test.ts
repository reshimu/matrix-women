import { describe, expect, it } from 'vitest'
import { validateScene } from './validate'

describe('validateScene', () => {
  it('accepts the normalized default scene', () => {
    expect(validateScene({}).ok).toBe(true)
  })

  it('reports deterministic layer validation errors', () => {
    expect(validateScene({
      layers: [
        { id: 'rain', type: 'code-rain', opacity: 2, density: 1.5 },
        { id: 'rain', type: 'particles', opacity: 1, count: 201 },
      ],
    })).toEqual({
      ok: false,
      issues: [
        'Layer ids must be unique.',
        'Layer rain opacity must be between 0 and 1.',
        'Layer rain density must be between 0 and 1.',
        'Layer rain count must be an integer from 0 to 200.',
      ],
    })
  })
})