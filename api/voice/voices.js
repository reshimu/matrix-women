// Vercel serverless function. Reads ELEVENLABS_API_KEY server-side only.

export default async function handler(req, res) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ELEVENLABS_API_KEY is not configured.' })
    return
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })
    if (!response.ok) {
      res.status(response.status).json({ error: `ElevenLabs voices request failed (${response.status}).` })
      return
    }

    const data = await response.json()
    const voices = (data.voices ?? []).map((voice) => ({ id: voice.voice_id, name: voice.name }))
    res.status(200).json(voices)
  } catch (error) {
    res.status(502).json({ error: `Could not reach ElevenLabs: ${error.message}` })
  }
}
