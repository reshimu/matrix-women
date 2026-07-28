import { useMemo, useState } from 'react'
import type { SceneConfig, SceneFormat } from '../scene'
import { defaultScene, exportSceneConfig, importSceneConfig } from '../scene'
import { Scene } from './Scene'

const FORMATS: readonly SceneFormat[] = ['hero', 'portrait', 'square']

function updateLayer(scene: SceneConfig, layerId: string, patch: Record<string, number>): SceneConfig {
  return {
    ...scene,
    layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
  }
}

export function SceneBuilder() {
  const [scene, setScene] = useState<SceneConfig>(defaultScene)
  const [importText, setImportText] = useState('')
  const [importIssues, setImportIssues] = useState<readonly string[]>([])

  const exportedJson = useMemo(() => exportSceneConfig(scene), [scene])

  const subjectLayer = scene.layers.find((layer) => layer.type === 'portrait')
  const rainLayer = scene.layers.find((layer) => layer.type === 'code-rain')
  const lightingLayer = scene.layers.find((layer) => layer.type === 'lighting')

  const applyImport = () => {
    const result = importSceneConfig(importText)
    if (result.ok) {
      setScene(result.value)
      setImportIssues([])
    } else {
      setImportIssues(result.issues)
    }
  }

  return (
    <div className="builder">
      <p className="demo-format__label">Builder (config round-trip demo)</p>
      <div className="builder__layout">
        <form className="builder__controls" onSubmit={(event) => event.preventDefault()}>
          <label className="builder__field">
            Format
            <select value={scene.format} onChange={(event) => setScene({ ...scene, format: event.target.value as SceneFormat })}>
              {FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </label>

          <label className="builder__field builder__field--checkbox">
            <input
              type="checkbox"
              checked={scene.reducedMotion}
              onChange={(event) => setScene({ ...scene, reducedMotion: event.target.checked })}
            />
            Reduced motion
          </label>

          <fieldset className="builder__fieldset">
            <legend>Effects</legend>
            {(['codeRain', 'particles', 'glow'] as const).map((effect) => (
              <label key={effect} className="builder__field builder__field--checkbox">
                <input
                  type="checkbox"
                  checked={scene.effects[effect]}
                  onChange={(event) => setScene({ ...scene, effects: { ...scene.effects, [effect]: event.target.checked } })}
                />
                {effect}
              </label>
            ))}
          </fieldset>

          {subjectLayer && (
            <label className="builder__field">
              Subject opacity ({subjectLayer.opacity.toFixed(2)})
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={subjectLayer.opacity}
                onChange={(event) => setScene(updateLayer(scene, subjectLayer.id, { opacity: Number(event.target.value) }))}
              />
            </label>
          )}

          {rainLayer && rainLayer.type === 'code-rain' && (
            <label className="builder__field">
              Rain density ({rainLayer.density.toFixed(2)})
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={rainLayer.density}
                onChange={(event) => setScene(updateLayer(scene, rainLayer.id, { density: Number(event.target.value) }))}
              />
            </label>
          )}

          {lightingLayer && lightingLayer.type === 'lighting' && (
            <label className="builder__field">
              Glow intensity ({lightingLayer.intensity.toFixed(2)})
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={lightingLayer.intensity}
                onChange={(event) => setScene(updateLayer(scene, lightingLayer.id, { intensity: Number(event.target.value) }))}
              />
            </label>
          )}
        </form>

        <div className="builder__preview">
          <Scene scene={scene} />
        </div>
      </div>

      <div className="builder__io">
        <label className="builder__field">
          Exported JSON (reflects the controls above)
          <textarea className="builder__textarea" readOnly value={exportedJson} rows={12} />
        </label>

        <label className="builder__field">
          Import JSON (paste a config, e.g. the exported JSON above, then Apply)
          <textarea
            className="builder__textarea"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={12}
            placeholder="Paste scene configuration JSON here"
          />
        </label>

        <button type="button" className="builder__apply" onClick={applyImport}>
          Apply imported JSON
        </button>

        {importIssues.length > 0 && (
          <ul className="builder__issues">
            {importIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
