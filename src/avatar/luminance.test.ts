import { describe, expect, it } from 'vitest'
import { computeContainBox, rgbaToLuminance } from './luminance'

describe('computeContainBox', () => {
  it('pillarboxes a tall source in a wide destination, anchored bottom-center', () => {
    // 400×500 portrait into an 80×50 grid → full height, centered flanks.
    const box = computeContainBox(400, 500, 80, 50)
    expect(box.dh).toBe(50)
    expect(box.dw).toBe(40)
    expect(box.dx).toBe(20)
    expect(box.dy).toBe(0)
  })

  it('letterboxes a wide source in a tall destination, resting on the bottom edge', () => {
    const box = computeContainBox(200, 100, 40, 60)
    expect(box.dw).toBe(40)
    expect(box.dh).toBe(20)
    expect(box.dx).toBe(0)
    expect(box.dy).toBe(40) // bottom-anchored: the subject stands on the frame edge
  })

  it('fills exactly when aspect ratios match', () => {
    const box = computeContainBox(400, 500, 40, 50)
    expect(box).toEqual({ dx: 0, dy: 0, dw: 40, dh: 50 })
  })

  it('degrades safely on zero-sized input', () => {
    const box = computeContainBox(0, 0, 40, 50)
    expect(box.dw).toBe(0)
    expect(box.dh).toBe(0)
  })
})

describe('rgbaToLuminance', () => {
  it('weights RGB per Rec. 601 and scales by alpha', () => {
    const rgba = new Uint8ClampedArray([
      255, 255, 255, 255, // opaque white → 1
      255, 255, 255, 127, // half-transparent white → ~0.5
      255, 0, 0, 255, // pure red → 0.299
      0, 0, 0, 255, // opaque black → 0
    ])
    const out = new Float32Array(4)
    rgbaToLuminance(rgba, out)
    expect(out[0]).toBeCloseTo(1, 5)
    expect(out[1]).toBeCloseTo(127 / 255, 2)
    expect(out[2]).toBeCloseTo(0.299, 3)
    expect(out[3]).toBe(0)
  })

  it('never reads past the shorter of buffer and grid', () => {
    const rgba = new Uint8ClampedArray([255, 255, 255, 255])
    const out = new Float32Array(4)
    rgbaToLuminance(rgba, out)
    expect(out[0]).toBeCloseTo(1)
    expect(out[1]).toBe(0)
  })
})
