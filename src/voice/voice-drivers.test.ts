import { describe, expect, it } from 'vitest'
import {
  advanceDrivers,
  createDriverState,
  readCentroid,
  readEnergy,
  smooth,
} from './voice-drivers.js'

describe('smooth', () => {
  it('rises faster than it falls given identical deltas', () => {
    const dt = 0.01
    const risen = smooth(0, 1, dt) - 0
    const fallen = 1 - smooth(1, 0, dt)
    expect(risen).toBeGreaterThan(fallen)
  })

  it('is frame-rate independent: 2 steps at dt=0.008 ~= 1 step at dt=0.016', () => {
    const target = 1
    const oneStep = smooth(0, target, 0.016)
    const twoSteps = smooth(smooth(0, target, 0.008), target, 0.008)
    expect(twoSteps).toBeCloseTo(oneStep, 6)
  })
})

describe('readEnergy', () => {
  it('returns 0 for a silent buffer', () => {
    expect(readEnergy(new Float32Array(256))).toBe(0)
  })

  it('returns ~0.707 for a full-scale sine', () => {
    const samples = 1000
    const buffer = new Float32Array(samples)
    for (let i = 0; i < samples; i += 1) {
      buffer[i] = Math.sin((i / samples) * Math.PI * 2 * 10)
    }
    expect(readEnergy(buffer)).toBeCloseTo(Math.SQRT1_2, 2)
  })
})

describe('readCentroid', () => {
  const sampleRate = 44100
  const fftSize = 2048
  const binCount = fftSize / 2

  it('returns 0 for an empty spectrum', () => {
    expect(readCentroid(new Uint8Array(binCount), sampleRate, fftSize)).toBe(0)
  })

  it('rises as energy moves to higher bins', () => {
    const low = new Uint8Array(binCount)
    low[5] = 255
    const high = new Uint8Array(binCount)
    high[150] = 255

    const lowCentroid = readCentroid(low, sampleRate, fftSize)
    const highCentroid = readCentroid(high, sampleRate, fftSize)
    expect(highCentroid).toBeGreaterThan(lowCentroid)
  })
})

describe('advanceDrivers', () => {
  it('applies breathing only below IDLE_ENERGY_THRESHOLD', () => {
    // dt=1s is many attack/release time-constants, so a single step converges
    // to (very close to) the frame's instantaneous target -- deterministic.
    const idle = advanceDrivers(createDriverState(), { energy: 0, low: 0, centroid: 0 }, 1)
    expect(idle.jawOpen).toBeGreaterThan(0)

    const active = advanceDrivers(createDriverState(), { energy: 0.5, low: 0, centroid: 0 }, 1)
    expect(active.jawOpen).toBeCloseTo(0.5, 2)
  })

  it('fires blink on its own timer with zero audio input, and re-arms within the 3-6s window', () => {
    const state = createDriverState()
    const dt = 0.01
    let sawBlink = false
    let blinkResetAt = -1

    for (let step = 0; step < 700; step += 1) {
      advanceDrivers(state, { energy: 0, low: 0, centroid: 0 }, dt)
      if (state.blink > 0) sawBlink = true
      if (sawBlink && state.blink === 0 && blinkResetAt < 0) {
        blinkResetAt = state.elapsed
        break
      }
    }

    expect(sawBlink).toBe(true)
    expect(blinkResetAt).toBeGreaterThanOrEqual(3.0)
    expect(state.nextBlinkAt - blinkResetAt).toBeGreaterThanOrEqual(3.0)
    expect(state.nextBlinkAt - blinkResetAt).toBeLessThanOrEqual(6.0)
  })
})
