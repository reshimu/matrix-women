/**
 * The repo-owned default subject: a serene woman, eyes closed, head and shoulders,
 * sculpted from canvas gradients as a grayscale LUMINANCE map — not display art.
 * The glyph field quantizes this into the hologram, so what matters here is where
 * light lives: facial planes, closed-eye lash lines, hair masses, rim light.
 * Non-sexualized by construction: the composition fades to black below the
 * collarbones (AGENTS.md subject requirements).
 */

export const DEFAULT_PORTRAIT_SIZE = { width: 400, height: 500 } as const

type Ctx = CanvasRenderingContext2D

function glow(ctx: Ctx, x: number, y: number, radius: number, alpha: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function shade(ctx: Ctx, x: number, y: number, radius: number, alpha: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, `rgba(0,0,0,${alpha})`)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function stroke(ctx: Ctx, path: Path2D, color: string, width: number, blur = 0) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  if (blur > 0) {
    ctx.shadowColor = color
    ctx.shadowBlur = blur
  }
  ctx.stroke(path)
  ctx.restore()
}

function hairMasses(ctx: Ctx) {
  const hair = new Path2D(
    // Left fall: hugs the head at the temple, waves out and ends above the shoulder line
    'M200,54 C156,56 128,84 124,126 C120,166 128,204 122,248 C116,292 108,344 116,398 ' +
      'L150,410 C142,352 152,300 148,252 C144,204 150,152 170,118 C182,98 192,86 200,82 Z ' +
      // Right fall
      'M200,54 C244,56 272,84 276,126 C280,166 272,204 278,248 C284,292 292,344 284,398 ' +
      'L250,410 C258,352 248,300 252,252 C256,204 250,152 230,118 C218,98 208,86 200,82 Z ' +
      // Crown
      'M200,50 C162,52 136,72 128,102 C148,72 172,62 200,62 C228,62 252,72 272,102 C264,72 238,52 200,50 Z',
  )
  const gradient = ctx.createLinearGradient(0, 40, 0, 440)
  gradient.addColorStop(0, 'rgba(255,255,255,0.5)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.36)')
  gradient.addColorStop(1, 'rgba(255,255,255,0.14)')
  ctx.fillStyle = gradient
  ctx.fill(hair)

  // Rim light on the outer silhouettes — the hologram's hot contour.
  stroke(ctx, new Path2D('M124,128 C120,168 128,206 122,250 C116,294 108,346 116,398'), 'rgba(255,255,255,0.5)', 3, 6)
  stroke(ctx, new Path2D('M276,128 C280,168 272,206 278,250 C284,294 292,346 284,398'), 'rgba(255,255,255,0.5)', 3, 6)

  // A few loose strands catching light.
  stroke(ctx, new Path2D('M150,120 C142,190 150,260 144,330'), 'rgba(255,255,255,0.22)', 1.4)
  stroke(ctx, new Path2D('M252,124 C260,196 252,266 258,336'), 'rgba(255,255,255,0.22)', 1.4)
}

function facePlanes(ctx: Ctx) {
  // Base face oval — the brightest surface in the composition, like the reference.
  const face = ctx.createRadialGradient(200, 150, 8, 200, 158, 92)
  face.addColorStop(0, 'rgba(255,255,255,0.78)')
  face.addColorStop(0.72, 'rgba(255,255,255,0.6)')
  face.addColorStop(1, 'rgba(255,255,255,0.22)')
  ctx.fillStyle = face
  ctx.beginPath()
  ctx.ellipse(200, 156, 63, 84, 0, 0, Math.PI * 2)
  ctx.fill()

  glow(ctx, 200, 116, 48, 0.3) // forehead
  glow(ctx, 168, 178, 27, 0.24) // left cheek
  glow(ctx, 232, 178, 27, 0.24) // right cheek
  glow(ctx, 200, 226, 18, 0.2) // chin

  // Temple / jaw falloff keeps the face from reading as a flat disc.
  shade(ctx, 143, 198, 32, 0.2)
  shade(ctx, 257, 198, 32, 0.2)
}

