export type RendererLifecycleState = 'inactive' | 'running' | 'paused' | 'disposed'

type ObserverEntry = Readonly<{ isIntersecting: boolean }>
type Observer = Readonly<{ observe(target: Element): void; disconnect(): void }>
type DocumentPort = Readonly<{
  hidden: boolean
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}>

type LifecycleTarget = HTMLElement & { dataset: DOMStringMap }

export type BrowserLifecycleEnvironment = Readonly<{
  document: DocumentPort
  createIntersectionObserver(callback: (entries: readonly ObserverEntry[]) => void): Observer
}>

export type CssRendererHostOptions = Readonly<{
  target: LifecycleTarget
  environment?: BrowserLifecycleEnvironment
  onStateChange?(state: RendererLifecycleState): void
}>

export type CssRendererHost = Readonly<{
  start(): void
  pause(): void
  resume(): void
  dispose(): void
  getState(): RendererLifecycleState
}>

function browserEnvironment(): BrowserLifecycleEnvironment {
  return {
    document: window.document,
    createIntersectionObserver: (callback) => new IntersectionObserver(callback),
  }
}

export function createCssRendererHost(options: CssRendererHostOptions): CssRendererHost {
  const environment = options.environment ?? browserEnvironment()
  let state: RendererLifecycleState = 'inactive'
  let isIntersecting = true
  let manuallyPaused = false
  let observer: Observer | undefined

  const applyState = (next: RendererLifecycleState) => {
    if (state === next) return
    state = next
    options.target.classList.toggle('scene--paused', state === 'paused')
    options.target.dataset.rendererState = state
    options.onStateChange?.(state)
  }

  const synchronize = () => {
    if (state === 'inactive' || state === 'disposed') return
    applyState(manuallyPaused || environment.document.hidden || !isIntersecting ? 'paused' : 'running')
  }

  const onVisibilityChange = () => synchronize()

  return {
    start() {
      if (state === 'disposed' || state !== 'inactive') return
      environment.document.addEventListener('visibilitychange', onVisibilityChange)
      observer = environment.createIntersectionObserver((entries) => {
        isIntersecting = entries.some((entry) => entry.isIntersecting)
        synchronize()
      })
      observer.observe(options.target)
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
      observer?.disconnect()
      options.target.classList.remove('scene--paused')
      options.target.dataset.rendererState = 'disposed'
      applyState('disposed')
    },
    getState() {
      return state
    },
  }
}