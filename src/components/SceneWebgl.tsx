import { useEffect, useRef } from 'react'
import type { SceneConfig } from '../scene'
import { createWebglRendererHost } from '../renderer/browser/webglRendererHost'

type SceneWebglProps = { scene: SceneConfig }

export function SceneWebgl({ scene }: SceneWebglProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')

    const paint = () => {
      if (!gl) return
      gl.clearColor(0.05, 0.16, 0.17, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }

    const host = createWebglRendererHost({
      target: canvas,
      onStateChange: (state) => {
        if (state === 'running') paint()
      },
    })
    host.start()
    paint()
    return () => host.dispose()
  }, [])

  return (
    <section className={`scene scene--${scene.format}`} aria-labelledby="scene-title">
      <canvas ref={canvasRef} className="scene__webgl-canvas" aria-hidden="true" />
      <div className="scene__content">
        <p className="scene__eyebrow">{scene.eyebrow}</p>
        <h1 id="scene-title">{scene.title}</h1>
        <p className="scene__body">A WebGL-enhanced scene mount point (placeholder — no rendering content yet).</p>
        <button type="button" className="scene__button">Explore the system <span aria-hidden="true">→</span></button>
      </div>
    </section>
  )
}
