// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SceneFallback } from './SceneFallback'
import { defaultScene } from '../scene'

class FakeIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  constructor() {}
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('SceneFallback accessibility', () => {
  it('renders a real, focusable, enabled button with visible accessible text', () => {
    render(<SceneFallback scene={defaultScene} />)
    const button = screen.getByRole('button', { name: /explore the system/i })

    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(button.tabIndex).toBe(0)

    button.focus()
    expect(document.activeElement).toBe(button)
  })

  it('labels the scene section from a real heading id (aria-labelledby is not dangling)', () => {
    render(<SceneFallback scene={defaultScene} />)
    const heading = screen.getByRole('heading', { level: 1 })
    const section = heading.closest('section')

    expect(section).not.toBeNull()
    expect(section?.getAttribute('aria-labelledby')).toBe(heading.id)
    expect(heading.id).toBeTruthy()
  })

  it('hides purely decorative layers from assistive tech via aria-hidden', () => {
    render(<SceneFallback scene={defaultScene} />)
    const heading = screen.getByRole('heading', { level: 1 })
    const section = heading.closest('section') as HTMLElement
    const decorativeLayers = section.querySelectorAll(':scope > [aria-hidden="true"]')

    expect(decorativeLayers.length).toBeGreaterThan(0)
  })

  it('respects reducedMotion by toggling scene--still vs scene--animated', () => {
    const { unmount } = render(<SceneFallback scene={{ ...defaultScene, reducedMotion: false }} />)
    expect(document.querySelector('.scene')?.classList.contains('scene--animated')).toBe(true)
    expect(document.querySelector('.scene')?.classList.contains('scene--still')).toBe(false)
    unmount()

    render(<SceneFallback scene={{ ...defaultScene, reducedMotion: true }} />)
    expect(document.querySelector('.scene')?.classList.contains('scene--still')).toBe(true)
    expect(document.querySelector('.scene')?.classList.contains('scene--animated')).toBe(false)
  })
})
