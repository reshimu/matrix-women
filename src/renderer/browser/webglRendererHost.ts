import type { BrowserLifecycleEnvironment, Observer } from './environment'
import { createDefaultBrowserEnvironment } from './environment'

export type WebglRendererLifecycleState = 'inactive' | 'running' | 'paused' | 'context-lost' | 'disposed'

type ContextEvent = Readonly<{ preventDefault?(): void }>
type ContextEventType = 'webglcontextlost' | 'webglcontextrestored'

type WebglLifecycleTarget = {
  dataset: DOMStringMap
  addEventListener(type: ContextEventType, listener: (event: ContextEvent) => void): void
  removeEventListener(type: ContextEventType, listener: (event: ContextEvent) => void): void
}

export type WebglRendererHostOptions = Readonly<{
  target: WebglLifecycleTarget
  environment?: BrowserLifecycleEnvironment
  onStateChange?(state: WebglRendererLifecycleState): void
}>

export type WebglRendererHost = Readonly<{
  start(): void
  pause(): void
  resume(): void
  dispose(): void
  getState(): WebglRendererLifecycleState
}>

export function createWebglRendererHost(options: WebglRendererHostOptions): WebglRendererHost {
  const environment = options.environment ?? createDefaultBrowserEnvironment()
  let state: WebglRendererLifecycleState = 'inactive'
  let isIntersecting = true
  let manuallyPaused = false
  let contextLost = false
  let observer: Observer | undefined

  const applyState = (next: WebglRendererLifecycleState) => {
    if (state === next) return
    state = next
    options.target.dataset.rendererState = state
    options.onStateChange?.(state)
  }

  const synchronize = () => {
    if (state === 'inactive' || state === 'disposed') return
    if (contextLost) {
      applyState('context-lost')
      return
    }
    applyState(manuallyPaused || environment.document.hidden || !isIntersecting ? 'paused' : 'running')
  }

  const onVisibilityChange = () => synchronize()
  const onContextLost = (event: ContextEvent) => {
    event.preventDefault?.()
    contextLost = true
    synchronize()
  }
  const onContextRestored = () => {
    contextLost = false
    synchronize()
  }

  return {
    start() {
      if (state === 'disposed' || state !== 'inactive') return
      environment.document.addEventListener('visibilitychange', onVisibilityChange)
      options.target.addEventListener('webglcontextlost', onContextLost)
      options.target.addEventListener('webglcontextrestored', onContextRestored)
      observer = environment.createIntersectionObserver((entries) => {
        isIntersecting = entries.some((entry) => entry.isIntersecting)
        synchronize()
      })
      observer.observe(options.target as unknown as Element)
      applyState('running')
      synchronize()
    },
    pause() {
      if (state === 'disposed' || state === 'inactive') return
      manuallyPaused = true
      synchronize()
    },
    resume() {
      if (state === 'disposed' || state === 'inactive') return
      manuallyPaused = false
      synchronize()
    },
    dispose() {
      if (state === 'disposed') return
      environment.document.removeEventListener('visibilitychange', onVisibilityChange)
      options.target.removeEventListener('webglcontextlost', onContextLost)
      options.target.removeEventListener('webglcontextrestored', onContextRestored)
      observer?.disconnect()
      options.target.dataset.rendererState = 'disposed'
      applyState('disposed')
    },
    getState() {
      return state
    },
  }
}
