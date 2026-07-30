import type { VoiceAdapter } from './provider'
import { elevenlabsAdapter } from './adapters/elevenlabs'
import { webSpeechAdapter } from './adapters/web-speech'

export type { SynthesizeOptions, SynthesizeResult, VoiceAdapter, VoiceHealth, VoiceInfo } from './provider'

/**
 * VITE_VOICE_PROVIDER must be exposed with the VITE_ prefix to reach the browser
 * bundle -- ELEVENLABS_API_KEY is deliberately NOT prefixed and is only ever read
 * server-side, inside api/voice/*.js.
 */
function selectProvider(): string {
  return import.meta.env.VITE_VOICE_PROVIDER ?? 'web-speech'
}

export function getDefaultVoiceId(): string {
  return import.meta.env.VITE_DEFAULT_VOICE_ID ?? ''
}

const adapters: Record<string, VoiceAdapter> = {
  elevenlabs: elevenlabsAdapter,
  'web-speech': webSpeechAdapter,
}

export const voiceProviderName = selectProvider() in adapters ? selectProvider() : 'web-speech'

export const voiceAdapter: VoiceAdapter = adapters[voiceProviderName]
