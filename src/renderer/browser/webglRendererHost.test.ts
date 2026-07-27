import { describe, expect, it } from 'vitest'
import { createWebglRendererHost } from './webglRendererHost'

type FakeEvent = Readonly<{ preventDefault?(): void }>
type FakeListener = (event: FakeEvent) => void

function createHarness() {
  let hidden = false
  let visibilityListener: (() => void) | undefined
  let intersectionCallback: ((entries: readonly { isIntersecting: boolean }[]) => void) | undefined
  let contextLostListener: FakeListener | undefined
  let contextRestoredListener: FakeListener | undefined
  let disconnects = 0
  const dataset: Record<string, string> = {}

  const target = {
    dataset,
    addEventListener(type: 'webglcontextlost' | 'webglcontextrestored', listener: FakeListener) {
      if (type === 'webglcontextlost') contextLostListener = listener
      else contextRestoredListener = listener
    },
    removeEventListener(type: 'webglcontextlost' | 'webglcontextrestored') {
      if (type === 'webglcontextlost') contextLostListener = undefined
      else contextRestoredListener = undefined
    },
  }

  const environment = {
    document: {
      get hidden() {
        return hidden
      },
      addEventListener(_type: 'visibilitychange', listener: () => void) {
        visibilityListener = listener
      },
      removeEventListener() {
        visibilityListener = undefined
      },
    },
    createIntersectionObserver(callback: (entries: readonly { isIntersecting: boolean }[]) => void) {
      intersectionCallback = callback
      return { observe() {}, disconnect() { disconnects += 1 } }
    },
  }

  return {
    target,
    environment,
    dataset,
    setHidden(value: boolean) {
      hidden = value
      visibilityListener?.()
    },
    setIntersecting(value: boolean) {
      intersectionCallback?.([{ isIntersecting: value }])
    },
    loseContext() {
      contextLostListener?.({ preventDefault() {} })
    },
    restoreContext() {
      contextRestoredListener?.({})
    },
    get disconnects() {
      return disconnects
    },
    get hasVisibilityListener() {
      return Boolean(visibilityListener)
    },
    get hasContextListeners() {
      return Boolean(contextLostListener) || Boolean(contextRestoredListener)
    },
  }
}

describe('createWebglRendererHost', () => {
  it('pauses for hidden or offscreen states and resumes only when eligible', () => {
    const harness = createHarness()
    const host = createWebglRendererHost({ target: harness.target, environment: harness.environment })
    host.start()
    expect(host.getState()).toBe('running')
    harness.setHidden(true)
    expect(host.getState()).toBe('paused')
    harness.setIntersecting(false)
    harness.setHidden(false)
    expect(host.getState()).toBe('paused')
    harness.setIntersecting(true)
    expect(host.getState()).toBe('running')
  })

  it('enters context-lost on webglcontextlost and recovers on webglcontextrestored', () => {
    const harness = createHarness()
    const host = createWebglRendererHost({ target: harness.target, environment: harness.environment })
    host.start()
    harness.loseContext()
    expect(host.getState()).toBe('context-lost')
    harness.restoreContext()
    expect(host.getState()).toBe('running')
  })

  it('stays context-lost even if the document becomes visible and intersecting again', () => {
    const harness = createHarness()
    const host = createWebglRendererHost({ target: harness.target, environment: harness.environment })
    host.start()
    harness.loseContext()
    harness.setHidden(true)
    harness.setHidden(false)
    harness.setIntersecting(true)
    expect(host.getState()).toBe('context-lost')
  })

  it('honors manual pause and removes listeners and observer on dispose', () => {
    const harness = createHarness()
    const host = createWebglRendererHost({ target: harness.target, environment: harness.environment })
    host.start()
    host.pause()
    expect(host.getState()).toBe('paused')
    host.resume()
    expect(host.getState()).toBe('running')
    host.dispose()
    expect(host.getState()).toBe('disposed')
    expect(harness.disconnects).toBe(1)
    expect(harness.hasVisibilityListener).toBe(false)
    expect(harness.hasContextListeners).toBe(false)
  })
})
