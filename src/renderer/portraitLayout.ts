import type { SceneFormat } from '../scene'
import { PORTRAIT_VIEWBOX } from '../scene/portraitArt'

export type PortraitBox = Readonly<{ x: number; y: number; width: number; height: number }>

function boxRegion(format: SceneFormat, canvasWidth: number, canvasHeight: number) {
  if (format === 'hero') {
    return { x: canvasWidth * 0.52, y: 0, width: canvasWidth * 0.44, height: canvasHeight }
  }
  return { x: canvasWidth * 0.19, y: canvasHeight * 0.225, width: canvasWidth * 0.62, height: canvasHeight * 0.55 }
}

/**
 * Contain-fits the portrait artwork's aspect ratio within a format-specific region,
 * anchored bottom-center (matching the CSS scene's `preserveAspectRatio="xMidYMax"`).
 * Returned coordinates are top-left-origin pixels, matching canvas/DOM convention.
 */
export function computePortraitBox(format: SceneFormat, canvasWidth: number, canvasHeight: number): PortraitBox {
  const region = boxRegion(format, canvasWidth, canvasHeight)
  const scale = Math.min(region.width / PORTRAIT_VIEWBOX.width, region.height / PORTRAIT_VIEWBOX.height)
  const width = PORTRAIT_VIEWBOX.width * scale
  const height = PORTRAIT_VIEWBOX.height * scale
  const x = region.x + (region.width - width) / 2
  const y = region.y + (region.height - height)
  return { x, y, width, height }
}
