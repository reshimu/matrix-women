import { describe, expect, it } from 'vitest'
import { computePortraitBox } from './portraitLayout'

describe('computePortraitBox', () => {
  it('preserves the 400:500 portrait aspect ratio for the hero region', () => {
    const box = computePortraitBox('hero', 1440, 900)
    expect(box.width / box.height).toBeCloseTo(400 / 500, 5)
  })

  it('anchors the box to the bottom of its region', () => {
    const box = computePortraitBox('hero', 1440, 900)
    expect(box.y + box.height).toBeCloseTo(900, 5)
  })

  it('centers the box within a portrait/square region', () => {
    const box = computePortraitBox('square', 800, 800)
    const region = { x: 800 * 0.19, width: 800 * 0.62 }
    const regionCenter = region.x + region.width / 2
    expect(box.x + box.width / 2).toBeCloseTo(regionCenter, 5)
  })

  it('never exceeds the allotted region on either axis', () => {
    const box = computePortraitBox('portrait', 320, 700)
    expect(box.width).toBeLessThanOrEqual(320 * 0.62 + 1e-6)
    expect(box.height).toBeLessThanOrEqual(700 * 0.55 + 1e-6)
  })
})
