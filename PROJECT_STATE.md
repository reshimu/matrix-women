# Project state

**Current milestone:** M1 and M2 **complete**. M3 (progressive WebGL enhancement) has
not started.

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
- Grepped `src/` for `TODO`/`FIXME`/`mock`/`placeholder`/`lorem`/`any`-escapes: no
  matches. Nothing found is a stub dressed up as done.

## Evidence as of 2026-07-27 (M2 composition slice, same day)

- Added `src/scene/composition.ts`: `selectActiveLayers(scene)` filters `scene.layers`
  by the matching `scene.effects` flag (`code-rain`→`codeRain`, `particles`→
  `particles`, `lighting`→`glow`; `portrait` always included). Pure, browser-free,
  exported from the public library entry. Tested in `composition.test.ts` (4 tests):
  default-scene selection, effect-flag exclusion, particles-layer inclusion/exclusion,
  and portrait always surviving all-flags-off.
- Rewired `SceneFallback` to render only `selectActiveLayers(scene)`, applying each
  layer's `opacity` via inline style, `density` (code-rain: scales rendered column
  count), `intensity` (lighting: drives `--aura-intensity` → CSS `brightness()`), and
  `count` (particles: renders that many dot elements).
- Added real CSS layout differentiation for `scene--portrait` (4:5 aspect-ratio) and
  `scene--square` (1:1 aspect-ratio) versus the full-bleed `scene--hero` default —
  verified via computed-style inspection in a live browser (`aspectRatio`,
  `minHeight`, `alignItems` all differ by format).
- Full validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test` (**5 files, 11
  tests**), `pnpm build` (demo + library), `pnpm test:consumer`.
- Live browser inspection (dev server, not just built artifact) at 1440×900 and
  320×700: no console errors; confirmed via `getComputedStyle`/DOM inspection that
  `density`/`intensity` values from the default scene actually reach rendered output
  (3 rain columns from `density: 0.4`, `--aura-intensity: 0.7` from `intensity: 0.7`),
  and that hero/portrait/square produce different `aspect-ratio`/`min-height`/
  `align-items` computed values.

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
- **(M2, this session)** Config-driven scene composition: `scene.layers` and
  `scene.effects` now actually control rendered output; `hero`/`portrait`/`square`
  produce real, distinct layouts.

## Risks and blockers

- No browser-only *enhanced* (WebGL) renderer exists yet; its lifecycle, context-loss
  recovery, and constrained-device behavior are unimplemented (M3 scope — correctly
  still pending, next up per `ROADMAP.md`).
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

M2 is complete. See `NEXT_TASK.md` for the proposed first M3 slice (defining the WebGL
renderer lifecycle contract) — not started; awaiting confirmation before beginning a
new milestone's implementation work.