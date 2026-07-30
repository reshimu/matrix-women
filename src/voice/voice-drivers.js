/**
 * voice-drivers — turns an audio signal into smoothed animation drivers.
 *
 * Source-agnostic: feed it a live AnalyserNode or a pre-computed curve frame.
 * Emits four scalars the renderer consumes: jawOpen, mouthWidth, bodyPulse, blink.
 */

const TAU_ATTACK = 0.03;   // seconds — fast rise, catches consonant onsets
const TAU_RELEASE = 0.15;  // seconds — slow fall, reads as speech not as a VU meter

const IDLE_ENERGY_THRESHOLD = 0.04;
const IDLE_BREATH_HZ = 0.22;
const IDLE_BREATH_DEPTH = 0.06;

const BLINK_MIN_INTERVAL = 3.0;
const BLINK_MAX_INTERVAL = 6.0;
const BLINK_DURATION = 0.12;

const LOW_BAND_HZ = [80, 300];
const CENTROID_CEILING_HZ = 4000;

/** Asymmetric attack/release smoothing. Frame-rate independent. */
export function smooth(current, target, dt) {
  const tau = target > current ? TAU_ATTACK : TAU_RELEASE;
  const coeff = Math.exp(-dt / tau);
  return target + (current - target) * coeff;
}

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

export function createDriverState() {
  return {
    jawOpen: 0,
    mouthWidth: 0.5,
    bodyPulse: 0,
    blink: 0,
    elapsed: 0,
    nextBlinkAt: BLINK_MIN_INTERVAL,
    blinkStartedAt: -1,
  };
}

/** Root-mean-square of a time-domain buffer. */
export function readEnergy(timeDomain) {
  let sum = 0;
  for (let i = 0; i < timeDomain.length; i += 1) sum += timeDomain[i] * timeDomain[i];
  return Math.sqrt(sum / timeDomain.length);
}

/** Mean magnitude across a frequency range, normalized 0..1. */
export function readBand(frequencyData, sampleRate, fftSize, fromHz, toHz) {
  const hzPerBin = sampleRate / fftSize;
  const first = Math.max(0, Math.floor(fromHz / hzPerBin));
  const last = Math.min(frequencyData.length - 1, Math.ceil(toHz / hzPerBin));
  if (last <= first) return 0;
  let sum = 0;
  for (let i = first; i <= last; i += 1) sum += frequencyData[i];
  return sum / (last - first + 1) / 255;
}

/**
 * Spectral centroid normalized 0..1 against CENTROID_CEILING_HZ.
 * Low centroid + high energy reads as an open vowel; high centroid as a narrow consonant.
 */
export function readCentroid(frequencyData, sampleRate, fftSize) {
  const hzPerBin = sampleRate / fftSize;
  const last = Math.min(frequencyData.length - 1, Math.ceil(CENTROID_CEILING_HZ / hzPerBin));
  let weighted = 0;
  let total = 0;
  for (let i = 0; i <= last; i += 1) {
    weighted += i * hzPerBin * frequencyData[i];
    total += frequencyData[i];
  }
  if (total === 0) return 0;
  return clamp01(weighted / total / CENTROID_CEILING_HZ);
}

/**
 * Advance the driver state by one frame.
 *
 * @param state    from createDriverState(), mutated in place
 * @param measured { energy, low, centroid } — raw 0..1 values from either a live
 *                 analyser or a pre-computed curve frame
 * @param dt       seconds since last frame
 */
export function advanceDrivers(state, measured, dt) {
  state.elapsed += dt;

  const { energy, low, centroid } = measured;

  const isIdle = energy < IDLE_ENERGY_THRESHOLD;
  const breath = isIdle
    ? (0.5 + 0.5 * Math.sin(state.elapsed * 2 * Math.PI * IDLE_BREATH_HZ)) * IDLE_BREATH_DEPTH
    : 0;

  state.jawOpen = smooth(state.jawOpen, clamp01(energy) + breath, dt);
  state.mouthWidth = smooth(state.mouthWidth, clamp01(1 - centroid), dt);
  state.bodyPulse = smooth(state.bodyPulse, clamp01(low) + breath, dt);

  advanceBlink(state, dt);
  return state;
}

/** Blink runs on its own timer — decoupled from audio so the form never freezes. */
function advanceBlink(state, dt) {
  if (state.blinkStartedAt < 0 && state.elapsed >= state.nextBlinkAt) {
    state.blinkStartedAt = state.elapsed;
  }

  if (state.blinkStartedAt >= 0) {
    const progress = (state.elapsed - state.blinkStartedAt) / BLINK_DURATION;
    if (progress >= 1) {
      state.blink = 0;
      state.blinkStartedAt = -1;
      const span = BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL;
      state.nextBlinkAt = state.elapsed + BLINK_MIN_INTERVAL + Math.random() * span;
    } else {
      state.blink = Math.sin(progress * Math.PI);
    }
  }
  return state.blink;
}

/** Read raw measurements from a live AnalyserNode. */
export function measureFromAnalyser(analyser, timeDomain, frequencyData) {
  analyser.getFloatTimeDomainData(timeDomain);
  analyser.getByteFrequencyData(frequencyData);

  const { sampleRate } = analyser.context;
  const { fftSize } = analyser;

  return {
    energy: clamp01(readEnergy(timeDomain) * 6),
    low: readBand(frequencyData, sampleRate, fftSize, LOW_BAND_HZ[0], LOW_BAND_HZ[1]),
    centroid: readCentroid(frequencyData, sampleRate, fftSize),
  };
}
