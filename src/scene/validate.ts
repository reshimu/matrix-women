import type { SceneConfig, SceneInput, SceneLayer } from './types'
import { normalizeScene } from './types'

export type SceneValidationResult =
  | Readonly<{ ok: true; value: SceneConfig }>
  | Readonly<{ ok: false; issues: readonly string[] }>

const layerTypes = new Set<SceneLayer['type']>(['portrait', 'code-rain', 'particles', 'lighting'])

export function validateScene(input: SceneInput): SceneValidationResult {
  const scene = normalizeScene(input)
  const issues: string[] = []
  if (!scene.id.trim()) issues.push('Scene id must not be empty.')
  if (!scene.title.trim()) issues.push('Scene title must not be empty.')
  if (new Set(scene.layers.map((layer) => layer.id)).size !== scene.layers.length) issues.push('Layer ids must be unique.')
  for (const layer of scene.layers) {
    if (!layer.id.trim()) issues.push('Layer id must not be empty.')
    if (!layerTypes.has(layer.type)) issues.push(`Unsupported layer type: ${layer.type}.`)
    if (layer.opacity < 0 || layer.opacity > 1) issues.push(`Layer ${layer.id} opacity must be between 0 and 1.`)
    if ('density' in layer && (layer.density < 0 || layer.density > 1)) issues.push(`Layer ${layer.id} density must be between 0 and 1.`)
    if ('intensity' in layer && (layer.intensity < 0 || layer.intensity > 1)) issues.push(`Layer ${layer.id} intensity must be between 0 and 1.`)
    if ('count' in layer && (!Number.isInteger(layer.count) || layer.count < 0 || layer.count > 200)) issues.push(`Layer ${layer.id} count must be an integer from 0 to 200.`)
  }
  return issues.length ? { ok: false, issues } : { ok: true, value: scene }
}