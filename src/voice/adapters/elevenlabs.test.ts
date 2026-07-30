// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { elevenlabsAdapter } from './elevenlabs'

describe('elevenlabsAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists voices from /api/voice/voices', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'v1', name: 'Voice One' }],
    }))
    expect(await elevenlabsAdapter.listVoices()).toEqual([{ id: 'v1', name: 'Voice One' }])
  })

  it('synthesizes by posting to /api/voice/speak and wraps the audio blob', async () => {
    const blob = new Blob(['fake-audio'], { type: 'audio/mpeg' })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:fake-url') })

    const result = await elevenlabsAdapter.synthesize('hello', 'v1')

    expect(fetchMock).toHaveBeenCalledWith('/api/voice/speak', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text: 'hello', voiceId: 'v1', model: undefined }),
    }))
    expect(result).toEqual({ audioUrl: 'blob:fake-url' })
  })

  it('reports unhealthy when /api/voice/health rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const result = await elevenlabsAdapter.health()
    expect(result.ok).toBe(false)
  })

  it('reports healthy when /api/voice/health resolves ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }))
    expect(await elevenlabsAdapter.health()).toEqual({ ok: true })
  })
})
