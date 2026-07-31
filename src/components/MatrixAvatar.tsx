'use client'

import { useEffect, useRef } from 'react'
import {
  BRIGHTNESS_TIERS,
  GLYPH_CHARSET,
  advanceGlyphField,
  breathAt,
  brightnessTier,
  cellBrightness,
  computeEdgeMap,
  createGlyphFieldState,
  type GlyphFieldState,
  type RainColumn,
} from '../avatar/glyphField'
import { computeContainBox, readSourceDimensions, sampleLuminance } from '../avatar/luminance'
import { createDefaultPortraitCanvas } from '../avatar/defaultPortrait'
import { createCssRendererHost } from '../renderer/browser/cssRendererHost'

export type MatrixAvatarProps = {
  /** Luminance source. Omit for the repo-owned default subject. A video is resampled every frame. */
  source?: CanvasImageSource | null
  reducedMotion?: boolean
  className?: string
}

const TARGET_CELL_PX = 8
const MAX_CELLS = 8000
const MIN_GRID = 24

/** Deterministic PRNG so a seeded avatar is reproducible frame-for-frame in tests. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Grid = {
  cols: number
  rows: number
  cellSize: number
  state: GlyphFieldState
  luminance: Float32Array
  edges: Float32Array
  hasSample: boolean
}

function computeGrid(width: number, height: number, rng: () => number): Grid | null {
  if (width < 4 || height < 4) return null
  let cellSize = TARGET_CELL_PX
  let cols = Math.max(MIN_GRID, Math.floor(width / cellSize))
  let rows = Math.max(MIN_GRID, Math.floor(height / cellSize))
  while (cols * rows > MAX_CELLS) {
    cellSize += 1
    cols = Math.max(MIN_GRID, Math.floor(width / cellSize))
    rows = Math.max(MIN_GRID, Math.floor(height / cellSize))
  }
  return {
    cols,
    rows,
    cellSize,
    state: createGlyphFieldState(cols, rows, rng),
    luminance: new Float32Array(cols * rows),
    edges: new Float32Array(cols * rows),
    hasSample: false,
  }
}

function buildAtlas(cellPx: number): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = GLYPH_CHARSET.length * cellPx
  canvas.height = BRIGHTNESS_TIERS.length * cellPx
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.font = `${Math.round(cellPx * 0.86)}px ui-monospace, Menlo, Consolas, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let tier = 0; tier < BRIGHTNESS_TIERS.length; tier += 1) {
    ctx.save()
    ctx.fillStyle = BRIGHTNESS_TIERS[tier]
    if (tier >= BRIGHTNESS_TIERS.length - 2) {
      ctx.shadowColor = BRIGHTNESS_TIERS[tier]
      ctx.shadowBlur = cellPx * 0.6
    }
    for (let glyph = 0; glyph < GLYPH_CHARSET.length; glyph += 1) {
      ctx.fillText(GLYPH_CHARSET[glyph], glyph * cellPx + cellPx / 2, tier * cellPx + cellPx / 2)
    }
    ctx.restore()
  }
  return canvas
}

function paintSkyline(width: number, height: number): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const rng = mulberry32(1401)
  const horizon = height * 0.995
  let x = 0
  while (x < width) {
    const buildingWidth = 14 + rng() * 40
    const buildingHeight = height * (0.05 + rng() * 0.24)
    ctx.fillStyle = 'rgba(7, 26, 16, 0.9)'
    ctx.fillRect(x, horizon - buildingHeight, buildingWidth, buildingHeight)
    if (rng() > 0.35) {
      ctx.fillStyle = 'rgba(28, 92, 52, 0.55)'
      for (let wy = horizon - buildingHeight + 4; wy < horizon - 4; wy += 7) {
        for (let wx = x + 3; wx < x + buildingWidth - 3; wx += 6) {
          if (rng() > 0.72) ctx.fillRect(wx, wy, 1.6, 2.4)
        }
      }
    }
    x += buildingWidth + 2 + rng() * 10
  }
  return canvas
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  columns: RainColumn[],
  grid: Grid,
  columnStride: number,
  columnOffset: number,
  headTier: number,
  trailTier: number,
  alpha: number,
) {
  const { cellSize, rows } = grid
  const cellPx = atlas.width / GLYPH_CHARSET.length
  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i]
    const cellX = (i * columnStride + columnOffset) % grid.cols
    const head = Math.floor(column.head)
    for (let k = 0; k <= column.trail; k += 1) {
      const row = head - k
      if (row < 0 || row >= rows) continue
      const fade = 1 - k / (column.trail + 1)
      const tier = k === 0 ? headTier : Math.max(0, Math.round(trailTier * fade))
      const glyph = (cellX * 13 + row * 7 + i) % GLYPH_CHARSET.length
      ctx.globalAlpha = alpha * (k === 0 ? 1 : 0.45 + 0.55 * fade)
      ctx.drawImage(
        atlas,
        glyph * cellPx,
        tier * cellPx,
        cellPx,
        cellPx,
        cellX * cellSize,
        row * cellSize,
        cellSize,
        cellSize,
      )
    }
  }
  ctx.globalAlpha = 1
}

/**
 * The dynamic glyph-hologram avatar: a luminance source rendered as churning code
 * glyphs with Sobel rim light, code-rain behind and in front, and a procedural
 * skyline — continuously alive unless reducedMotion asks for a still frame.
 */
