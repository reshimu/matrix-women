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

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;

  // Ambient background: matches the CSS scene's radial-gradient(circle at 67% 38%, ...).
  // CSS percentages are measured from the top, so 38%-from-top becomes 0.62 in this
  // bottom-origin uv space.
  vec2 bgCenter = vec2(0.67, 0.62);
  vec2 bgUv = vec2(uv.x * aspect, uv.y);
  vec2 bgCenterAspect = vec2(bgCenter.x * aspect, bgCenter.y);
  float bgDist = distance(bgUv, bgCenterAspect);
  vec3 bgNear = vec3(0.094, 0.278, 0.353);
  vec3 bgMid = vec3(0.031, 0.082, 0.122);
  vec3 bgFar = vec3(0.02, 0.027, 0.051);
  vec3 color = mix(bgNear, bgMid, smoothstep(0.0, 0.55, bgDist));
  color = mix(color, bgFar, smoothstep(0.35, 1.15, bgDist));

  // Matrix code-rain: scrolling glyph-like columns, gated by uRainDensity so the
  // effects.codeRain toggle (already folded into uRainDensity) actually hides it.
  float columns = 26.0;
  float col = floor(uv.x * columns);
  float colSeed = hash(col * 1.37 + 4.1);
  float speed = 0.1 + colSeed * 0.28;
  float scroll = fract(uv.y + uTime * speed + colSeed * 5.0);
  float cellCount = 22.0;
  float cell = floor(scroll * cellCount);
  float glyphSeed = hash(cell * 6.7 + col * 3.1);
  float glyphOn = step(0.55, glyphSeed);
  float rain = glyphOn * uRainDensity;
  color += vec3(0.42, 0.9, 0.79) * rain * 0.85;

  // Aura / lighting glow, matching .scene__aura's "circle at 65% 42%" (from top).
  vec2 glowCenter = vec2(0.65, 0.58);
  float glow = uGlowIntensity * smoothstep(0.5, 0.0, distance(uv, glowCenter));
  color += glow * vec3(0.55, 0.98, 0.83);

  // Ambient sparkle / particles.
  float noise = fract(sin(dot(uv * 40.0, vec2(12.9898, 78.233)) + uTime * 0.05) * 43758.5453);
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
  const lastElapsedRef = useRef(0)
  const titleId = useId()

  useEffect(() => {
    uniformsRef.current = uniforms
    // Repaint immediately regardless of animation state: config changes must be
    // visible even when the rAF loop isn't currently advancing (host paused,
    // reduced motion, or a hidden/backgrounded tab) rather than waiting for a
    // frame that may not come for a while.
    paintNowRef.current?.(lastElapsedRef.current)
  }, [uniforms])

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
      lastElapsedRef.current = elapsedSeconds
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
