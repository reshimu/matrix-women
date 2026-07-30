import { createHash } from 'node:crypto'

// Vercel serverless function. Reads ELEVENLABS_API_KEY server-side only -- it
// never reaches the client bundle.
//
// Cache is best-effort only: a plain in-memory Map at module scope, so it only
// helps within a single warm serverless instance. Vercel functions are not
// guaranteed to stay warm between invocations -- this is a dev-iteration cost
// saver, not a durable cache. FIFO-capped (not LRU -- a hit doesn't repromote
// its entry) to avoid unbounded growth in a long-lived local dev process.
const CACHE_LIMIT = 50
const MAX_TEXT_LENGTH = 500
const cache = new Map()

function cacheKey(text, voiceId, model) {
  return createHash('sha256').update(`${text}|${voiceId}|${model ?? ''}`).digest('hex')
}

function rememberInCache(key, buffer) {
  if (cache.size >= CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }
  cache.set(key, buffer)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ELEVENLABS_API_KEY is not configured.' })
    return
  }

  const { text, voiceId, model } = req.body ?? {}
  if (!text || !voiceId) {
    res.status(400).json({ error: 'text and voiceId are required.' })
    return
  }
  if (text.length > MAX_TEXT_LENGTH) {
    res.status(400).json({ error: `text must be ${MAX_TEXT_LENGTH} characters or fewer.` })
    return
  }

  const key = cacheKey(text, voiceId, model)
  const cached = cache.get(key)
  if (cached) {
    res.setHeader('Content-Type', 'audio/mpeg')
    res.status(200).send(cached)
    return
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: model || 'eleven_monolingual_v1' }),
    })

    if (!response.ok) {
      res.status(response.status).json({ error: `ElevenLabs synthesis failed (${response.status}).` })
      return
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    rememberInCache(key, buffer)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.status(200).send(buffer)
  } catch (error) {
    res.status(502).json({ error: `Could not reach ElevenLabs: ${error.message}` })
  }
}
