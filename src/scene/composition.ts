import type { SceneConfig, SceneLayer } from './types'

export function isLayerActive(effects: SceneConfig['effects'], layer: SceneLayer): boolean {
  switch (layer.type) {
    case 'code-rain':
      return effects.codeRain
    case 'particles':
      return effects.particles
    case 'lighting':
      return effects.glow
    case 'portrait':
      return true
  }
}

export function selectActiveLayers(scene: SceneConfig): readonly SceneLayer[] {
  return scene.layers.filter((layer) => isLayerActive(scene.effects, layer))
}
