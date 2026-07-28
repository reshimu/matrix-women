import { useEffect, useId, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { SceneConfig, SceneLayer } from '../scene'
import { selectActiveLayers } from '../scene'
import { createCssRendererHost } from '../renderer/browser/cssRendererHost'
import { SubjectPortrait } from './SubjectPortrait'

type SceneFallbackProps = { scene: SceneConfig }

const RAIN_TEXT = 'MATRIX / AI / LIGHT / HUMAN /'

function renderLayer(layer: SceneLayer) {
  const style: CSSProperties = { opacity: layer.opacity }
  switch (layer.type) {
    case 'portrait':
      return (
        <div key={layer.id} className="scene__subject" style={style} aria-hidden="true">
          <SubjectPortrait />
        </div>
      )
    case 'code-rain': {
      const columns = Math.max(1, Math.round(layer.density * 8))
      return (
        <div key={layer.id} className="scene__rain" style={style} aria-hidden="true">
          {Array.from({ length: columns }, (_, index) => (
            <span key={index} style={{ animationDelay: `${(index / columns) * -13}s` }}>{RAIN_TEXT}</span>
          ))}
        </div>
      )
    }
    case 'lighting':
      return (
        <div
          key={layer.id}
          className="scene__aura"
          style={{ ...style, '--aura-intensity': layer.intensity } as CSSProperties}
          aria-hidden="true"
        />
      )
    case 'particles':
      return (
        <div key={layer.id} className="scene__particles" style={style} aria-hidden="true">
          {Array.from({ length: layer.count }, (_, index) => (
            <span
              key={index}
              className="particle"
              style={{ left: `${(index * 47) % 100}%`, top: `${(index * 71) % 100}%`, animationDelay: `${(index % 10) * 0.4}s` }}
            />
          ))}
        </div>
      )
  }
}

export function SceneFallback({ scene }: SceneFallbackProps) {
  const motionClass = scene.reducedMotion ? 'scene--still' : 'scene--animated'
  const sceneRef = useRef<HTMLElement>(null)
  const activeLayers = useMemo(() => selectActiveLayers(scene), [scene])
  const titleId = useId()

  useEffect(() => {
    if (!sceneRef.current) return
    const host = createCssRendererHost({ target: sceneRef.current })
    host.start()
    return () => host.dispose()
  }, [])

  return (
    <section ref={sceneRef} className={`scene scene--${scene.format} ${motionClass}`} aria-labelledby={titleId}>
      {activeLayers.map(renderLayer)}
      <div className="scene__content">
        <p className="scene__eyebrow">{scene.eyebrow}</p>
        <h1 id={titleId}>{scene.title}</h1>
        <p className="scene__body">A renderer-independent scene foundation with a dependable CSS fallback.</p>
        <button type="button" className="scene__button">Explore the system <span aria-hidden="true">→</span></button>
      </div>
    </section>
  )
}