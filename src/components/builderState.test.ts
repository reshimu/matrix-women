// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultScene } from '../scene'
import {
  createLayer,
  createScene,
  duplicateScene,
  loadBuilderState,
  moveLayer,
  reorderLayers,
  removeLayer,
  saveBuilderState,
} from './builderState'

describe('createLayer', () => {
  it('creates a layer of the requested type with valid defaults', () => {
    expect(createLayer('particles', defaultScene.layers)).toEqual({
      id: 'particles-1',
      type: 'particles',
      opacity: 0.5,
      count: 40,
    })
  })

  it('avoids id collisions with existing layers', () => {
    const layers = [...defaultScene.layers, { id: 'particles-1', type: 'particles' as const, opacity: 0.5, count: 10 }]
    expect(createLayer('particles', layers).id).toBe('particles-2')
  })
})

describe('removeLayer', () => {
  it('removes only the matching layer', () => {
    const result = removeLayer(defaultScene.layers, 'matrix-rain')
    expect(result.map((layer) => layer.id)).toEqual(['subject', 'ambient-light'])
  })

  it('is a no-op if the id is not found', () => {
    expect(removeLayer(defaultScene.layers, 'missing')).toEqual(defaultScene.layers)
  })
})

describe('moveLayer', () => {
  it('moves a layer up one position', () => {
    const result = moveLayer(defaultScene.layers, 'matrix-rain', 'up')
    expect(result.map((layer) => layer.id)).toEqual(['matrix-rain', 'subject', 'ambient-light'])
  })

  it('moves a layer down one position', () => {
    const result = moveLayer(defaultScene.layers, 'matrix-rain', 'down')
    expect(result.map((layer) => layer.id)).toEqual(['subject', 'ambient-light', 'matrix-rain'])
  })

  it('is a no-op at the start/end boundary', () => {
    expect(moveLayer(defaultScene.layers, 'subject', 'up')).toEqual(defaultScene.layers)
    expect(moveLayer(defaultScene.layers, 'ambient-light', 'down')).toEqual(defaultScene.layers)
  })
})

describe('reorderLayers', () => {
  it('moves the dragged layer to just before the target', () => {
    const result = reorderLayers(defaultScene.layers, 'ambient-light', 'subject')
    expect(result.map((layer) => layer.id)).toEqual(['ambient-light', 'subject', 'matrix-rain'])
  })

  it('is a no-op if dragged and target are the same', () => {
    expect(reorderLayers(defaultScene.layers, 'subject', 'subject')).toEqual(defaultScene.layers)
  })

  it('is a no-op if either id is not found', () => {
    expect(reorderLayers(defaultScene.layers, 'missing', 'subject')).toEqual(defaultScene.layers)
    expect(reorderLayers(defaultScene.layers, 'subject', 'missing')).toEqual(defaultScene.layers)
  })
})

describe('createScene / duplicateScene', () => {
  it('creates a new scene with a unique id and an untitled label', () => {
    const scene = createScene([defaultScene])
    expect(scene.id).toBe('scene-1')
    expect(scene.title).toBe('Untitled scene')
  })

  it('avoids id collisions when creating repeatedly', () => {
    const first = createScene([defaultScene])
    const second = createScene([defaultScene, first])
    expect(second.id).not.toBe(first.id)
  })

  it('duplicates a scene with a derived id and a "(copy)" title', () => {
    const copy = duplicateScene(defaultScene, [defaultScene])
    expect(copy.id).not.toBe(defaultScene.id)
    expect(copy.title).toBe(`${defaultScene.title} (copy)`)
    expect(copy.layers).toEqual(defaultScene.layers)
  })
})

describe('loadBuilderState / saveBuilderState', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('returns the default scene when nothing is stored', () => {
    const state = loadBuilderState()
    expect(state.scenes).toEqual([defaultScene])
    expect(state.activeId).toBe(defaultScene.id)
  })

  it('round-trips a saved state exactly', () => {
    const customScene = { ...defaultScene, id: 'custom', title: 'Custom scene' }
    saveBuilderState({ scenes: [defaultScene, customScene], activeId: 'custom' })

    const loaded = loadBuilderState()
    expect(loaded.activeId).toBe('custom')
    expect(loaded.scenes).toEqual([defaultScene, customScene])
  })

  it('falls back to the default scene when stored JSON is corrupted', () => {
    window.localStorage.setItem('matrix-ai-ui:builder-state', '{not valid json')
    const state = loadBuilderState()
    expect(state.scenes).toEqual([defaultScene])
  })

  it('drops invalid stored scenes rather than crashing', () => {
    window.localStorage.setItem(
      'matrix-ai-ui:builder-state',
      JSON.stringify({ scenes: [{ id: '', title: '' }], activeId: '' }),
    )
    const state = loadBuilderState()
    expect(state.scenes).toEqual([defaultScene])
  })

  it('falls back to the first scene if the stored activeId no longer exists', () => {
    saveBuilderState({ scenes: [defaultScene], activeId: 'nonexistent' })
    const state = loadBuilderState()
    expect(state.activeId).toBe(defaultScene.id)
  })
})
