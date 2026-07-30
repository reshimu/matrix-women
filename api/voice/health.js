// Vercel serverless function. Reads ELEVENLABS_API_KEY server-side only -- the
// client never sees it. Only resolves under `vercel dev` or a real deployment;
// plain `vite dev` has no route for this (documented in docs/specs/voice-viz.md).

export default async function handler(req, res) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    res.status(200).json({ ok: false, detail: 'ELEVENLABS_API_KEY is not configured.' })
    return
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey },
    })
    if (!response.ok) {
      res.status(200).json({ ok: false, detail: `ElevenLabs rejected the API key (${response.status}).` })
      return
    }
    res.status(200).json({ ok: true })
  } catch (error) {
    res.status(200).json({ ok: false, detail: `Could not reach ElevenLabs: ${error.message}` })
  }
}
