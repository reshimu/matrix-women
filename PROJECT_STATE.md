# Project state

**Current milestone:** M1 — package and scene-schema foundation **complete**.
M2 — core scene composition and dependable non-WebGL fallback — **in progress**.

## Evidence as of 2026-07-27 (reconciliation pass)

A recon session (no product code changed) verified every claim below against actual
command output and a full read of `src/`, since prior sessions' project records had
drifted from what the code actually does.

- Git repository now exists and is pushed: `github.com/reshimu/matrix-women`, branch
  `main`. Previously no repository existed at all.
- Re-ran the full validation suite fresh: `pnpm typecheck`, `pnpm lint`
  (`--max-warnings=0`), `pnpm test` (**4 files, 7 tests** — up from the 3 files/5 tests
  recorded on 2026-07-26), `pnpm test:consumer`, and `pnpm build` (demo + library). All
  passed with exit code 0.
- Confirmed `src/renderer/browser/cssRendererHost.ts` is implemented: a browser-only
  lifecycle host (`start`/`pause`/`resume`/`dispose`) driven by `visibilitychange` and
  `IntersectionObserver`, with a fully injectable environment and its own test file
  (`cssRendererHost.test.ts`) covering hidden/offscreen pausing, manual pause/resume,
  and listener/observer cleanup on dispose. This existed already but was not reflected
  in `ROADMAP.md`, `NEXT_TASK.md`, or this file until now.
- Confirmed a real gap: `src/components/SceneFallback.tsx` renders fixed, hardcoded
  markup (aura/rain/subject divs) and does **not** read `scene.layers` or
  `scene.effects` from the validated `SceneConfig`. The schema and validation are real
  and tested, but nothing in the render path is driven by them yet — toggling
  `effects.codeRain` to `false`, for example, currently has no visual effect.
- Grepped `src/` for `TODO`/`FIXME`/`mock`/`placeholder`/`lorem`/`any`-escapes: no
  matches. Nothing found is a stub dressed up as done.

## Completed

- M0 governance completed under explicit greenfield authorization.
- M1 package boundaries, source-level public API, independently consumable ES library
  artifact, and Vite builder baseline completed.
- Added typed portrait, code-rain, particle, and lighting layer schema; deterministic
  scene validation; and pure renderer selection.
- Added a dignified, responsive, non-WebGL CSS fallback scene with reduced-motion CSS
  behavior.
- Added `RESTART_PROMPT.md` for context-safe handoff.
- **(M2, done but previously unreported)** Browser-only CSS renderer lifecycle host:
  start/pause/resume/dispose, pausing on hidden-document and offscreen states, with
  deterministic listener/observer cleanup and unit test coverage.
- Git repository initialized, remote README merged, pushed to
  `github.com/reshimu/matrix-women`.

## Risks and blockers

- **Scene composition is not config-driven yet.** `SceneFallback` ignores
  `scene.layers` and `scene.effects` entirely — this is the actual remaining M2 work,
  not the lifecycle host (which is done). See `NEXT_TASK.md`.
- No browser-only *enhanced* (WebGL) renderer exists yet; its lifecycle, context-loss
  recovery, and constrained-device behavior are unimplemented (M3 scope — correctly
  still pending).
- Reduced-motion behavior is implemented in CSS and renderer selection, but automated
  browser-emulation coverage does not exist; the lifecycle host's real
  `browserEnvironment()` path (actual `window.document`/`IntersectionObserver`) has no
  automated test — only the injected fake environment is exercised in
  `cssRendererHost.test.ts`. Vitest runs in `environment: 'node'`.
- No Next.js consumption proof exists yet, despite `PROJECT_SPEC.md` requiring it —
  only a plain-Node consumer fixture (`fixtures/library-consumer.mjs`).
- Only one scene format (`hero`) renders meaningfully; `portrait` and `square` are
  typed but produce no visually distinct output.

## Exact next task

Wire `SceneFallback` (or a new composition layer) to actually render from validated
`SceneConfig` data — respect `scene.layers` (opacity/density/intensity),
`scene.effects` (codeRain/particles/glow toggles), and `scene.format`
(hero/portrait/square) — instead of the current hardcoded markup. Full done-criteria in
`NEXT_TASK.md`.