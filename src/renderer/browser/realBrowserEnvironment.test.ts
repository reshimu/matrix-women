// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultBrowserEnvironment } from './environment'
import { createCssRendererHost } from './cssRendererHost'
import { createWebglRendererHost } from './webglRendererHost'

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }

  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

describe('createDefaultBrowserEnvironment against real jsdom DOM/events', () => {
  it('wires visibilitychange through real document event dispatch', () => {
    const environment = createDefaultBrowserEnvironment()
    let firedCount = 0
    const listener = () => {
      firedCount += 1
    }
    environment.document.addEventListener('visibilitychange', listener)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(firedCount).toBe(1)

    environment.document.removeEventListener('visibilitychange', listener)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(firedCount).toBe(1)
  })

  it('creates an intersection observer via the real global constructor', () => {
    const environment = createDefaultBrowserEnvironment()
    const seen: boolean[] = []
    const observer = environment.createIntersectionObserver((entries) => seen.push(entries[0].isIntersecting))
    const target = document.createElement('div')

    observer.observe(target)
    const instance = FakeIntersectionObserver.instances[0]
    expect(instance.observe).toHaveBeenCalledWith(target)

    instance.trigger(true)
    expect(seen).toEqual([true])

    observer.disconnect()
    expect(instance.disconnect).toHaveBeenCalled()
  })
})

describe('createCssRendererHost against the real default browser environment (jsdom)', () => {
  it('starts, pauses on a real document.hidden + visibilitychange dispatch, resumes, and disposes cleanly', () => {
    const target = document.createElement('section')
    document.body.appendChild(target)
    const host = createCssRendererHost({ target })

    host.start()
    expect(host.getState()).toBe('running')

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(host.getState()).toBe('paused')
    expect(target.classList.contains('scene--paused')).toBe(true)

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(host.getState()).toBe('running')
    expect(target.classList.contains('scene--paused')).toBe(false)

    host.dispose()
    expect(host.getState()).toBe('disposed')

    document.body.removeChild(target)
  })

  it('pauses when the real intersection observer reports offscreen', () => {
    const target = document.createElement('section')
    document.body.appendChild(target)
    const host = createCssRendererHost({ target })

    host.start()
    const instance = FakeIntersectionObserver.instances[0]
    instance.trigger(false)
    expect(host.getState()).toBe('paused')

    instance.trigger(true)
    expect(host.getState()).toBe('running')

    host.dispose()
    document.body.removeChild(target)
  })
})

describe('createWebglRendererHost against the real default browser environment (jsdom)', () => {
  it('starts, pauses on real document.hidden, and disposes cleanly', () => {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    const host = createWebglRendererHost({ target: canvas })

    host.start()
    expect(host.getState()).toBe('running')

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(host.getState()).toBe('paused')

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(host.getState()).toBe('running')

    host.dispose()
    expect(host.getState()).toBe('disposed')

    document.body.removeChild(canvas)
  })

  it('enters context-lost on a real webglcontextlost event and recovers on restore', () => {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    const host = createWebglRendererHost({ target: canvas })

    host.start()
    canvas.dispatchEvent(new Event('webglcontextlost'))
    expect(host.getState()).toBe('context-lost')

    canvas.dispatchEvent(new Event('webglcontextrestored'))
    expect(host.getState()).toBe('running')

    host.dispose()
    document.body.removeChild(canvas)
  })
})
