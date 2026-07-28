import type { SceneConfig, SceneLayer } from '../scene'
import { defaultScene, validateScene } from '../scene'

export const LAYER_TYPES: readonly SceneLayer['type'][] = ['portrait', 'code-rain', 'particles', 'lighting']

function generateId(prefix: string, existingIds: ReadonlySet<string>): string {
  let index = 1
  let id = `${prefix}-${index}`
  while (existingIds.has(id)) {
    index += 1
    id = `${prefix}-${index}`
  }
  return id
}

export function createLayer(type: SceneLayer['type'], existingLayers: readonly SceneLayer[]): SceneLayer {
  const id = generateId(type, new Set(existingLayers.map((layer) => layer.id)))
  switch (type) {
    case 'portrait':
      return { id, type, opacity: 1 }
    case 'code-rain':
      return { id, type, opacity: 0.38, density: 0.4 }
    case 'particles':
      return { id, type, opacity: 0.5, count: 40 }
    case 'lighting':
      return { id, type, opacity: 0.6, intensity: 0.7 }
  }
}

export function removeLayer(layers: readonly SceneLayer[], id: string): readonly SceneLayer[] {
  return layers.filter((layer) => layer.id !== id)
}

export function moveLayer(layers: readonly SceneLayer[], id: string, direction: 'up' | 'down'): readonly SceneLayer[] {
  const index = layers.findIndex((layer) => layer.id === id)
  if (index === -1) return layers
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= layers.length) return layers
  const next = layers.slice()
  const [moved] = next.splice(index, 1)
  next.splice(targetIndex, 0, moved)
  return next
}

export function reorderLayers(
  layers: readonly SceneLayer[],
  draggedId: string,
  targetId: string,
): readonly SceneLayer[] {
  if (draggedId === targetId) return layers
  const dragged = layers.find((layer) => layer.id === draggedId)
  if (!dragged) return layers
  const withoutDragged = layers.filter((layer) => layer.id !== draggedId)
  const targetIndex = withoutDragged.findIndex((layer) => layer.id === targetId)
  if (targetIndex === -1) return layers
  const next = withoutDragged.slice()
  next.splice(targetIndex, 0, dragged)
  return next
}

export function createScene(existingScenes: readonly SceneConfig[]): SceneConfig {
  const id = generateId('scene', new Set(existingScenes.map((scene) => scene.id)))
  return { ...defaultScene, id, title: 'Untitled scene' }
}

export function duplicateScene(scene: SceneConfig, existingScenes: readonly SceneConfig[]): SceneConfig {
  const id = generateId(scene.id, new Set(existingScenes.map((existing) => existing.id)))
  return { ...scene, id, title: `${scene.title} (copy)` }
}

export type BuilderState = Readonly<{ scenes: readonly SceneConfig[]; activeId: string }>

const STORAGE_KEY = 'matrix-ai-ui:builder-state'

function initialState(): BuilderState {
  return { scenes: [defaultScene], activeId: defaultScene.id }
}

/**
 * Loads builder state from localStorage, validating every stored scene through
 * validateScene so corrupted or old-shape data (a previous schema version, manual
 * tampering, a different app using the same origin) can't crash the builder --
 * invalid scenes are silently dropped rather than surfaced, since there's no user
 * action to "fix" a bad localStorage entry from a prior session.
 */
export function loadBuilderState(): BuilderState {
  if (typeof window === 'undefined') return initialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as { scenes?: unknown }).scenes)) {
      return initialState()
    }
    const candidateScenes = (parsed as { scenes: unknown[] }).scenes
    const validated: SceneConfig[] = []
    for (const candidate of candidateScenes) {
      if (typeof candidate !== 'object' || candidate === null) continue
      const result = validateScene(candidate)
      if (result.ok) validated.push(result.value)
    }
    if (validated.length === 0) return initialState()
    const storedActiveId = (parsed as { activeId?: unknown }).activeId
    const activeId =
      typeof storedActiveId === 'string' && validated.some((scene) => scene.id === storedActiveId)
        ? storedActiveId
        : validated[0].id
    return { scenes: validated, activeId }
  } catch {
    return initialState()
  }
}

export function saveBuilderState(state: BuilderState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can fail (quota exceeded, privacy/incognito mode) -- the builder still
    // works in-memory for the rest of this session, it just won't persist.
  }
}
