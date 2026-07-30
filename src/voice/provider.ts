export interface VoiceInfo {
  id: string
  name: string
}

export interface SynthesizeOptions {
  model?: string
}

export interface SynthesizeResult {
  /** Playable audio URL (object URL or remote URL), or null if this adapter has no audio to hand back. */
  audioUrl: string | null
}

export interface VoiceHealth {
  ok: boolean
  detail?: string
}

export interface VoiceAdapter {
  listVoices(): Promise<VoiceInfo[]>
  synthesize(text: string, voiceId: string, opts?: SynthesizeOptions): Promise<SynthesizeResult>
  health(): Promise<VoiceHealth>
}
