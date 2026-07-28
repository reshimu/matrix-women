import { useEffect, useId, useMemo, useRef } from 'react'
import type { SceneConfig } from '../scene'
import { createWebglRendererHost } from '../renderer/browser/webglRendererHost'
import { createPortraitTexture } from '../renderer/browser/portraitTexture'
import { deriveWebglUniforms } from '../renderer/webglUniforms'
import type { WebglSceneUniforms } from '../renderer/webglUniforms'
import { computePortraitBox } from '../renderer/portraitLayout'

type SceneWebglProps = { scene: SceneConfig }

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uGlowIntensity;
uniform float uRainDensity;
uniform float uPortraitOpacity;
uniform float uSparkle;
uniform sampler2D uPortraitTexture;
uniform vec4 uPortraitBox;
uniform float uHasPortraitTexture;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 colorA = vec3(0.02, 0.08, 0.09);
  vec3 colorB = vec3(0.09, 0.35, 0.32);
  float wave = sin(uTime * (0.2 + uRainDensity * 0.6) + uv.x * 2.0 + uv.y * 1.3);
  float mixAmount = 0.5 + 0.5 * wave;
  vec3 color = mix(colorA, colorB, mixAmount);

  vec2 glowCenter = vec2(0.65, 0.42);
  float glow = uGlowIntensity * smoothstep(0.5, 0.0, distance(uv, glowCenter));
  color += glow * vec3(0.55, 0.98, 0.83);

  float noise = fract(sin(dot(uv * 40.0, vec2(12.9898, 78.233))) * 43758.5453);
  float sparkle = step(0.995 - uSparkle * 0.03, noise) * uSparkle;
  color += sparkle;

  if (uHasPortraitTexture > 0.5) {
    vec2 boxLocal = (gl_FragCoord.xy - uPortraitBox.xy) / uPortraitBox.zw;
    if (boxLocal.x >= 0.0 && boxLocal.x <= 1.0 && boxLocal.y >= 0.0 && boxLocal.y <= 1.0) {
      vec2 texCoord = vec2(boxLocal.x, 1.0 - boxLocal.y);
      vec4 portraitColor = texture2D(uPortraitTexture, texCoord);
      color = mix(color, portraitColor.rgb, portraitColor.a * uPortraitOpacity);
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createGradientProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
  if (!vertexShader || !fragmentShader) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

export function SceneWebgl({ scene }: SceneWebglProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const uniforms = useMemo(() => deriveWebglUniforms(scene), [scene])
  const uniformsRef = useRef<WebglSceneUniforms>(uniforms)
  const paintNowRef = useRef<((elapsedSeconds: number) => void) | null>(null)
  const titleId = useId()

  useEffect(() => {
    uniformsRef.current = uniforms
    if (scene.reducedMotion) paintNowRef.current?.(0)
  }, [uniforms, scene.reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    const program = gl ? createGradientProgram(gl) : null
    const positionBuffer = gl ? gl.createBuffer() : null
    const portraitTexture = gl ? createPortraitTexture(gl) : null

    let aPositionLocation = -1
    let uResolutionLocation: WebGLUniformLocation | null = null
    let uTimeLocation: WebGLUniformLocation | null = null
    let uGlowIntensityLocation: WebGLUniformLocation | null = null
    let uRainDensityLocation: WebGLUniformLocation | null = null
    let uPortraitOpacityLocation: WebGLUniformLocation | null = null
    let uSparkleLocation: WebGLUniformLocation | null = null
    let uPortraitTextureLocation: WebGLUniformLocation | null = null
    let uPortraitBoxLocation: WebGLUniformLocation | null = null
    let uHasPortraitTextureLocation: WebGLUniformLocation | null = null

    if (gl && program && positionBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      aPositionLocation = gl.getAttribLocation(program, 'aPosition')
      uResolutionLocation = gl.getUniformLocation(program, 'uResolution')
      uTimeLocation = gl.getUniformLocation(program, 'uTime')
      uGlowIntensityLocation = gl.getUniformLocation(program, 'uGlowIntensity')
      uRainDensityLocation = gl.getUniformLocation(program, 'uRainDensity')
      uPortraitOpacityLocation = gl.getUniformLocation(program, 'uPortraitOpacity')
      uSparkleLocation = gl.getUniformLocation(program, 'uSparkle')
      uPortraitTextureLocation = gl.getUniformLocation(program, 'uPortraitTexture')
      uPortraitBoxLocation = gl.getUniformLocation(program, 'uPortraitBox')
      uHasPortraitTextureLocation = gl.getUniformLocation(program, 'uHasPortraitTexture')
    }

    let lastElapsedSeconds = 0
    let portraitBoxBottomOrigin = [0, 0, 0, 0]

    const paint = (elapsedSeconds: number) => {
      lastElapsedSeconds = elapsedSeconds
      if (!gl || !program || !positionBuffer) return
      const uniforms = uniformsRef.current
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(aPositionLocation)
      gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(uResolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(uTimeLocation, elapsedSeconds)
      gl.uniform1f(uGlowIntensityLocation, uniforms.glowIntensity)
      gl.uniform1f(uRainDensityLocation, uniforms.rainDensity)
      gl.uniform1f(uPortraitOpacityLocation, uniforms.portraitOpacity)
      gl.uniform1f(uSparkleLocation, uniforms.sparkle)
      gl.uniform4f(uPortraitBoxLocation, ...(portraitBoxBottomOrigin as [number, number, number, number]))
      gl.uniform1f(uHasPortraitTextureLocation, portraitTexture ? 1 : 0)
      if (portraitTexture) {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, portraitTexture)
        gl.uniform1i(uPortraitTextureLocation, 0)
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      gl?.viewport(0, 0, canvas.width, canvas.height)
      const box = computePortraitBox(scene.format, canvas.width, canvas.height)
      portraitBoxBottomOrigin = [box.x, canvas.height - box.y - box.height, box.width, box.height]
      paint(lastElapsedSeconds)
    }

    let animationFrameId: number | undefined
    let animationStartMs: number | undefined

    const tick = (nowMs: number) => {
      if (animationStartMs === undefined) animationStartMs = nowMs
      paint((nowMs - animationStartMs) / 1000)
      animationFrameId = requestAnimationFrame(tick)
    }

    const stopAnimating = () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = undefined
      }
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    paintNowRef.current = paint

    const host = createWebglRendererHost({
      target: canvas,
      onStateChange: (state) => {
        if (state !== 'running') {
          stopAnimating()
          return
        }
        if (scene.reducedMotion) {
          paint(0)
        } else if (animationFrameId === undefined) {
          animationStartMs = undefined
          animationFrameId = requestAnimationFrame(tick)
        }
      },
    })
    host.start()

    return () => {
      stopAnimating()
      resizeObserver.disconnect()
      paintNowRef.current = null
      if (gl && portraitTexture) gl.deleteTexture(portraitTexture)
      host.dispose()
    }
  }, [scene.reducedMotion, scene.format])

  return (
    <section className={`scene scene--${scene.format}`} aria-labelledby={titleId}>
      <canvas ref={canvasRef} className="scene__webgl-canvas" aria-hidden="true" />
      <div className="scene__content">
        <p className="scene__eyebrow">{scene.eyebrow}</p>
        <h1 id={titleId}>{scene.title}</h1>
        <p className="scene__body">A WebGL-enhanced scene composed from the same layer/effect config as the CSS fallback.</p>
        <button type="button" className="scene__button">Explore the system <span aria-hidden="true">→</span></button>
      </div>
    </section>
  )
}
