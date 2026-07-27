import { describe, expect, it } from 'vitest'
import { createCssRendererHost, type BrowserLifecycleEnvironment } from './cssRendererHost'

function createHarness() {
  let hidden = false
  let visibilityListener: (() => void) | undefined
  let intersectionCallback: ((entries: readonly { isIntersecting: boolean }[]) => void) | undefined
  let disconnects = 0
  const classes = new Set<string>()
  const target = {
    classList: {
      toggle(name: string, force?: boolean) { if (force) classes.add(name); else classes.delete(name) },
      remove(name: string) { classes.delete(name) },
    },
    dataset: {},
  } as unknown as HTMLElement
  const environment: BrowserLifecycleEnvironment = {
    document: {
      get hidden() { return hidden },
      addEventListener(_type, listener) { visibilityListener = listener },
      removeEventListener() { visibilityListener = undefined },
    },
    createIntersectionObserver(callback) {
      intersectionCallback = callback
      return { observe() {}, disconnect() { disconnects += 1 } }
    },
  }
  return {
    classes, target, environment,
    setHidden(value: boolean) { hidden = value; visibilityListener?.() },
    setIntersecting(value: boolean) { intersectionCallback?.([{ isIntersecting: value }]) },
    get disconnects() { return disconnects },
    get hasVisibilityListener() { return Boolean(visibilityListener) },
  }
}

describe('createCssRendererHost', () => {
  it('pauses for hidden or offscreen states and resumes only when eligible', () => {
    const harness = createHarness()
    const host = createCssRendererHost({ target: harness.target, environment: harness.environment })
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

  it('honors manual pause and removes listeners and observer on dispose', () => {
    const harness = createHarness()
    const host = createCssRendererHost({ target: harness.target, environment: harness.environment })
    host.start()
    host.pause()
    expect(host.getState()).toBe('paused')
    host.resume()
    expect(host.getState()).toBe('running')
    host.dispose()
    expect(host.getState()).toBe('disposed')
    expect(harness.disconnects).toBe(1)
    expect(harness.hasVisibilityListener).toBe(false)
    expect(harness.classes.has('scene--paused')).toBe(false)
  })
})