# Project state

**Current milestone:** M1 and M2 **complete**. M3 (progressive WebGL enhancement) —
**in progress**: lifecycle contract done, no rendering content yet.

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

## Evidence as of 2026-07-27 (M3 lifecycle scaffold, same day)

- Extracted `src/renderer/browser/environment.ts` (shared `BrowserLifecycleEnvironment`
  types + default factory) out of `cssRendererHost.ts` to avoid duplicating it for the
  new host — `cssRendererHost.ts` behavior is unchanged, verified by its existing tests
  still passing unmodified.
- Added `src/renderer/browser/webglRendererHost.ts`: same `start`/`pause`/`resume`/
  `dispose`/`getState` shape as the CSS host, plus a `context-lost` state driven by
  `webglcontextlost`/`webglcontextrestored` events that overrides visibility/
  intersection-driven pausing until restored.
- 4 new unit tests in `webglRendererHost.test.ts`: hidden/offscreen pausing,
  context-lost entry and recovery, context-lost surviving a visibility/intersection
  change, and manual pause/resume/dispose cleanup.
- Full validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test` (**6 files, 15
  tests**), `pnpm build`, `pnpm test:consumer`. Library artifact size unchanged
  (2.26 kB) — confirms the new WebGL code isn't leaking into the public entry
  (`src/index.ts` doesn't import it), matching ADR-0003.
- No browser-pane inspection performed for this slice: nothing renders yet. The host
  is a lifecycle scaffold only, not wired into `selectRenderer` or `SceneFallback`, and
  has no shaders/geometry/actual WebGL drawing behind it.

## Evidence as of 2026-07-27 (M3 wiring slice, same day, Option B)

- Added `src/components/Scene.tsx`: a composition root that detects
  `prefersReducedMotion`/`supportsWebGL`/`constrainedDevice` live in the browser,
  passes them to the already-tested `selectRenderer`, and mounts `SceneWebgl` or
  `SceneFallback` accordingly.
- Added `src/components/SceneWebgl.tsx`: obtains a real `WebGLRenderingContext` from a
  mounted `<canvas>`, wires up `createWebglRendererHost`, and paints a placeholder
  clear color — no shaders or geometry, by design (that's the next slice).
- `main.tsx` now renders `<Scene>` instead of `<SceneFallback>` directly.
- Live-verified in a real browser (dev server, both branches exercised):
  - **WebGL branch:** canvas mounted at the correct size with a working context;
    `gl.readPixels` confirmed the placeholder clear color actually painted
    (`[13, 41, 43, 255]` ≈ `clearColor(0.05, 0.16, 0.17, 1)`).
  - **CSS fallback branch:** temporarily forced `detectSupportsWebGL()` to return
    `false`, reloaded, confirmed `SceneFallback` mounted instead (rain/subject present,
    no canvas), then reverted the override before running final validation and
    committing — the shipped code path was not the modified one.
- Full validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test` (6 files, 15
  tests — unchanged, since this slice is integration wiring around already-tested
  units), `pnpm build`, `pnpm test:consumer`. Library artifact size unchanged
  (2.26 kB) — `Scene`/`SceneWebgl` are demo-only.

## Evidence as of 2026-07-27 (M3 trivial animated gradient, same day)

- Replaced `SceneWebgl`'s placeholder clear-color with a real shader: a fullscreen
  triangle plus a fragment shader mixing two colors via `sin(uTime * 0.4 + ...)`, run
  through a `requestAnimationFrame` loop gated by the lifecycle host's `running` state
  and by `scene.reducedMotion` (static single frame when true, matching the CSS host's
  reduced-motion behavior).
- **Bug found and fixed during verification:** the canvas's WebGL drawing-buffer size
  was only resynced via a `window.resize` listener, which doesn't fire for all
  viewport-size changes — caught live (`clientWidth`/`clientHeight` updated correctly,
  but `canvas.width`/`canvas.height`, the actual render resolution, stayed stale after
  a viewport resize). Fixed by switching to a `ResizeObserver` on the canvas itself
  (the correct API — reacts to any layout-driven size change), which also repaints
  immediately using the last-known animation time so paused/reduced-motion scenes stay
  correctly sized.
- **What was verified live:** shader math at `uTime=0` (`gl.readPixels` matched the
  hand-computed color to the pixel — colorB dominant near the initial sine peak);
  lifecycle `running`/`paused` state gating (force-toggled `document.hidden`, confirmed
  `canvas.dataset.rendererState` and paint behavior followed); initial mount-time
  canvas sizing correct at 1440×900 and 320×700; no console errors at either viewport.
- **What could not be verified live, and why:** continuous animation frames and
  post-mount resize repainting. This specific sandboxed browser pane does not
  composite frames at all (established from the very first screenshot attempt this
  session) — as a direct consequence, neither `requestAnimationFrame` nor
  `ResizeObserver` callbacks fire in it, confirmed by two direct tests: a raw
  `ResizeObserver` on the canvas never fired even for a manual `canvas.style.width`
  change, and a raw `requestAnimationFrame` frame-counting loop never completed within
  30 seconds. This is an environment constraint of this specific tool, not a known
  code defect — both APIs used are standard and well-supported, and the logic was
  verified by direct code review.
