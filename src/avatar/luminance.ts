/**
 * Luminance sampling: cover-fit any CanvasImageSource into a cols × rows grid.
 * The geometry and pixel math are pure; only sampleLuminance touches the canvas.
 */

export type ContainBox = Readonly<{ dx: number; dy: number; dw: number; dh: number }>

/**
 * Destination rectangle that contain-fits (letterboxes, never crops) a source of
 * srcW × srcH into a destination of dstW × dstH cells, anchored bottom-center —
 * a portrait subject keeps her chin above the frame edge and the rain owns the
 * empty flanks, matching the reference composition.
 */
export function computeContainBox(srcW: number, srcH: number, dstW: number, dstH: number): ContainBox {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return { dx: 0, dy: 0, dw: 0, dh: 0 }
  const scale = Math.min(dstW / srcW, dstH / srcH)
  const dw = srcW * scale
  const dh = srcH * scale
  return { dx: (dstW - dw) / 2, dy: dstH - dh, dw, dh }
}

/** Rec. 601 luma of an RGBA byte buffer into out (0..1 per cell). */
export function rgbaToLuminance(rgba: Uint8ClampedArray, out: Float32Array): void {
  const cells = Math.min(out.length, rgba.length >> 2)
  for (let i = 0; i < cells; i += 1) {
    const offset = i * 4
    const alpha = rgba[offset + 3] / 255
    out[i] =
      ((rgba[offset] * 0.299 + rgba[offset + 1] * 0.587 + rgba[offset + 2] * 0.114) / 255) * alpha
  }
}

export type SourceDimensions = Readonly<{ width: number; height: number }>

export function readSourceDimensions(source: CanvasImageSource): SourceDimensions {
  if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight }
  }
  const sized = source as { width?: number | SVGAnimatedLength; height?: number | SVGAnimatedLength }
  const width = typeof sized.width === 'number' ? sized.width : (sized.width?.baseVal.value ?? 0)
  const height = typeof sized.height === 'number' ? sized.height : (sized.height?.baseVal.value ?? 0)
  return { width, height }
}

/**
 * Downsample a source into ctx's cols × rows backing store and return its
 * luminance grid. Returns false (grid untouched) when the source has no pixels
 * yet (e.g. a video before metadata) or the context cannot read back.
 */
export function sampleLuminance(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  cols: number,
  rows: number,
  out: Float32Array,
): boolean {
  const { width, height } = readSourceDimensions(source)
  if (width <= 0 || height <= 0) return false
  const { dx, dy, dw, dh } = computeContainBox(width, height, cols, rows)
  if (dw <= 0 || dh <= 0) return false
  ctx.clearRect(0, 0, cols, rows)
  ctx.drawImage(source, 0, 0, width, height, dx, dy, dw, dh)
  try {
    const image = ctx.getImageData(0, 0, cols, rows)
    rgbaToLuminance(image.data, out)
    return true
  } catch {
    return false
  }
}
