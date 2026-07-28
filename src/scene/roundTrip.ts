import type { SceneConfig, SceneInput } from './types'
import { validateScene } from './validate'
import type { SceneValidationResult } from './validate'

/** Serializes a scene config to pretty-printed JSON, suitable for export/download. */
export function exportSceneConfig(scene: SceneConfig): string {
  return JSON.stringify(scene, null, 2)
}

/**
 * Parses and validates a JSON string as scene configuration, filling defaults for any
 * missing fields (via the same normalization `validateScene` already performs).
 * Never throws: JSON parse failures are reported as a validation issue instead.
 */
export function importSceneConfig(json: string): SceneValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    return { ok: false, issues: [`Invalid JSON: ${(error as Error).message}`] }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, issues: ['Scene configuration must be a JSON object.'] }
  }
  return validateScene(parsed as SceneInput)
}
