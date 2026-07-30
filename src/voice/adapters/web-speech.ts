import type { SynthesizeResult, VoiceAdapter, VoiceHealth, VoiceInfo } from '../provider'

function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis
  const existing = synth.getVoices()
  if (existing.length > 0) return Promise.resolve(existing)

  return new Promise((resolve) => {
    const onVoicesChanged = () => {
      synth.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(synth.getVoices())
    }
    synth.addEventListener('voiceschanged', onVoicesChanged)
  })
}

/** Zero-cost fallback: speaks in-browser via SpeechSynthesis. No key, no server, no network call. */
export const webSpeechAdapter: VoiceAdapter = {
  async listVoices(): Promise<VoiceInfo[]> {
    if (!hasSpeechSynthesis()) return []
    const voices = await loadVoices()
    return voices.map((voice) => ({ id: voice.voiceURI, name: voice.name }))
  },

  async synthesize(text: string, voiceId: string): Promise<SynthesizeResult> {
    if (!hasSpeechSynthesis()) {
      throw new Error('SpeechSynthesis is not available in this environment.')
    }

    const synth = window.speechSynthesis
    const voices = await loadVoices()
    const utterance = new SpeechSynthesisUtterance(text)
    const matched = voices.find((voice) => voice.voiceURI === voiceId)
    if (matched) utterance.voice = matched

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(event.error ?? 'SpeechSynthesis error'))
      synth.speak(utterance)
    })

    // SpeechSynthesis has no standard way to capture its output as a fetchable
    // audio buffer/URL, so there's nothing for VoiceViz's live-analyser path to
    // attach to here -- this adapter speaks, but doesn't drive the visualizer.
    return { audioUrl: null }
  },

  async health(): Promise<VoiceHealth> {
    return hasSpeechSynthesis()
      ? { ok: true }
      : { ok: false, detail: 'window.speechSynthesis is unavailable in this environment.' }
  },
}