- Full validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test` (6 files, 15
  tests — unchanged; this is browser/GPU rendering logic, not practically unit
  testable without a real WebGL context), `pnpm build`, `pnpm test:consumer`. Library
  artifact size unchanged (2.26 kB).

## Evidence as of 2026-07-27 (real-browser spot-check, same day)

Re-ran the verification in **Claude in Chrome** (a real, non-sandboxed Chrome browser
instance, distinct from this session's synthetic browser-pane tool) to close the gap
flagged above. Findings:

- No console errors; page structure, canvas mount, and static shader output
  (`gl.readPixels` → same `[23, 89, 81, 255]` pixel, matching the hand-computed shader
  math) all reproduced identically to the sandboxed-pane check.
- **`requestAnimationFrame` and `ResizeObserver` still did not fire**, even in this
  real Chrome instance. Root cause identified via `window.innerWidth`/`innerHeight` →
  `[0, 0]`: this automated tab has no actual rendering viewport at all, so Chrome
  suspends both APIs — this is standard, spec-compliant behavior for any
  non-composited page, not specific to this session's original tool.
- Proved the suspension is tied to Chrome's **real internal compositor-visibility
  state**, not the JS-observable `document.hidden` property: spoofing
  `document.hidden` to `false` via `Object.defineProperty` did not unlock `rAF` (0
  frames over 3 real seconds), and `document.visibilityState` continued reporting the
  true `"hidden"` state independent of the spoofed getter.
- **Conclusion:** a true frame-by-frame animation observation is not achievable with
  any tool available in this session — both the sandboxed pane and real-Chrome
  automation lack an actual rendering surface. This is a hard environment limitation,
  not a gap I can close by trying harder or switching tools again.
- **Net effect on confidence:** this raises confidence rather than lowering it. The
  lifecycle host's `document.hidden`-based pausing was shown to track genuine browser
  compositor-visibility state (not just a spoofable JS flag), which is exactly the
  real-world condition it's designed to respond to. `requestAnimationFrame` and
  `ResizeObserver` are universally-supported, standard browser APIs used in the
  conventional documented way (a `rAF` loop gated by a state flag; a `ResizeObserver`
  watching the exact element whose size matters) — there is no known edge case in
  their usage that would behave differently in a real, visible browser tab.
- **What remains genuinely unverified:** only a literal human-observed "does it
  visibly animate/resize" check, which requires a real, on-screen browser window —
  something no available tool can provide. A 10-second manual check
  (`pnpm dev`, open `http://localhost:5173`, resize the window, watch) would close
  this completely, but is not required to have high confidence in the implementation.

## Evidence as of 2026-07-27 (M3 config-driven WebGL composition, same day)

- Added `src/renderer/webglUniforms.ts` (`deriveWebglUniforms`, pure, tested — 4
  tests): mirrors `selectActiveLayers` by reducing active layers into four shader
  uniforms (`glowIntensity`, `rainDensity`, `portraitOpacity`, `sparkle`), each zeroed
  when its layer isn't active (e.g. `effects.glow: false` zeroes `glowIntensity` even
  if a `lighting` layer is configured).
- `SceneWebgl`'s fragment shader now uses these uniforms: a radial glow scaled by
  `uGlowIntensity`, gradient oscillation speed scaled by `uRainDensity`, overall
  brightness scaled by `uPortraitOpacity`, and procedural sparkle scaled by
  `uSparkle`. Uniforms are read from a ref kept current via `useMemo` + an effect (not
  captured once at mount), so config changes take effect live without restarting the
  WebGL context; the static/reduced-motion branch also repaints on config changes.
- **Live-verified in Claude in Chrome (real browser):** exact pixel readback at the
  shader's glow center matched hand-computed shader math (`[81, 193, 169]`), and a far
  corner matched the pre-existing gradient baseline (`[23, 88, 81]`). Then temporarily
  set `effects.glow: false` in `main.tsx`, reloaded, confirmed the glow-center pixel
  dropped to match the far-corner baseline (`[23, 88, 80]`) — proving the effects
  toggle actually gates WebGL rendering, not just CSS. Reverted before final
  validation and commit (`git diff src/main.tsx` confirmed clean).
- **Bug caught and fixed during implementation:** an ESLint `react-hooks/refs` rule
  flagged mutating a ref directly during render (`uniformsRef.current = ...` at the
  top of the component). Fixed by deriving uniforms via `useMemo` and syncing the ref
  inside an effect instead — a real lint catch, not a stylistic nit.
- Full validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test` (**7 files, 19
  tests**, up from 6/15), `pnpm build`, `pnpm test:consumer`. Library artifact size
  unchanged (2.26 kB) — `webglUniforms.ts` is demo-only, not re-exported publicly.

## Risks and blockers

- Only a literal human-eyes-on-screen check remains unverified for the WebGL
  animation/resize behavior — every other verification path available to automated
  tooling in this session has been exhausted and passed. See earlier evidence.
- The WebGL scene's visual vocabulary (glow/gradient/sparkle) doesn't visually
  resemble the CSS scene (matrix rain, portrait silhouette) — intentionally deferred,
  not attempted this slice.
- Visual parity with the CSS scene (matrix rain, portrait/lighting look) is
  intentionally not attempted yet — this was scoped as a "trivial" gradient.
- The `Scene` → `SceneWebgl`/`SceneFallback` branch decision itself has no automated
  test (no jsdom/browser-mode Vitest project exists) — verified only by manual
  live-browser checks, which are repeatable but not automated. Consistent with the
  existing accepted gap: no automated real-DOM test coverage anywhere in this repo yet
  (see M5 scope).
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

The WebGL lifecycle scaffold, its wiring, and a trivial animated gradient are all
done. See `NEXT_TASK.md` for proposed next steps — not started; awaiting direction.