function features(ctx: Ctx) {
  // Brows.
  stroke(ctx, new Path2D('M152,136 Q172,128 188,134'), 'rgba(0,0,0,0.75)', 7)
  stroke(ctx, new Path2D('M212,134 Q228,128 248,136'), 'rgba(0,0,0,0.75)', 7)

  // Closed eyes: soft socket, dark lash arc, a breath of light beneath.
  shade(ctx, 172, 152, 19, 0.5)
  shade(ctx, 228, 152, 19, 0.5)
  stroke(ctx, new Path2D('M158,154 Q172,163 186,154'), 'rgba(0,0,0,0.95)', 8)
  stroke(ctx, new Path2D('M214,154 Q228,163 242,154'), 'rgba(0,0,0,0.95)', 8)
  glow(ctx, 172, 168, 9, 0.14)
  glow(ctx, 228, 168, 9, 0.14)

  // Nose: bridge light, base shadow.
  stroke(ctx, new Path2D('M200,144 L200,186'), 'rgba(255,255,255,0.22)', 7, 6)
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.beginPath()
  ctx.ellipse(200, 194, 13, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Mouth: shadowed parting line over a lit lower lip.
  stroke(ctx, new Path2D('M183,209 Q200,216 217,209'), 'rgba(0,0,0,0.8)', 6.5)
  glow(ctx, 200, 221, 11, 0.24)
}

function neckAndShoulders(ctx: Ctx) {
  // Back hair behind the neck: the flanks between jaw and shoulders read as lit
  // hair falling behind the figure, never as holes into the background.
  const backHair = ctx.createLinearGradient(0, 240, 0, 340)
  backHair.addColorStop(0, 'rgba(255,255,255,0.26)')
  backHair.addColorStop(1, 'rgba(255,255,255,0.18)')
  ctx.fillStyle = backHair
  ctx.beginPath()
  ctx.moveTo(146, 242)
  ctx.bezierCurveTo(152, 282, 156, 308, 156, 334)
  ctx.lineTo(244, 334)
  ctx.bezierCurveTo(244, 308, 248, 282, 254, 242)
  ctx.bezierCurveTo(236, 260, 220, 266, 200, 266)
  ctx.bezierCurveTo(180, 266, 164, 260, 146, 242)
  ctx.closePath()
  ctx.fill()

  // Under-chin shadow separates head from neck.
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(200, 243, 27, 9, 0, 0, Math.PI * 2)
  ctx.fill()

  // Neck column.
  const neck = ctx.createLinearGradient(0, 240, 0, 320)
  neck.addColorStop(0, 'rgba(255,255,255,0.46)')
  neck.addColorStop(1, 'rgba(255,255,255,0.58)')
  ctx.fillStyle = neck
  ctx.beginPath()
  ctx.moveTo(174, 240)
  ctx.bezierCurveTo(178, 276, 174, 296, 160, 314)
  ctx.lineTo(240, 314)
  ctx.bezierCurveTo(226, 296, 222, 276, 226, 240)
  ctx.closePath()
  ctx.fill()

  // Shoulder masses, fading to black well above the bottom edge (deliberate crop).
  const shoulders = ctx.createLinearGradient(0, 300, 0, 462)
  shoulders.addColorStop(0, 'rgba(255,255,255,0.6)')
  shoulders.addColorStop(0.55, 'rgba(255,255,255,0.32)')
  shoulders.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = shoulders
  ctx.beginPath()
  ctx.moveTo(54, 470)
  ctx.bezierCurveTo(64, 368, 108, 322, 158, 308)
  ctx.lineTo(242, 308)
  ctx.bezierCurveTo(292, 322, 336, 368, 346, 470)
  ctx.closePath()
  ctx.fill()

  // Collarbones over a soft sternum light.
  glow(ctx, 200, 344, 30, 0.2)
  stroke(ctx, new Path2D('M141,332 Q170,318 196,322'), 'rgba(255,255,255,0.34)', 3.5)
  stroke(ctx, new Path2D('M259,332 Q230,318 204,322'), 'rgba(255,255,255,0.34)', 3.5)
}

/** Paint the default subject as a luminance map. Assumes a cleared context. */
export function paintDefaultPortrait(ctx: Ctx, width: number, height: number): void {
  ctx.save()
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.scale(width / DEFAULT_PORTRAIT_SIZE.width, height / DEFAULT_PORTRAIT_SIZE.height)

  glow(ctx, 200, 160, 225, 0.1) // ambient halo

  hairMasses(ctx)
  facePlanes(ctx)
  features(ctx)
  neckAndShoulders(ctx)

  ctx.restore()
}

/** Rasterize the default subject once for use as a luminance source. */
export function createDefaultPortraitCanvas(width = 400, height = 500): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  paintDefaultPortrait(ctx, width, height)
  return canvas
}
