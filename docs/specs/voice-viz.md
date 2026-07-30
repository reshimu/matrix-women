# Spec — Voice + audio-reactive viz

Status: **awaiting approval**. Do not implement against this spec until Shimon signs off.

## Context

`@reshimu/matrix-ai-ui` today ships a config-driven scene (portrait/code-rain/particles/
lighting) with CSS and WebGL renderers, published on npm. This adds a voice layer: text-to-speech
via a provider-agnostic seam, and a canvas renderer whose face reacts to the resulting audio in
real time. The two source files in `files.zip` (`voice-drivers.js`, `voice-viz-demo.jsx`) were
handed off pre-written and are treated as correct; this spec covers how they get wired into the
package, not whether their internals are right.

Repo has **no server runtime today** (static Vite SPA + a Next.js consumer-proof fixture that
exists only to test SSR import compatibility, not to host anything). That has one direct
consequence for Deliverable A below.

## Deliverable A — provider-agnostic voice seam

```
src/voice/
  provider.js          # interface: listVoices(), synthesize(text, voiceId, opts), health()
  adapters/
    elevenlabs.js       # calls /api/voice/speak, never touches the API key directly
    web-speech.js        # zero-cost fallback via window.speechSynthesis
  index.js              # selects adapter from VOICE_PROVIDER
```

- `provider.js` defines the shape only (JSDoc, no implementation) — a shared contract both
  adapters satisfy.
- `adapters/web-speech.js`: `synthesize()` drives `SpeechSynthesisUtterance` directly in-browser.
  No network call, no key, no server dependency. `health()` returns whether
  `window.speechSynthesis` exists.
- `adapters/elevenlabs.js`: `synthesize()` POSTs `{ text, voiceId, model }` to
  `/api/voice/speak` and gets back an audio buffer/URL. `listVoices()`/`health()` also proxy
  through server routes (`/api/voice/voices`, `/api/voice/health`) — the client adapter never
  sees `ELEVENLABS_API_KEY`.
- `index.js` reads `VOICE_PROVIDER` (`"elevenlabs" | "web-speech"`) and exports the matching
  adapter as the default. Unknown/unset value falls back to `web-speech` (never silently no-ops).

### Server-side proxy — resolving the open question

**Decision (flagged for your override): add `api/voice/speak.js`, `api/voice/voices.js`,
`api/voice/health.js` as Vercel serverless functions**, using Vercel's zero-config `api/`
directory convention (no new `vercel.json` needed for this alone). Rationale: matches your
stated Vercel-for-deploy default, and a single proxy route doesn't justify standing up Express.

Consequence you should know before approving: **these routes only run under `vercel dev` or an
actual Vercel deployment** — they will not resolve when the demo is served by plain `vite dev`
(no dev-server middleware exists to fake them). Two ways to handle that, pick one:

1. Document it: local `pnpm dev` shows the ElevenLabs path as `health()` → unreachable, and
   Web Speech becomes the only adapter that works without `vercel dev`. Simplest, no extra code.
2. Add a tiny Vite dev-server proxy (`vite.config.ts` → `server.middlewareMode` handler) that
   shells out to the same handler code locally. More parity, more code, more surface to keep in
   sync with the Vercel functions.

Recommending **option 1** — it's a demo/library repo, not a deployed product; matching Vercel's
real runtime is more honest than a bespoke local shim. Says so explicitly in the health-check UI
copy (Deliverable C) so it's never a silent failure.

### Caching

`synthesize()` in the ElevenLabs adapter hashes `text + voiceId + model` (e.g. a small non-crypto
hash, or `crypto.subtle.digest` since this runs server-side) and checks/writes an in-memory Map
in the serverless function's module scope before calling the real ElevenLabs API. Vercel functions
are not guaranteed warm between invocations, so this is a **best-effort dev-iteration cache, not a
durable one** — no external cache store is in scope here. Documented as a known limitation, not a
bug.

### Config surface

`.env.example` gets:
```
VOICE_PROVIDER=web-speech
ELEVENLABS_API_KEY=
DEFAULT_VOICE_ID=
```
`ELEVENLABS_API_KEY` is read only inside the `api/voice/*.js` serverless functions
(`process.env.ELEVENLABS_API_KEY`) — never imported into any file under `src/`.

## Deliverable B — audio-reactive renderer

- `src/voice/voice-drivers.js` — dropped in from `files.zip` verbatim. Not modified. (Reviewed
  during Phase 0: pure functions, no I/O, matches the TDD list in Phase 2 below.)
