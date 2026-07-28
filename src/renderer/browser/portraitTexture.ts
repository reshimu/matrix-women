import {
  FIGURE_GRADIENT_STOPS,
  FIGURE_PATH,
  HAIR_GRADIENT_STOPS,
  HAIR_PATH,
  HALO_GLOW,
  HALO_GLOW_STOPS,
  HALO_RING,
  HIGHLIGHT_PATH,
  HIGHLIGHT_STROKE,
  PORTRAIT_VIEWBOX,
  STRAND_GRADIENT_STOPS,
  STRAND_PATHS,
  type ColorStop,
} from '../../scene/portraitArt'

function hexToRgba(hex: string, opacity: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function applyStops(gradient: CanvasGradient, stops: readonly ColorStop[]) {
  for (const stop of stops) gradient.addColorStop(stop.offset, hexToRgba(stop.color, stop.opacity ?? 1))
}

function drawMirrored(ctx: CanvasRenderingContext2D, draw: () => void) {
  draw()
  ctx.save()
  ctx.translate(PORTRAIT_VIEWBOX.width, 0)
  ctx.scale(-1, 1)
  draw()
  ctx.restore()
}

export function paintPortrait(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.scale(width / PORTRAIT_VIEWBOX.width, height / PORTRAIT_VIEWBOX.height)

  const haloGlow = ctx.createRadialGradient(HALO_GLOW.cx, HALO_GLOW.cy, 0, HALO_GLOW.cx, HALO_GLOW.cy, HALO_GLOW.r)
  applyStops(haloGlow, HALO_GLOW_STOPS)
  ctx.fillStyle = haloGlow
  ctx.beginPath()
  ctx.arc(HALO_GLOW.cx, HALO_GLOW.cy, HALO_GLOW.r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = hexToRgba(HALO_RING.stroke, HALO_RING.strokeOpacity)
  ctx.lineWidth = HALO_RING.strokeWidth
  ctx.beginPath()
  ctx.ellipse(HALO_RING.cx, HALO_RING.cy, HALO_RING.rx, HALO_RING.ry, 0, 0, Math.PI * 2)
  ctx.stroke()

  const hairGradient = ctx.createLinearGradient(0, 0, 0, PORTRAIT_VIEWBOX.height)
  applyStops(hairGradient, HAIR_GRADIENT_STOPS)
  const hairPath = new Path2D(HAIR_PATH)
  ctx.fillStyle = hairGradient
  drawMirrored(ctx, () => ctx.fill(hairPath))

  const figureGradient = ctx.createLinearGradient(0, 0, 0, PORTRAIT_VIEWBOX.height)
  applyStops(figureGradient, FIGURE_GRADIENT_STOPS)
  const figurePath = new Path2D(FIGURE_PATH)
  ctx.fillStyle = figureGradient
  drawMirrored(ctx, () => ctx.fill(figurePath))

  const strandGradient = ctx.createLinearGradient(0, 0, 0, PORTRAIT_VIEWBOX.height)
  applyStops(strandGradient, STRAND_GRADIENT_STOPS)
  ctx.strokeStyle = strandGradient
  ctx.lineCap = 'round'
  for (const strand of STRAND_PATHS) {
    ctx.lineWidth = strand.width
    ctx.globalAlpha = strand.opacity
    drawMirrored(ctx, () => ctx.stroke(new Path2D(strand.d)))
  }
  ctx.globalAlpha = 1

  ctx.strokeStyle = hexToRgba(HIGHLIGHT_STROKE.color, HIGHLIGHT_STROKE.opacity)
  ctx.lineWidth = HIGHLIGHT_STROKE.width
  ctx.lineCap = 'round'
  ctx.stroke(new Path2D(HIGHLIGHT_PATH))

  ctx.restore()
}

export function createPortraitTexture(gl: WebGLRenderingContext, width = 512, height = 640): WebGLTexture | null {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  paintPortrait(ctx, width, height)

  const texture = gl.createTexture()
  if (!texture) return null
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  return texture
}
