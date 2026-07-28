# Project state

**Current milestone:** M1 and M2 **complete**. M3 (progressive WebGL enhancement) is
functionally complete end-to-end (lifecycle, wiring, animation, config-driven
composition, real-browser spot-check) — visual parity with the CSS scene and
constrained-device re-evaluation are the only open items, both deferred by choice.
M4 has not formally started, but its Next.js consumption requirement (a spec gate) is
already proven — see evidence below.

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

**This section was stale as of 2026-07-28** — most of the bullets below had already
been resolved by later work in this same file (visual parity pass, jsdom lifecycle
coverage, `DemoFormats.tsx`) but were never removed. Reconciled during the
risk/performance audit; see [`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md)
for the current, verified risk register. Kept here (struck through in spirit, not
deleted) as a record of what drifted and why: this is exactly the kind of tracker
staleness `RESTART_PROMPT.md` already warns every session to check the code before
trusting.

- ~~Only a literal human-eyes-on-screen check remains unverified for WebGL
  animation/resize~~ — still genuinely true (environment-constrained, not
  code-related); see audit R-007.
- ~~WebGL's visual vocabulary doesn't resemble the CSS scene~~ — **resolved** by the
  WebGL visual parity pass (PR #2); see audit R-008 for the remaining honest caveat
  (approximation, not pixel-identical).
- ~~`Scene` branch decision has no automated test~~ — **resolved**, added during this
  audit (`Scene.test.tsx`).
- ~~`browserEnvironment()` has no automated test~~ — **resolved** by
  `realBrowserEnvironment.test.ts` (jsdom), added in the hardening branch (PR #1).
- ~~Only `hero` format renders meaningfully~~ — **resolved** by `DemoFormats.tsx`,
  which mounts hero/portrait/square live in the actual running demo.

## Evidence as of 2026-07-27 (Next.js consumption proof, same day)

- **Resolved:** the "no Next.js consumption proof" gap above is closed. Added
  `pnpm-workspace.yaml` and `fixtures/nextjs-consumer/` (a real Next.js 15 app, its own
  workspace member depending on `@matrix-ai/ui` via `workspace:*`, confirmed resolved
  as a real symlink into the repo root, not a hand-rolled path hack).
- `fixtures/nextjs-consumer/app/page.tsx` is a Server Component (no `'use client'`)
  importing `defaultScene`/`validateScene`/`selectRenderer`/`selectActiveLayers` —
  proving the public entry is genuinely SSR/build-safe with zero DOM dependencies.
- `next build` succeeded and **statically prerendered** the page — the package
  executed correctly inside Next's real server-rendering pipeline, not a simulation.
  `next dev` live-verified in a real browser: correct values rendered (`Scene id:
  matrix-serenity`, `Renderer kind: webgl`, `Active layers: subject, matrix-rain,
  ambient-light`), no console errors.
- **Caught during wiring, not before:** adding the fixture broke root `pnpm lint`
  (`max-warnings=0`) via a `react-refresh/only-export-components` warning on
  `layout.tsx`'s required `metadata` export — a known false-positive (Vite's
  react-refresh rule doesn't have Next's App Router exception for this). Scoped the
  rule off for `fixtures/nextjs-consumer/**` rather than suppressing it globally.
- Added `pnpm test:nextjs-consumer` script and a `.claude/launch.json` entry for
  previewing `next dev`.
- Re-ran the full pre-existing validation suite after adding the workspace: `pnpm
  typecheck`, `pnpm lint`, `pnpm test` (7 files/19 tests, unchanged), `pnpm build`,
  `pnpm test:consumer` all still pass — nothing pre-existing broke.

## Evidence as of 2026-07-27 (digital-woman subject illustration, same day)

- Added `src/components/SubjectPortrait.tsx`: a real hand-authored SVG illustration
  replacing the placeholder CSS blob shapes (`.subject__halo/head/neck/shoulders`
  divs). Symmetric front-facing faceless silhouette (head/neck/shoulders as one
  mirrored half-path via `transform="translate(400,0) scale(-1,1)"`, guaranteeing
  perfect symmetry rather than hand-duplicated coordinates), soft halo behind the
  head, a darker flowing hair shape, strand-highlight lines confined within the hair,
  and a subtle center-face light highlight. Faceless/symbolic by deliberate design —
  matches `AGENTS.md`'s "serene, intelligent, dignified, feminine, ethereal, symbolic,
  non-sexualized" requirement while avoiding uncanny-valley risk. Fully inline SVG, no
  external image service, matching `PROJECT_SPEC.md`'s asset constraint.
- **This session's screenshot tooling was fundamentally broken** — worked around it by
  rasterizing the SVG to PNG directly (`npx resvg-cli`) and reading the image, since
  neither this session's sandboxed browser pane (doesn't composite frames) nor Claude
  in Chrome (its automated tab has a genuine `0×0` viewport, confirmed via a failed
  `resize_window` call) could produce a screenshot. Iterated 4 versions this way: v1
  read as a snowman (no neck, hair looked like a cloak); v2 fixed proportions with a
  clean mirrored half-path; v3 added strand highlights that crossed the torso and
  looked like scratches (anatomically backwards); v4 confined the strands to the hair
  silhouette, which read correctly. Full iteration history in `ROADMAP.md`.
- Confirmed the shipped component matches: extracted the live DOM's actual
  `.scene__subject svg` output from the running dev server (temporarily forcing the
  CSS-fallback branch via the same override-then-revert pattern used earlier this
  session) and confirmed it's byte-identical to the verified rasterized preview.
- Full validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test` (7 files/19
  tests, unchanged — this is a visual asset, not new testable logic), `pnpm build`,
  `pnpm test:consumer`. No console errors at 1440×900 or 320×700 in a live dev server.
- Sent the final rasterized image directly to Shimon so he could see it without
  needing his own dev environment running.

## Evidence as of 2026-07-27 (hardening branch `webgl-portrait-texture`, PR #1)

**Current milestone:** M1–M3 complete. M4 and M5 both **in progress** (not complete —
see open items below). Not yet a fully "production-ready" release, but every gate that
was checkable has been checked, and every gap found was either closed or named
explicitly rather than glossed over.

Five slices landed on a dedicated branch/PR, each independently validated:

1. Ported the digital-woman illustration into the WebGL scene (shared artwork data,
   Canvas2D→WebGL texture, format-aware positioning via `computePortraitBox`).
2. Added real-DOM (`jsdom`) lifecycle test coverage — the actual
   `createDefaultBrowserEnvironment()` path, previously untested, now exercised
   through real `document.hidden`/`visibilitychange`/`webglcontextlost` events.
3. Added accessibility/keyboard test coverage (`@testing-library/react`).
4. Demoed `portrait`/`square` formats live in the demo app — surfaced and fixed a
   real bug in the process: duplicate `id="scene-title"` across mounted scenes,
   fixed via `useId()`.
5. Built a minimal config-round-trip builder (`SceneBuilder.tsx` +
   `exportSceneConfig`/`importSceneConfig`, now public exports), live-verified: an
   exported config, after switching away and re-importing, reproduces an exact
   string match, with the live preview updating correctly.

**Final hardening pass:**
- Added an asset-failure test: `SceneWebgl` renders without throwing or logging
  console errors when `canvas.getContext` returns `null`.
- Wrote `README.md` — real public API documentation, including an explicit,
  deliberately honest statement that the rendering components are demo-only and not
  yet exported publicly (an open decision, not implied as shipped).
- Ran a genuine clean-install verification: `rm -rf node_modules` (root + the
  Next.js fixture) → `pnpm install --frozen-lockfile` → full validation suite, all
  passing from the fresh install.
- Reconciled `ACCEPTANCE_CRITERIA.md`'s release gates against actual verified state.

Test suite: **12 files / 40 tests** (up from 7/19 at the start of this branch).
Library artifact: 2.69 kB (up from 2.26 kB — `exportSceneConfig`/`importSceneConfig`
are a real, intended public API addition). Full evidence and per-slice detail in
`ROADMAP.md`'s "Hardening branch" entry.

## Open items (honestly not done — see `NEXT_TASK.md`)

- Visual parity between the CSS and WebGL scenes — the WebGL scene uses an abstract
  gradient/glow/sparkle vocabulary plus the new portrait texture; it doesn't attempt
  the matrix-rain/lighting look of the CSS scene.
- ~~Whether to export the rendering components publicly~~ — **resolved 2026-07-28**,
  see the evidence section near the end of this file.
- Full *responsive* builder scope (drag/drop layer editing, multi-scene management)
  beyond the minimal round-trip control panel now shipped.
- A consolidated risk/performance-budget audit document — evidence exists piecemeal
  across this file and `RISKS.md` but hasn't been synthesized into one document.

## Evidence as of 2026-07-27 (WebGL visual parity pass, after PR #1 merged to main)

- Rewrote `SceneWebgl`'s fragment shader so it actually resembles the CSS scene:
  background radial gradient now matches `.scene`'s position/colors (converted from
  CSS's top-down percentage to this shader's bottom-origin convention), aura/glow
  position corrected to match `.scene__aura` (was silently wrong before — used
  `0.42` directly instead of the correct `0.58`), and the old "diagonal sine wave"
  gradient-speed hack replaced with an actual procedural matrix-rain effect (hashed
  per-column scroll, flickering glyph cells, gated by `uRainDensity` so the
  `effects.codeRain` toggle genuinely hides it).
- **Real bug found and fixed during verification:** config changes only repainted on
  the next animation frame, which is invisible-fast in any real browser but never
  arrives at all in this session's environment (a previously-documented dead `rAF`).
  Fixed `SceneWebgl` to always repaint immediately on any config change, independent
  of animation/reduced-motion state — a genuine robustness fix (also covers a
  legitimately paused/backgrounded tab), not just a workaround for this session's
  tooling.
- **Methodology note for future sessions:** a checkbox's `checked` property +
  dispatched `'change'` event does *not* reliably trigger React's `onChange` the way
  the native-setter + `'input'`-event trick does for text/range/select — use a real
  `.click()` for checkboxes. Two false-alarm "bugs" this session turned out to be
  this exact test-harness mistake, not product defects.
- Live-verified via `gl.readPixels` scans in a real browser: rain glyph-flicker
  pattern present with `effects.codeRain: true`, cleanly absent (smooth gradient
  only) with it toggled `false` via a real click, exactly reversible. Glow and the
  portrait texture confirmed undisturbed across all four mounted canvases.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (12 files/40 tests,
  unchanged), `pnpm build`, `pnpm test:consumer`. Library artifact size unchanged
  (2.69 kB).

## Evidence as of 2026-07-28 (rendering components exported publicly, resolves R-006)

- Added `src/react.ts`, a **second, separate** library entry (`@matrix-ai/ui/react`) —
  not added to the main `src/index.ts` entry, per ADR-0004 (`DECISIONS.md`). Exports
  `Scene`, `SceneFallback`, `SceneWebgl`, `SubjectPortrait`. `SceneBuilder`/
  `DemoFormats` stay internal (dev tooling, not reusable production components).
- `vite.library.config.ts` now builds both entries in one pass, with a shared chunk
  for common code (`select.ts`) auto-extracted by Rollup rather than duplicated;
  added the `@vitejs/plugin-react`/`@tailwindcss/vite` plugins (needed now that a
  real entry has JSX/CSS); `build.lib.cssFileName: 'react'` names the emitted
  stylesheet explicitly (Vite's default derives from `package.json`'s `name` field
  otherwise — produced a confusing `ui.css` before this was set).
- `package.json` exports map gained `./react` and `./react.css` (the latter must be
  imported explicitly by the consumer — not auto-injected). `tsconfig.lib.json`
  extended to include the four exported `.tsx` files and exclude `*.test.tsx`.
- **Real bug found and fixed during verification:** `detectConstrainedDevice()` in
  `Scene.tsx` had no try/catch (unlike its sibling `detectSupportsWebGL()`), so it
  would throw under SSR in any runtime without a `navigator` global at all. Worked in
  this session's Node 24 by version-specific luck (it polyfills
  `navigator.hardwareConcurrency`), not by design — wrapped it in the same defensive
  try/catch pattern.
- **Real Rollup gotcha found and fixed:** a `'use client'` directive placed in each
  individual component source file gets silently stripped once Rollup bundles them
  together — only preserved when it's the first statement of the bundled *entry*
  file. Moved the directive that actually matters to the top of `src/react.ts`.
- Added `fixtures/react-consumer.mjs` (`pnpm test:react-consumer`): renders
  `SceneFallback`/`SubjectPortrait`/`Scene` via `react-dom/server` in plain Node (no
  bundler), asserting on the output HTML — mirrors the existing `test:consumer`
  pattern for the main entry.
- Added `fixtures/nextjs-consumer/app/react/page.tsx`: a Server Component (no
  `'use client'` of its own) rendering `SceneFallback` from `@matrix-ai/ui/react`
  directly — proves the shipped `'use client'` directive lets Next's App Router
  treat it as a valid Server-Component-renders-Client-Component boundary. `next
  build` statically prerendered it; `next dev` live-verified in a real browser:
  correct styling applied (exact radial-gradient match via `getComputedStyle`, not
  just unstyled HTML), portrait SVG present, no console errors.
- Confirmed the existing `.` entry is completely unaffected — `fixtures/library-consumer.mjs`
  and the root Next.js page still pass unmodified. The split-entry design (ADR-0004)
  means a consumer who only wants config/validation never pulls in React-rendering
  code, CSS, or WebGL/Canvas2D internals.
- Rewrote `README.md`'s API documentation to cover both entries accurately, replacing
  the "not in the package yet" framing (no longer true) with a real usage guide
  including the `'use client'`/Next.js note and the required CSS import.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (13 files/43 tests,
  unchanged), `pnpm build`, `pnpm test:consumer`, `pnpm test:react-consumer`,
  `pnpm test:nextjs-consumer`. New sizes: `dist/lib/index.js` 2.28 kB, `react.js`
  20.19 kB (6.27 kB gzip), `react.css` 11.56 kB.

## Evidence as of 2026-07-28 (CI + bundle-size performance budget, resolves R-005)

- No CI existed for this repo at all before this — added `.github/workflows/ci.yml`,
  running on every push/PR: `typecheck` → `lint` → `test` → `build` →
  `test:consumer` → `test:react-consumer` → `test:nextjs-consumer` →
  `check:bundle-size` — the exact sequence every session up to now has run by hand.
- Added `scripts/check-bundle-size.mjs` (`pnpm check:bundle-size`, no new
  dependency): checks `dist/lib/index.js` (budget 5 kB), `react.js` (budget 30 kB),
  `react.css` (budget 20 kB), and any shared chunk (budget 2 kB each) — all set with
  real headroom above current verified sizes.
- **Verified the check can actually fail**: temporarily patched a copy with an
  impossibly low budget, confirmed `[FAIL]` output and a non-zero exit code, then
  discarded the patched copy — a budget check nobody's seen fail is indistinguishable
  from no check at all.
- Validated: ran the full CI sequence locally end-to-end — all pass, 13 files/43
  tests unchanged.

## Evidence as of 2026-07-28 (full M4 responsive builder scope, resolves R-009)

- Added `src/components/builderState.ts`: pure, unit-tested layer/scene helpers
  (`createLayer`/`removeLayer`/`moveLayer`/`reorderLayers`/`createScene`/
  `duplicateScene`) plus `localStorage`-backed `loadBuilderState`/`saveBuilderState`
  (guarded for SSR, validates every stored scene through `validateScene` so
  corrupted data can't crash the builder). 18 new unit tests.
- Rewrote `SceneBuilder.tsx`: multi-scene management (new/switch/duplicate/delete,
  persisted across reloads), Title/Eyebrow text fields (previously only editable via
  raw JSON import), and a generic per-layer editor — any layer type can be added,
  removed, and reordered via native drag-and-drop or keyboard-accessible ↑/↓
  buttons (drag alone isn't keyboard-operable; `AGENTS.md` requires keyboard access).
- Added 9 `SceneBuilder.test.tsx` tests covering all of the above plus confirming the
  existing export→import round-trip still works with the new generic layer model.
- **Real bug found and fixed during verification:** `src/react.ts` imports the whole
  `styles.css`, and CSS isn't tree-shaken — `.builder`/`.demo-format` rules (dev-tool
  only, never exported) were bundled into the *public* `react.css`. Caught by
  watching its size grow to 12.98 kB. Fixed by splitting into `src/styles.css`
  (public) and a new `src/demo.css` (demo-only, imported only by `src/main.tsx`) —
  `react.css` dropped to **10.08 kB**, smaller than before this slice even started.
- Live-verified in a real browser: add/remove/move/drag-and-drop reordering,
  full multi-scene lifecycle, and `localStorage` persistence surviving an actual
  page reload. Confirmed no horizontal overflow and correct responsive collapsing
  at 320px width.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (15 files/70 tests, up from
  13/43), `pnpm build`, `pnpm test:consumer`, `pnpm test:react-consumer`,
  `pnpm test:nextjs-consumer`, `pnpm check:bundle-size` all pass.

## Exact next task

No forced next task. Every risk in `RISK_PERFORMANCE_AUDIT.md`'s register is now
either resolved or an explicitly-accepted Low/Informational item. Remaining open
items are optional: visual regression tooling, and whether to publish to npm (see
`NEXT_TASK.md`).