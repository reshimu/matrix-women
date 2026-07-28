import { describe, expect, it } from 'vitest'
import { defaultScene } from './types'
import { exportSceneConfig, importSceneConfig } from './roundTrip'

describe('exportSceneConfig / importSceneConfig round-trip', () => {
  it('reproduces an equivalent SceneConfig after exporting and re-importing', () => {
    const exported = exportSceneConfig(defaultScene)
    const result = importSceneConfig(exported)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(defaultScene)
  })

  it('round-trips a modified scene (different format, effects, layer values)', () => {
    const modified = {
      ...defaultScene,
      format: 'square' as const,
      effects: { codeRain: false, particles: true, glow: false },
      layers: [
        { id: 'subject', type: 'portrait' as const, opacity: 0.8 },
        { id: 'dust', type: 'particles' as const, opacity: 0.5, count: 40 },
      ],
    }
    const exported = exportSceneConfig(modified)
    const result = importSceneConfig(exported)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(modified)
  })

  it('reports invalid JSON as a validation issue instead of throwing', () => {
    const result = importSceneConfig('{not valid json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0]).toMatch(/invalid json/i)
  })

  it('rejects JSON that is not an object (array, string, number, null)', () => {
    for (const input of ['[1,2,3]', '"a string"', '42', 'null']) {
      const result = importSceneConfig(input)
      expect(result.ok).toBe(false)
    }
  })

  it('surfaces scene validation issues for structurally valid but semantically invalid JSON', () => {
    const result = importSceneConfig(JSON.stringify({ ...defaultScene, title: '' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.some((issue) => /title/i.test(issue))).toBe(true)
  })
})