- `src/components/VoiceViz.jsx` — adapted from `voice-viz-demo.jsx`:
  - Delete the inlined driver block (lines mirroring `voice-drivers.js`); import
    `advanceDrivers`, `createDriverState`, `measureFromAnalyser` from `../voice/voice-drivers.js`.
  - Keep the `getComputedStyle`-based token reads (`readToken`) as-is — no hardcoded hex in any
    `ctx.*` call.
  - Keep the `draw()` function, the canvas devicePixelRatio handling, and the rAF loop shape.
  - **New**: accept a `driverSource` prop — either:
    - `{ kind: 'analyser', analyser: AnalyserNode }` — the existing live path, wired through
      `measureFromAnalyser`.
    - `{ kind: 'curve', frames: Array<{ energy, low, centroid }>, frameRate }` — a pre-computed
      curve, advanced on the same rAF clock without an AudioContext. Used for the Test-voice
      button in Deliverable C when a provider returns a curve alongside (or instead of) raw
      audio, and for tests/storybook-style usage without mic/audio permissions.
  - The synthetic-speech generator (`buildSyntheticSpeech`) and the file-upload/demo-only
    controls (`Play synthetic`, `Load mp3`, standalone `<style>` block) are **dropped** — those
    belong to the standalone demo, not the integrated component. `VoiceViz` becomes a pure
    renderer driven by whatever `driverSource` it's given; the demo's own play/stop/file-input
    chrome lives only in `voice-viz-demo.jsx`, which stays untouched as a reference file (not
    shipped, not imported by the library).
  - No second component for the curve path — same `VoiceViz`, branching on `driverSource.kind`.

## Deliverable C — the connection surface

One panel, `src/components/VoicePanel.jsx` (new, not from the zip):
- Shows: active provider name (from `VOICE_PROVIDER`), whether `DEFAULT_VOICE_ID`/key look
  configured (present/absent only — never the key value), and the result of calling `health()`
  on mount.
- **Test voice** button: calls `synthesize()` with a short fixed string (~2s of speech) through
  the currently selected adapter, plays the resulting audio, and feeds the same audio into a
  `VoiceViz` instance via the live `AnalyserNode` path.
- If the active adapter is `elevenlabs` and `health()` reports unreachable (per the local-dev
  caveat above), the panel says so plainly instead of a silent failure.

## Explicitly out of scope

Generative video, photorealism, forced alignment, multi-provider switching UI (beyond reading
`VOICE_PROVIDER` at startup), streaming playback. If implementation grows past
`src/voice/{provider,index}.js` + 2 adapters + `VoiceViz.jsx` + `VoicePanel.jsx` + the 3 API
routes, stop and report `DONE_WITH_CONCERNS` rather than expanding scope silently.

## Test plan (Phase 2 detail, restated here for review)

`voice-drivers.js` (pure, no audio context needed):
- `smooth()` rises faster than it falls given identical deltas (attack τ=0.03 vs release τ=0.15).
- `smooth()` is frame-rate independent: 2 steps at dt=0.008 ≈ 1 step at dt=0.016, within tolerance.
- `readEnergy()` → 0 for silence, ≈0.707 for a full-scale sine (RMS of unit sine).
- `readCentroid()` → 0 for an empty/all-zero spectrum; increases as energy shifts to higher bins.
- `advanceDrivers()` applies idle breathing only when `energy < IDLE_ENERGY_THRESHOLD`.
- Blink fires on its own timer with zero audio input, and re-arms within the 3–6s window.

`VoiceViz`: smoke test only — mounts with a fake `driverSource` (curve path, no real
AudioContext needed in jsdom), advances one frame, asserts no throw. No pixel assertions.

Adapters: `web-speech.js` gets a unit test against a mocked `window.speechSynthesis`.
`elevenlabs.js` gets a unit test against a mocked `fetch` to `/api/voice/speak` — no real network
call, no real key, ever, in tests.

## Files touched (ceiling, per the out-of-scope gate above)

```
src/voice/provider.js
src/voice/index.js
src/voice/adapters/elevenlabs.js
src/voice/adapters/web-speech.js
src/voice/voice-drivers.js          (from zip, unmodified)
src/voice/voice-drivers.test.js
src/components/VoiceViz.jsx
src/components/VoiceViz.test.jsx
src/components/VoicePanel.jsx
api/voice/speak.js
api/voice/voices.js
api/voice/health.js
.env.example                        (append 3 keys)
docs/specs/voice-viz.md             (this file)
```

`voice-viz-demo.jsx` itself is not added to the repo as a shipped file — it's the reference the
zip provided; `VoiceViz.jsx` is adapted from it per Deliverable B, and the demo file is discarded
after adaptation (or kept only in `files.zip`'s extraction location, not committed) unless you'd
rather keep it as a standalone `/demo` route for manual testing. Flagging that as a small open
call too — say the word if you want the standalone demo kept and wired into `main.tsx` behind a
route/flag.
