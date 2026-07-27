import { describe, expect, it } from 'vitest'
import { selectRenderer } from './select'

describe('selectRenderer', () => {
  it('chooses CSS when enhancement is unavailable or inappropriate', () => {
    expect(selectRenderer({ prefersReducedMotion: false, supportsWebGL: false, constrainedDevice: false })).toBe('css')
    expect(selectRenderer({ prefersReducedMotion: true, supportsWebGL: true, constrainedDevice: false })).toBe('css')
  })

  it('chooses WebGL only for capable, motion-permitting environments', () => {
    expect(selectRenderer({ prefersReducedMotion: false, supportsWebGL: true, constrainedDevice: false })).toBe('webgl')
  })
})