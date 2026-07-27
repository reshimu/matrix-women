import { useEffect, useRef } from 'react'
import type { SceneConfig } from '../scene'
import { createCssRendererHost } from '../renderer/browser/cssRendererHost'

type SceneFallbackProps = { scene: SceneConfig }

export function SceneFallback({ scene }: SceneFallbackProps) {
  const motionClass = scene.reducedMotion ? 'scene--still' : 'scene--animated'
  const sceneRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sceneRef.current) return
    const host = createCssRendererHost({ target: sceneRef.current })
    host.start()
    return () => host.dispose()
  }, [])

  return (
    <section ref={sceneRef} className={`scene scene--${scene.format} ${motionClass}`} aria-labelledby="scene-title">
      <div className="scene__aura" aria-hidden="true" />
      <div className="scene__rain" aria-hidden="true"><span>MATRIX / AI / LIGHT / HUMAN /</span></div>
      <div className="scene__subject" aria-hidden="true">
        <div className="subject__halo" />
        <div className="subject__head" />
        <div className="subject__neck" />
        <div className="subject__shoulders" />
      </div>
      <div className="scene__content">
        <p className="scene__eyebrow">{scene.eyebrow}</p>
        <h1 id="scene-title">{scene.title}</h1>
        <p className="scene__body">A renderer-independent scene foundation with a dependable CSS fallback.</p>
        <button type="button" className="scene__button">Explore the system <span aria-hidden="true">→</span></button>
      </div>
    </section>
  )
}