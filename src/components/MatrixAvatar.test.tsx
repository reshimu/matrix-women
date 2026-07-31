// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MatrixAvatar } from './MatrixAvatar'

// jsdom has no canvas 2D context, so this is a lifecycle smoke test: the component
// must mount, degrade gracefully without a context, and unmount without leaking.
describe('MatrixAvatar', () => {
  it('renders an aria-hidden canvas and survives mount/unmount without a 2D context', () => {
    const { container, unmount } = render(<MatrixAvatar />)
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
    unmount()
  })

  it('accepts reducedMotion and an explicit null source', () => {
    const { unmount } = render(<MatrixAvatar source={null} reducedMotion />)
    unmount()
  })
})
