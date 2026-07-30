import type { SynthesizeOptions, SynthesizeResult, VoiceAdapter, VoiceHealth, VoiceInfo } from '../provider'

const SPEAK_ENDPOINT = '/api/voice/speak'
const VOICES_ENDPOINT = '/api/voice/voices'
const HEALTH_ENDPOINT = '/api/voice/health'

/** Real adapter. Never touches ELEVENLABS_API_KEY directly -- everything proxies through server routes. */
export const elevenlabsAdapter: VoiceAdapter = {
  async listVoices(): Promise<VoiceInfo[]> {
    const response = await fetch(VOICES_ENDPOINT)
    if (!response.ok) throw new Error(`Failed to list voices (${response.status}).`)
    return response.json()
  },

  async synthesize(text: string, voiceId: string, opts?: SynthesizeOptions): Promise<SynthesizeResult> {
    const response = await fetch(SPEAK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, model: opts?.model }),
    })
    if (!response.ok) throw new Error(`Speech synthesis failed (${response.status}).`)

    const blob = await response.blob()
    return { audioUrl: URL.createObjectURL(blob) }
  },

  async health(): Promise<VoiceHealth> {
    try {
      const response = await fetch(HEALTH_ENDPOINT)
      if (!response.ok) return { ok: false, detail: `Health check failed (${response.status}).` }
      return response.json()
    } catch {
      // No server route resolves under plain `vite dev` -- only under `vercel dev`
      // or an actual deployment. That's an expected, documented gap, not a bug.
      return { ok: false, detail: '/api/voice/health is unreachable (needs vercel dev or a deployment).' }
    }
  },
}
