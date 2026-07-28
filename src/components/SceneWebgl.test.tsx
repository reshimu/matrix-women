// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SceneWebgl } from './SceneWebgl'
import { defaultScene } from '../scene'

class FakeIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  constructor() {}
}

class FakeResizeObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  constructor() {}
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('SceneWebgl asset-failure resilience', () => {
  it('renders without throwing and keeps content accessible when WebGL is unavailable', () => {
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<SceneWebgl scene={defaultScene} />)).not.toThrow()

    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByRole('button', { name: /explore the system/i })).toBeTruthy()
    expect(document.querySelector('.scene__webgl-canvas')).not.toBeNull()
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    getContextSpy.mockRestore()
  })

  it('disposes cleanly on unmount even when WebGL is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { unmount } = render(<SceneWebgl scene={defaultScene} />)
    expect(() => unmount()).not.toThrow()
  })
})
