import type { SceneConfig } from '../scene'
import { selectActiveLayers } from '../scene'

export type WebglSceneUniforms = Readonly<{
  glowIntensity: number
  rainDensity: number
  portraitOpacity: number
  sparkle: number
}>

export function deriveWebglUniforms(scene: SceneConfig): WebglSceneUniforms {
  let glowIntensity = 0
  let rainDensity = 0
  let portraitOpacity = 0
  let sparkle = 0

  for (const layer of selectActiveLayers(scene)) {
    switch (layer.type) {
      case 'lighting':
        glowIntensity = layer.intensity * layer.opacity
        break
      case 'code-rain':
        rainDensity = layer.density * layer.opacity
        break
      case 'portrait':
        portraitOpacity = layer.opacity
        break
      case 'particles':
        sparkle = Math.min(1, layer.count / 200) * layer.opacity
        break
    }
  }

  return { glowIntensity, rainDensity, portraitOpacity, sparkle }
}
