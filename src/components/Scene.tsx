'use client'

import { useMemo } from 'react'
import type { SceneConfig } from '../scene'
import { selectRenderer } from '../renderer/select'
import { SceneFallback } from './SceneFallback'
import { SceneWebgl } from './SceneWebgl'

type SceneProps = { scene: SceneConfig }

function detectSupportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function detectConstrainedDevice(): boolean {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number }
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2) return true
    return false
  } catch {
    return false
  }
}

export function Scene({ scene }: SceneProps) {
  const rendererKind = useMemo(
    () =>
      selectRenderer({
        prefersReducedMotion: scene.reducedMotion,
        supportsWebGL: detectSupportsWebGL(),
        constrainedDevice: detectConstrainedDevice(),
      }),
    [scene.reducedMotion],
  )

  return rendererKind === 'webgl' ? <SceneWebgl scene={scene} /> : <SceneFallback scene={scene} />
}
