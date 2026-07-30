import { useCallback, useEffect, useRef, useState } from 'react'
import { getDefaultVoiceId, voiceAdapter, voiceProviderName, type VoiceHealth } from '../voice'
import { VoiceViz } from './VoiceViz'

const TEST_TEXT = 'Hello, this is a two second test of the voice system.'

interface ActiveAudio {
  context: AudioContext
  audioEl: HTMLAudioElement
  objectUrl: string
}

/** The connection surface: provider, key/health status, and a Test voice button piped into VoiceViz. */
export function VoicePanel() {
  const [health, setHealth] = useState<VoiceHealth | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const activeAudioRef = useRef<ActiveAudio | null>(null)

  const teardownActiveAudio = useCallback(() => {
    const active = activeAudioRef.current
    if (!active) return
    active.audioEl.pause()
    active.audioEl.onended = null
    URL.revokeObjectURL(active.objectUrl)
    void active.context.close()
    activeAudioRef.current = null
  }, [])

  useEffect(() => () => teardownActiveAudio(), [teardownActiveAudio])

  useEffect(() => {
    let cancelled = false
    voiceAdapter.health().then((result) => {
      if (!cancelled) setHealth(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const testVoice = useCallback(async () => {
    setError(null)
    setNote(null)
    setIsSpeaking(true)
    teardownActiveAudio()
    setAnalyser(null)

    try {
      const result = await voiceAdapter.synthesize(TEST_TEXT, getDefaultVoiceId())
      if (!result.audioUrl) {
        setNote('This provider has no audio stream to drive the visualizer with.')
        setIsSpeaking(false)
        return
      }

      const context = new AudioContext()
      const audioEl = new Audio(result.audioUrl)
      const source = context.createMediaElementSource(audioEl)
      const analyserNode = context.createAnalyser()
      analyserNode.fftSize = 2048
      source.connect(analyserNode)
      analyserNode.connect(context.destination)

      activeAudioRef.current = { context, audioEl, objectUrl: result.audioUrl }
      setAnalyser(analyserNode)

      audioEl.onended = () => setIsSpeaking(false)
      await audioEl.play()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsSpeaking(false)
    }
  }, [teardownActiveAudio])

  const keyStatus =
    voiceProviderName === 'web-speech'
      ? 'not required'
      : health === null
        ? 'checking...'
        : health.ok || !health.detail?.toLowerCase().includes('not configured')
          ? 'present'
          : 'absent'

  return (
    <section aria-label="Voice settings">
      <dl>
        <dt>Provider</dt>
        <dd>{voiceProviderName}</dd>
        <dt>API key</dt>
        <dd>{keyStatus}</dd>
        <dt>Health</dt>
        <dd>{health === null ? 'checking...' : health.ok ? 'reachable' : `unreachable — ${health.detail ?? ''}`}</dd>
      </dl>

      <button type="button" onClick={testVoice} disabled={isSpeaking}>
        Test voice
      </button>

      {error && <p role="alert">{error}</p>}
      {note && <p>{note}</p>}

      {analyser && (
        <div style={{ width: 240, height: 240 }}>
          <VoiceViz driverSource={{ kind: 'analyser', analyser }} />
        </div>
      )}
    </section>
  )
}
