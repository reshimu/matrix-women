import { useEffect, useState } from 'react'
import type { DragEvent } from 'react'
import type { SceneConfig, SceneFormat, SceneLayer } from '../scene'
import { exportSceneConfig, importSceneConfig } from '../scene'
import { Scene } from './Scene'
import {
  LAYER_TYPES,
  createLayer,
  createScene,
  duplicateScene,
  loadBuilderState,
  moveLayer,
  reorderLayers,
  removeLayer,
  saveBuilderState,
} from './builderState'
import type { BuilderState } from './builderState'

const FORMATS: readonly SceneFormat[] = ['hero', 'portrait', 'square']

function updateLayerField(scene: SceneConfig, layerId: string, patch: Record<string, number>): SceneConfig {
  return {
    ...scene,
    layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
  }
}

export function SceneBuilder() {
  const [state, setState] = useState<BuilderState>(() => loadBuilderState())
  const [importText, setImportText] = useState('')
  const [importIssues, setImportIssues] = useState<readonly string[]>([])

  useEffect(() => {
    saveBuilderState(state)
  }, [state])

  const scene = state.scenes.find((candidate) => candidate.id === state.activeId) ?? state.scenes[0]
  const exportedJson = exportSceneConfig(scene)
  const availableTypesToAdd = LAYER_TYPES.filter((type) => !scene.layers.some((layer) => layer.type === type))

  function updateActiveScene(updater: (scene: SceneConfig) => SceneConfig) {
    setState((prev) => ({
      ...prev,
      scenes: prev.scenes.map((candidate) => (candidate.id === prev.activeId ? updater(candidate) : candidate)),
    }))
  }

  function handleNewScene() {
    const next = createScene(state.scenes)
    setState((prev) => ({ scenes: [...prev.scenes, next], activeId: next.id }))
  }

  function handleDuplicateScene() {
    const next = duplicateScene(scene, state.scenes)
    setState((prev) => ({ scenes: [...prev.scenes, next], activeId: next.id }))
  }

  function handleDeleteScene() {
    if (state.scenes.length <= 1) return
    const remaining = state.scenes.filter((candidate) => candidate.id !== scene.id)
    setState({ scenes: remaining, activeId: remaining[0].id })
  }

  function applyImport() {
    const result = importSceneConfig(importText)
    if (!result.ok) {
      setImportIssues(result.issues)
      return
    }
    setImportIssues([])
    setState((prev) => {
      const exists = prev.scenes.some((candidate) => candidate.id === result.value.id)
      const scenes = exists
        ? prev.scenes.map((candidate) => (candidate.id === result.value.id ? result.value : candidate))
        : [...prev.scenes, result.value]
      return { scenes, activeId: result.value.id }
    })
  }

  function handleDragStart(event: DragEvent<HTMLLIElement>, layerId: string) {
    event.dataTransfer.setData('text/plain', layerId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, targetLayerId: string) {
    event.preventDefault()
    const draggedId = event.dataTransfer.getData('text/plain')
    if (!draggedId) return
    updateActiveScene((s) => ({ ...s, layers: reorderLayers(s.layers, draggedId, targetLayerId) }))
  }

  return (
    <div className="builder">
      <p className="demo-format__label">Builder (multi-scene, layer editing, config round-trip)</p>

      <div className="builder__scenes">
        <label className="builder__field">
          Scene
          <select value={scene.id} onChange={(event) => setState((prev) => ({ ...prev, activeId: event.target.value }))}>
            {state.scenes.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title || candidate.id}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleNewScene}>
          + New scene
        </button>
        <button type="button" onClick={handleDuplicateScene}>
          Duplicate
        </button>
        <button type="button" onClick={handleDeleteScene} disabled={state.scenes.length <= 1}>
          Delete
        </button>
      </div>

      <div className="builder__layout">
        <form className="builder__controls" onSubmit={(event) => event.preventDefault()}>
          <label className="builder__field">
            Title
            <input
              type="text"
              value={scene.title}
              onChange={(event) => updateActiveScene((s) => ({ ...s, title: event.target.value }))}
            />
          </label>

          <label className="builder__field">
            Eyebrow
            <input
              type="text"
              value={scene.eyebrow}
              onChange={(event) => updateActiveScene((s) => ({ ...s, eyebrow: event.target.value }))}
            />
          </label>

          <label className="builder__field">
            Format
            <select
              value={scene.format}
              onChange={(event) => updateActiveScene((s) => ({ ...s, format: event.target.value as SceneFormat }))}
            >
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
              onChange={(event) => updateActiveScene((s) => ({ ...s, reducedMotion: event.target.checked }))}
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
                  onChange={(event) =>
                    updateActiveScene((s) => ({ ...s, effects: { ...s.effects, [effect]: event.target.checked } }))
                  }
                />
                {effect}
              </label>
            ))}
          </fieldset>

          <fieldset className="builder__fieldset">
            <legend>Layers</legend>
            <ul className="builder__layers">
              {scene.layers.map((layer, index) => (
                <li
                  key={layer.id}
                  className="builder__layer"
                  draggable
                  onDragStart={(event) => handleDragStart(event, layer.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, layer.id)}
                >
                  <div className="builder__layer-header">
                    <span className="builder__layer-handle" aria-hidden="true">
                      ⠿
                    </span>
                    <strong>{layer.type}</strong>
                    <span className="builder__layer-id">{layer.id}</span>
                    <span className="builder__layer-actions">
                      <button
                        type="button"
                        aria-label={`Move ${layer.id} up`}
                        disabled={index === 0}
                        onClick={() => updateActiveScene((s) => ({ ...s, layers: moveLayer(s.layers, layer.id, 'up') }))}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${layer.id} down`}
                        disabled={index === scene.layers.length - 1}
                        onClick={() => updateActiveScene((s) => ({ ...s, layers: moveLayer(s.layers, layer.id, 'down') }))}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${layer.id}`}
                        onClick={() => updateActiveScene((s) => ({ ...s, layers: removeLayer(s.layers, layer.id) }))}
                      >
                        ✕
                      </button>
                    </span>
                  </div>

                  <label className="builder__field">
                    Opacity ({layer.opacity.toFixed(2)})
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={layer.opacity}
                      onChange={(event) => updateActiveScene((s) => updateLayerField(s, layer.id, { opacity: Number(event.target.value) }))}
                    />
                  </label>

                  {layer.type === 'code-rain' && (
                    <label className="builder__field">
                      Density ({layer.density.toFixed(2)})
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={layer.density}
                        onChange={(event) => updateActiveScene((s) => updateLayerField(s, layer.id, { density: Number(event.target.value) }))}
                      />
                    </label>
                  )}

                  {layer.type === 'lighting' && (
                    <label className="builder__field">
                      Intensity ({layer.intensity.toFixed(2)})
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={layer.intensity}
                        onChange={(event) => updateActiveScene((s) => updateLayerField(s, layer.id, { intensity: Number(event.target.value) }))}
                      />
                    </label>
                  )}

                  {layer.type === 'particles' && (
                    <label className="builder__field">
                      Count ({layer.count})
                      <input
                        type="range"
                        min={0}
                        max={200}
                        step={1}
                        value={layer.count}
                        onChange={(event) => updateActiveScene((s) => updateLayerField(s, layer.id, { count: Number(event.target.value) }))}
                      />
                    </label>
                  )}
                </li>
              ))}
            </ul>

            {availableTypesToAdd.length > 0 && (
              <div className="builder__add-layer">
                {availableTypesToAdd.map((type: SceneLayer['type']) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateActiveScene((s) => ({ ...s, layers: [...s.layers, createLayer(type, s.layers)] }))}
                  >
                    + Add {type} layer
                  </button>
                ))}
              </div>
            )}
          </fieldset>
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
