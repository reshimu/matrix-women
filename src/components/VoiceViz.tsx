import { useCallback, useEffect, useRef } from 'react'
import { advanceDrivers, createDriverState, measureFromAnalyser } from '../voice/voice-drivers.js'

export interface CurveFrame {
  energy: number
  low: number
  centroid: number
}

export type VoiceVizDriverSource =
  | { kind: 'analyser'; analyser: AnalyserNode }
  | { kind: 'curve'; frames: CurveFrame[]; frameRate: number }

export interface VoiceVizProps {
  driverSource: VoiceVizDriverSource
  className?: string
}

function readToken(element: Element, name: string, fallback: string): string {
  const value = getComputedStyle(element).getPropertyValue(name).trim()
  return value || fallback
}

interface Drivers {
  jawOpen: number
  mouthWidth: number
  bodyPulse: number
  blink: number
}

interface Tokens {
  accent: string
  text: string
}

function draw(ctx: CanvasRenderingContext2D, width: number, height: number, drivers: Drivers, tokens: Tokens) {
  ctx.clearRect(0, 0, width, height)

  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.34
  const { jawOpen, mouthWidth, bodyPulse, blink } = drivers

  // Concentric rings -- breathing on the low band
  for (let i = 0; i < 3; i += 1) {
    const scale = (0.72 + i * 0.2) * (1 + 0.1 * bodyPulse)
    ctx.beginPath()
    ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2)
    ctx.strokeStyle = tokens.accent
    ctx.globalAlpha = (0.34 - i * 0.09) * (0.6 + 0.4 * bodyPulse)
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Eyes -- vertical scale driven by the blink timer only
  const eyeOffsetX = radius * 0.26
  const eyeY = cy - radius * 0.16
  const eyeRadius = radius * 0.058
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(
      cx + side * eyeOffsetX,
      eyeY,
      eyeRadius,
      Math.max(eyeRadius * 0.08, eyeRadius * (1 - blink)),
      0,
      0,
      Math.PI * 2,
    )
    ctx.fillStyle = tokens.text
    ctx.fill()
  }

  // Aperture -- jawOpen drives height, mouthWidth drives width
  const mouthY = cy + radius * 0.3
  const mouthRx = radius * (0.15 + 0.19 * mouthWidth)
  const mouthRy = radius * (0.014 + 0.24 * jawOpen)

  ctx.save()
  ctx.shadowColor = tokens.accent
  ctx.shadowBlur = 18 * (0.3 + jawOpen)
  ctx.beginPath()
  ctx.ellipse(cx, mouthY, mouthRx, mouthRy, 0, 0, Math.PI * 2)
  ctx.fillStyle = tokens.accent
  ctx.fill()
  ctx.restore()
}

/** Renders a face driven by smoothed audio scalars -- from a live AnalyserNode or a pre-computed curve. */
export function VoiceViz({ driverSource, className }: VoiceVizProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const stateRef = useRef(createDriverState())
  const driverSourceRef = useRef(driverSource)
  useEffect(() => {
    driverSourceRef.current = driverSource
  }, [driverSource])

  const loop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const tokens: Tokens = {
      accent: readToken(canvas, '--accent', '#6366F1'),
      text: readToken(canvas, '--text-primary', '#E6EDF3'),
    }

    let last = performance.now()
    let timeDomain: Float32Array | null = null
    let frequencyData: Uint8Array | null = null

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const source = driverSourceRef.current
      const measured =
        source.kind === 'analyser'
          ? (() => {
              if (!timeDomain || timeDomain.length !== source.analyser.fftSize) {
                timeDomain = new Float32Array(source.analyser.fftSize)
                frequencyData = new Uint8Array(source.analyser.frequencyBinCount)
              }
              return measureFromAnalyser(source.analyser, timeDomain, frequencyData as Uint8Array)
            })()
          : source.frames[Math.min(source.frames.length - 1, Math.floor(stateRef.current.elapsed * source.frameRate))] ?? {
              energy: 0,
              low: 0,
              centroid: 0,
            }

      const drivers = advanceDrivers(stateRef.current, measured, dt)

      const ratio = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (canvas.width !== width * ratio) {
        canvas.width = width * ratio
        canvas.height = height * ratio
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      draw(ctx, width, height, drivers, tokens)

      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    loop()
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [loop])

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%', display: 'block' }} />
}
