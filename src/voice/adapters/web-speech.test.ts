// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { webSpeechAdapter } from './web-speech'

class FakeUtterance {
  text: string
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: ((event: { error?: string }) => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

function installFakeSpeechSynthesis(voices: Array<{ voiceURI: string; name: string }>) {
  const fake = {
    getVoices: () => voices,
    addEventListener: () => {},
    removeEventListener: () => {},
    speak: (utterance: FakeUtterance) => {
      queueMicrotask(() => utterance.onend?.())
    },
  }
  Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true })
}

describe('webSpeechAdapter', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'speechSynthesis')
    Reflect.deleteProperty(window, 'SpeechSynthesisUtterance')
  })

  it('reports healthy when speechSynthesis exists', async () => {
    installFakeSpeechSynthesis([])
    expect(await webSpeechAdapter.health()).toEqual({ ok: true })
  })

  it('reports unhealthy when speechSynthesis is missing', async () => {
    // @ts-expect-error -- deliberately removing a browser API for the test
    delete window.speechSynthesis
    const result = await webSpeechAdapter.health()
    expect(result.ok).toBe(false)
  })

  it('lists voices mapped from getVoices()', async () => {
    installFakeSpeechSynthesis([{ voiceURI: 'v1', name: 'Voice One' }])
    expect(await webSpeechAdapter.listVoices()).toEqual([{ id: 'v1', name: 'Voice One' }])
  })

  it('synthesizes by speaking and resolves with no audioUrl', async () => {
    installFakeSpeechSynthesis([{ voiceURI: 'v1', name: 'Voice One' }])
    const result = await webSpeechAdapter.synthesize('hello', 'v1')
    expect(result).toEqual({ audioUrl: null })
  })
})
