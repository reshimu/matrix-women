// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach } from 'vitest'
import { VoiceViz } from './VoiceViz'

afterEach(() => {
  cleanup()
})

describe('VoiceViz', () => {
  it('mounts, renders one frame, and unmounts without throwing', async () => {
    const frames = [{ energy: 0.5, low: 0.3, centroid: 0.2 }]
    const { unmount } = render(
      <VoiceViz driverSource={{ kind: 'curve', frames, frameRate: 30 }} />,
    )

    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(() => unmount()).not.toThrow()
  })
})