export function MatrixAvatar({ source, reducedMotion = false, className }: MatrixAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sourceRef = useRef<CanvasImageSource | null | undefined>(source)
  const sourceDirtyRef = useRef(true)

  useEffect(() => {
    sourceRef.current = source
    sourceDirtyRef.current = true
  }, [source])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sampleCanvas = document.createElement('canvas')
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true })
    if (!sampleCtx) return

    // Continuous-tone pass: the source itself, grayscaled and tinted hologram-green.
    // The reference look is NOT pure glyph art — the figure's smooth shading shows
    // through, with the glyph field as a luminous texture on top of it.
    const toneCanvas = document.createElement('canvas')
    const toneCtx = toneCanvas.getContext('2d')

    const rng = mulberry32(97)
    let grid: Grid | null = null
    let atlas: HTMLCanvasElement | null = null
    let skyline: HTMLCanvasElement | null = null
    let defaultPortrait: HTMLCanvasElement | null = null
    let animationFrameId: number | undefined
    let lastNow: number | undefined
    let running = false

    const activeSource = (): CanvasImageSource | null => {
      if (sourceRef.current) return sourceRef.current
      if (!defaultPortrait) defaultPortrait = createDefaultPortraitCanvas()
      return defaultPortrait
    }

    const resample = () => {
      if (!grid) return
      const src = activeSource()
      if (!src) return
      sampleCanvas.width = grid.cols
      sampleCanvas.height = grid.rows
      if (sampleLuminance(sampleCtx, src, grid.cols, grid.rows, grid.luminance)) {
        grid.edges = computeEdgeMap(grid.luminance, grid.cols, grid.rows)
        grid.hasSample = true
        sourceDirtyRef.current = false
      }
    }

    const isVideoSource = () =>
      typeof HTMLVideoElement !== 'undefined' && sourceRef.current instanceof HTMLVideoElement

    let lastToneSource: CanvasImageSource | null = null
    let lastToneW = 0
    let lastToneH = 0

    const renderTone = (src: CanvasImageSource, boxW: number, boxH: number): boolean => {
      if (!toneCtx) return false
      const { width: sw, height: sh } = readSourceDimensions(src)
      if (sw <= 0 || sh <= 0 || boxW < 1 || boxH < 1) return false
      const scale = Math.min(1, 1024 / Math.max(boxW, boxH))
      const tw = Math.max(1, Math.round(boxW * scale))
      const th = Math.max(1, Math.round(boxH * scale))
      if (toneCanvas.width !== tw || toneCanvas.height !== th) {
        toneCanvas.width = tw
        toneCanvas.height = th
      }
      toneCtx.save()
      toneCtx.clearRect(0, 0, tw, th)
      toneCtx.filter = 'grayscale(1) contrast(1.12) brightness(1.06)'
      toneCtx.drawImage(src, 0, 0, sw, sh, 0, 0, tw, th)
      toneCtx.filter = 'none'
      toneCtx.globalCompositeOperation = 'multiply'
      toneCtx.fillStyle = '#96ffbe'
      toneCtx.fillRect(0, 0, tw, th)
      toneCtx.restore()
      return true
    }

    const paint = (dt: number) => {
      if (!grid || !atlas) return
      if (sourceDirtyRef.current || isVideoSource() || !grid.hasSample) resample()
      if (dt > 0) advanceGlyphField(grid.state, dt, rng)

      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.fillStyle = '#010503'
      ctx.fillRect(0, 0, width, height)

      if (skyline) {
        ctx.globalAlpha = 0.6
        ctx.drawImage(skyline, 0, 0, width, height)
        ctx.globalAlpha = 1
      }

      // Ambient hologram glow behind the figure.
      const glow = ctx.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.6)
      glow.addColorStop(0, 'rgba(34, 181, 82, 0.13)')
      glow.addColorStop(1, 'rgba(34, 181, 82, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      drawRain(ctx, atlas, grid.state.backRain, grid, 1, 0, 3, 2, 0.34)

      // Continuous-tone underlay + bloom: the figure's smooth shading, green-tinted,
      // glowing — the glyphs become a texture over it instead of the whole image.
      const src = activeSource()
      if (src) {
        const dims = readSourceDimensions(src)
        if (dims.width > 0 && dims.height > 0) {
          const box = computeContainBox(dims.width, dims.height, width, height)
          const boxW = Math.round(box.dw)
          const boxH = Math.round(box.dh)
          const needTone = isVideoSource() || src !== lastToneSource || boxW !== lastToneW || boxH !== lastToneH
          if (!needTone || renderTone(src, box.dw, box.dh)) {
            if (needTone) {
              lastToneSource = src
              lastToneW = boxW
              lastToneH = boxH
            }
            const breath = 0.9 + 0.1 * breathAt(grid.state.elapsed)
            ctx.globalAlpha = 0.6 * breath
            ctx.drawImage(toneCanvas, box.dx, box.dy, box.dw, box.dh)
            ctx.globalCompositeOperation = 'lighter'
            ctx.globalAlpha = 0.45 * breath
            ctx.filter = 'blur(14px)'
            ctx.drawImage(toneCanvas, box.dx, box.dy, box.dw, box.dh)
            ctx.filter = 'none'
            ctx.globalCompositeOperation = 'source-over'
            ctx.globalAlpha = 1
          }
        }
      }

      if (grid.hasSample) {
        const { cols, rows, cellSize, state, luminance, edges } = grid
        const cellPx = atlas.width / GLYPH_CHARSET.length
        const elapsed = state.elapsed
        ctx.globalCompositeOperation = 'lighter'
        for (let row = 0; row < rows; row += 1) {
          const rowNorm = row / rows
          for (let col = 0; col < cols; col += 1) {
            const index = row * cols + col
            const value = cellBrightness(luminance[index], edges[index], rowNorm, elapsed)
            const tier = brightnessTier(value)
            if (tier < 0) continue
            ctx.drawImage(
              atlas,
              state.glyphs[index] * cellPx,
              tier * cellPx,
              cellPx,
              cellPx,
              col * cellSize,
              row * cellSize,
              cellSize,
              cellSize,
            )
          }
        }
        ctx.globalCompositeOperation = 'source-over'
      }

      drawRain(ctx, atlas, grid.state.frontRain, grid, 5, 2, 6, 4, 0.55)

      // Vignette pulls the edges down into the dark.
      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.46, Math.min(width, height) * 0.36, width * 0.5, height * 0.5, Math.max(width, height) * 0.78)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)
    }

    const tick = (now: number) => {
      const dt = lastNow === undefined ? 0.016 : Math.min((now - lastNow) / 1000, 0.05)
      lastNow = now
      paint(dt)
      animationFrameId = requestAnimationFrame(tick)
    }

    const stopAnimating = () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = undefined
      }
      lastNow = undefined
    }

    const synchronizeLoop = () => {
      if (running && !reducedMotion) {
        if (animationFrameId === undefined) animationFrameId = requestAnimationFrame(tick)
      } else {
        stopAnimating()
        if (running && reducedMotion) paint(0)
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) // naf-allow-fallback: undefined in jsdom/embedded browsers; 1 is the spec's CSS-pixel identity, not a masked failure
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      grid = computeGrid(width, height, rng)
      if (grid) {
        atlas = buildAtlas(Math.max(8, Math.round(grid.cellSize * dpr)))
        skyline = paintSkyline(width, height)
        sourceDirtyRef.current = true
        paint(0)
      }
    }

    resize()
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : undefined
    resizeObserver?.observe(canvas)

    const host = createCssRendererHost({
      target: canvas,
      onStateChange: (state) => {
        running = state === 'running'
        synchronizeLoop()
      },
    })
    host.start()

    return () => {
      stopAnimating()
      resizeObserver?.disconnect()
      host.dispose()
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
