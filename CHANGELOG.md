# Changelog

## 2026-07-28 — Full M4 responsive builder scope

- Added `src/components/builderState.ts`: pure, unit-tested helpers
  (`createLayer`/`removeLayer`/`moveLayer`/`reorderLayers`/`createScene`/
  `duplicateScene`) plus `localStorage`-backed `loadBuilderState`/`saveBuilderState`
  (guarded for SSR, validates every stored scene through `validateScene` so
  corrupted/old-shape data can't crash the builder — silently dropped instead).
  18 new unit tests.
- Rewrote `SceneBuilder.tsx`: multi-scene management (new/switch/duplicate/delete,
  persisted across reloads), Title/Eyebrow text fields (previously only editable via
  raw JSON import), and a generic per-layer editor replacing three hardcoded sliders
  — any layer type can now be added (only offering types not already present),
  removed, and reordered via native HTML5 drag-and-drop or keyboard-accessible ↑/↓
  buttons (drag alone isn't keyboard-operable, and `AGENTS.md` requires keyboard
  access).
- Added 9 new `SceneBuilder.test.tsx` tests: add/remove a particles layer, move
  up/down with correct disabled boundaries, new/switch/duplicate/delete scene flows
  (edits isolated per scene), persistence across a remount, and the existing
  export→import round-trip still working with the new generic layer model.
- **Real bug found and fixed during verification:** `src/react.ts` imports the whole
  `styles.css`, and CSS isn't tree-shaken — `.builder`/`.demo-format` rules (dev-tool
  only, never exported) were bundled into the *public* `react.css`, inflating it for
  every consumer. Caught by watching `react.css` grow to 12.98 kB while adding
  builder-only styles. Fixed by splitting into `src/styles.css` (public, imported by
  `src/react.ts`) and a new `src/demo.css` (demo-only, imported only by
  `src/main.tsx`) — `react.css` dropped to 10.08 kB, smaller than before this slice
  even started.
- Live-verified in a real browser: add/remove/move/drag-and-drop layer reordering,
  full multi-scene lifecycle, and `localStorage` persistence surviving an actual page
  reload. Confirmed no horizontal overflow and correct responsive collapsing at
  320px width.
- This resolves `RISK_PERFORMANCE_AUDIT.md`'s R-009 — the last item in the risk
  register with an open resolution path. Every item (R-001–R-009) is now resolved or
  an explicitly-accepted Low/Informational item.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (15 files/70 tests, up from
  13/43), `pnpm build`, `pnpm test:consumer`, `pnpm test:react-consumer`,
  `pnpm test:nextjs-consumer`, `pnpm check:bundle-size` all pass.

## 2026-07-28 — CI + bundle-size performance budget

- No CI existed for this repo at all until now — every validation command had been
  run manually, every session. Added `.github/workflows/ci.yml`: on every push to
  `main` and every PR, runs `typecheck` → `lint` → `test` → `build` →
  `test:consumer` → `test:react-consumer` → `test:nextjs-consumer` →
  `check:bundle-size`, in that order.
- Added `scripts/check-bundle-size.mjs` (`pnpm check:bundle-size`) — a plain Node
  script, no new dependency, consistent with this repo's minimal-dependencies
  preference over something like `size-limit`. Checks `dist/lib/index.js` (budget
  5 kB, current 2.28 kB), `react.js` (budget 30 kB, current 20.19 kB), `react.css`
  (budget 20 kB, current 11.56 kB), and any shared chunk (budget 2 kB each) — all set
  with real headroom above current verified sizes.
- **Verified the check-script can actually fail, not just always pass**: temporarily
  patched a copy with an impossibly small budget, confirmed `[FAIL]` output and a
  non-zero exit code, then discarded the patched copy.
- This resolves `RISK_PERFORMANCE_AUDIT.md`'s R-005 — the last Medium-severity open
  risk. Both Medium risks (R-005, R-006) are now resolved.
- Validated: ran the full CI sequence locally end-to-end — all pass, 13 files/43
  tests unchanged.

## 2026-07-28 — Export rendering components publicly (`@matrix-ai/ui/react`)

- Added `src/react.ts` as a **second, separate** library entry — not merged into the
  main `@matrix-ai/ui` entry — exporting `Scene`, `SceneFallback`, `SceneWebgl`,
  `SubjectPortrait`. See `DECISIONS.md` ADR-0004 for the full rationale.
  `SceneBuilder`/`DemoFormats` stay internal (dev tooling, not reusable production
  components).
- `vite.library.config.ts` now builds both entries in one pass; Rollup automatically
  extracts their shared dependency into a small common chunk. Added the
  `@vitejs/plugin-react`/`@tailwindcss/vite` plugins (needed now that a real entry
  has JSX/CSS). `build.lib.cssFileName: 'react'` names the emitted stylesheet
  explicitly.
- `package.json` exports map gained `./react` (`dist/lib/react.js`) and
  `./react.css` (`dist/lib/react.css`, imported explicitly by the consumer — not
  auto-injected). `tsconfig.lib.json` extended accordingly.
- **Real bug found and fixed:** `Scene.tsx`'s `detectConstrainedDevice()` had no
  try/catch (unlike its sibling `detectSupportsWebGL()`), so it would throw under SSR
  in any runtime without a `navigator` global. Worked in this session's Node 24 by
  version-specific luck, not by design — wrapped it in the same defensive try/catch.
- **Real Rollup gotcha found and fixed:** a `'use client'` directive placed in each
  individual component source file gets silently stripped once bundled together —
  only preserved at the top of the bundled entry file. Moved the one that matters to
  `src/react.ts`.
- Added `fixtures/react-consumer.mjs` (`pnpm test:react-consumer`): renders
  `SceneFallback`/`SubjectPortrait`/`Scene` via `react-dom/server` in plain Node,
  asserting on the output HTML.
- Added `fixtures/nextjs-consumer/app/react/page.tsx`: a Server Component rendering
  `SceneFallback` from `@matrix-ai/ui/react` directly, proving the `'use client'`
  boundary works under Next's App Router. `next build` statically prerendered it;
  `next dev` live-verified in a real browser: correct styling applied, no errors.
- Rewrote `README.md` to document both entries accurately, replacing the "not in the
  package yet" framing (no longer true).
- This resolves audit R-006 (`RISK_PERFORMANCE_AUDIT.md`).
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (13 files/43 tests,
  unchanged), `pnpm build`, `pnpm test:consumer`, `pnpm test:react-consumer`,
  `pnpm test:nextjs-consumer` all pass. New sizes: `dist/lib/index.js` 2.28 kB,
  `react.js` 20.19 kB (6.27 kB gzip), `react.css` 11.56 kB.

## 2026-07-28 — Consolidated risk/performance audit

- Added `RISK_PERFORMANCE_AUDIT.md`, consolidating risk and performance evidence that
  had been scattered across `PROJECT_STATE.md`/`RISKS.md`/`ACCEPTANCE_CRITERIA.md` —
  the last open item on the release-gate checklist.
- Re-verified every number fresh: published library `2.69 kB` (1.13 kB gzip), demo
  app `211.56 kB` JS / `11.55 kB` CSS (documented as not representative of a single
  production scene — the demo mounts 4 scene instances at once).
- Documented runtime performance characteristics (WebGL draw-call/shader cost, CSS
  animation compositor-friendliness, lifecycle-host pause-on-hidden as a real
  perf/battery win) and built a consolidated risk register (R-001–R-009).
- Found and reconciled stale, already-resolved risk bullets in `PROJECT_STATE.md` and
  `RESTART_PROMPT.md` (both had accumulated entries from earlier sessions that later
  work resolved but never removed) — marked with strikethrough + resolution evidence
  rather than silently deleted.
- Found one bullet that looked resolved but genuinely wasn't: no automated test
  existed for the `Scene` component's webgl-vs-css branch decision. Added
  `Scene.test.tsx` (3 tests), which required building a proper minimal fake WebGL
  context for jsdom rather than reusing the existing null-context trick.
- Marked `ACCEPTANCE_CRITERIA.md`'s last open release gate as done.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (13 files/43 tests, up from
  12/40), `pnpm build`, `pnpm test:consumer` all pass. Library artifact size
  unchanged (2.69 kB).

## 2026-07-27 — WebGL visual parity pass (after PR #1 merged)

- Rewrote `SceneWebgl`'s fragment shader to actually resemble the CSS scene:
  background radial gradient now matches `.scene`'s position/colors (converted
  correctly from CSS's top-down percentage to this shader's bottom-origin
  convention), aura/glow position fixed to match `.scene__aura` (was silently using
  the wrong value — `0.42` instead of the correct `0.58` — before this pass), and
  the previous "diagonal sine wave changes gradient-mix speed" hack replaced with an
  actual procedural matrix-rain effect (hashed per-column scroll, flickering
  glyph-like cells, gated by `uRainDensity` so `effects.codeRain` genuinely hides
  it).
- **Real bug found and fixed during verification:** config changes (e.g. toggling
  an effect in the live builder) only repainted the canvas on the next animation
  frame — imperceptibly fast in any real browser, but this session's environment has
  a documented dead `requestAnimationFrame`, so nothing visibly updated at all,
  which looked like a shader bug at first. Fixed `SceneWebgl` to always repaint
  immediately on any config change, independent of animation/reduced-motion state —
  a genuine robustness improvement (also covers a legitimately paused/backgrounded
  tab), not just a workaround for this session's tooling.
- **Test-methodology note for future sessions:** a checkbox's `checked` property +
  dispatched `'change'` event does not reliably trigger React's `onChange` the way
  the native-setter + `'input'`-event trick does for text/range/select inputs — a
  real `.click()` is required. Two false-alarm "bugs" chased this session turned out
  to be this exact test-harness mistake, not product defects.
- Live-verified via `gl.readPixels` scans in a real browser: rain glyph-flicker
  pattern present with `effects.codeRain: true`, cleanly absent with it toggled
  `false` via a real click, exactly reversible back to the original baseline. Glow
  and the portrait texture confirmed undisturbed across all four mounted canvases.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (12 files/40 tests,
  unchanged), `pnpm build`, `pnpm test:consumer` all pass. Library artifact size
  unchanged (2.69 kB).

## 2026-07-27 — Hardening branch (`webgl-portrait-texture`, PR #1)

Five slices plus a final hardening pass, each independently validated
(typecheck/lint/test/build/consumer fixtures):

1. **WebGL portrait rendering.** Shared the SVG path/gradient data
   (`src/scene/portraitArt.ts`), added a Canvas2D→WebGL texture painter
   (`src/renderer/browser/portraitTexture.ts`) and format-aware box layout
   (`src/renderer/portraitLayout.ts`, pure/tested). The digital-woman subject now
   renders in the WebGL scene, not just the CSS fallback.
2. **Real-DOM lifecycle test coverage.** Added `jsdom` and a new test file exercising
   `createDefaultBrowserEnvironment()` — the real production path, previously
   completely untested — through actual `document.hidden`/`visibilitychange`/
   `webglcontextlost` events.
3. **Accessibility/keyboard test coverage.** Added `@testing-library/react` +
   `SceneFallback.test.tsx` covering real button focusability, non-dangling
   `aria-labelledby`, decorative-layer `aria-hidden`, and reduced-motion toggling.
4. **Demoed portrait/square formats live**, surfacing a real bug: both scene
   components hardcoded `id="scene-title"`, which would produce duplicate DOM ids
   the moment more than one scene mounted on a page. Fixed via React's `useId()`.
5. **Minimal config-round-trip builder.** `src/components/SceneBuilder.tsx` +
   `src/scene/roundTrip.ts` (`exportSceneConfig`/`importSceneConfig`, now public
   exports). Live-verified the actual round-trip in a real browser: export while in
   one format, switch away, paste the export back in, exact string match restored.

**Final hardening pass:**
- Added an asset-failure test: `SceneWebgl` renders without throwing or logging
  console errors when WebGL is unavailable (`canvas.getContext` returns `null`).
- Wrote `README.md`: real public API documentation, including an explicit statement
  that the rendering components are demo-only, not yet exported publicly.
- Ran a genuine clean-install verification (`rm -rf node_modules` for both the root
  and the Next.js fixture workspace member, then `pnpm install --frozen-lockfile`) —
  the full validation suite passed from that fresh install.
- Reconciled `ACCEPTANCE_CRITERIA.md`'s release gates against verified reality.

Test suite grew from 7 files/19 tests to 12 files/40 tests across this branch.
Library artifact grew from 2.26 kB to 2.69 kB (the round-trip functions are a real,
intended public API addition, not a leak). PR opened at
https://github.com/reshimu/matrix-women/pull/1, not yet merged.

## 2026-07-27 — Digital-woman subject: real illustration

- Added `src/components/SubjectPortrait.tsx`: a real hand-authored SVG illustration,
  replacing the placeholder CSS blob shapes (`.subject__halo/head/neck/shoulders`
  divs with border-radius/gradient hacks). Design: symmetric, front-facing, faceless
  silhouette — head/neck/shoulders as a single half-path mirrored via SVG
  `transform="translate(400,0) scale(-1,1)"` (guarantees perfect symmetry, not
  hand-duplicated coordinates), a soft halo ring + radial glow behind the head, a
  darker flowing hair shape, thin strand-highlight lines confined within the hair
  silhouette, and a subtle vertical center-face light highlight.
- Deliberately faceless/symbolic rather than photorealistic: matches `AGENTS.md`'s
  "serene, intelligent, dignified, feminine, ethereal, symbolic, non-sexualized"
  requirement and avoids uncanny-valley risk entirely. Fully inline SVG — no external
  image service, no unlicensed artwork, per `PROJECT_SPEC.md`'s asset constraint.
- **This session's screenshot tooling was fundamentally broken**: the sandboxed
  browser pane doesn't composite frames (established earlier this session), and
  Claude in Chrome's automated tab turned out to have a genuine `0×0` viewport
  (confirmed via a failed `resize_window` call — "bounds must be at least 50% within
  visible screen space"). Worked around it by rasterizing the SVG directly to PNG
  (`npx resvg-cli`) and reading the resulting image. Iterated 4 versions this way: v1
  read as a snowman (no neck definition, hair looked like a cloak, not hair); v2
  fixed proportions via the clean mirrored half-path approach; v3 added strand
  highlights that crossed over the torso and looked like scratches (anatomically
  backwards — hair falls behind wider shoulders, not draped over the front); v4
  confined the strand highlights within the hair silhouette, which read correctly.
- Confirmed the shipped component matches: extracted the real DOM's
  `.scene__subject svg` output from the running dev server (temporarily forcing the
  CSS-fallback branch via the same override-then-revert pattern used for prior
  renderer-branch checks this session, then reverting) and confirmed it's
  byte-identical to the verified rasterized preview.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (7 files/19 tests, unchanged —
  this is a visual asset, not new testable logic), `pnpm build`, `pnpm test:consumer`
  all pass. No console errors at 1440×900 or 320×700 in a live dev server.
- Sent the final rasterized preview image directly to Shimon.

## 2026-07-27 — Next.js consumption proof

- Added `pnpm-workspace.yaml` (`packages: ['.', 'fixtures/*']`) and
  `fixtures/nextjs-consumer/` — a real Next.js 15 app, a genuine pnpm workspace
  member depending on `@matrix-ai/ui` via `workspace:*` (confirmed resolved as a real
  filesystem symlink, not a hand-rolled path hack).
- `app/page.tsx` is a Server Component (no `'use client'`) importing `defaultScene`,
  `validateScene`, `selectRenderer`, and `selectActiveLayers` directly from
  `@matrix-ai/ui` — proving the public library entry has zero DOM/browser
  dependencies and is genuinely safe at Next's build/server-render time.
- `next build` succeeded and statically prerendered the page. `next dev` was
  live-verified in a real browser: correct SSR-computed values rendered (`Scene id:
  matrix-serenity`, `Renderer kind: webgl`, `Active layers: subject, matrix-rain,
  ambient-light`), no console errors.
- **Caught and fixed during wiring:** adding the fixture broke root `pnpm lint`
  (`max-warnings=0`) via a `react-refresh/only-export-components` warning on
  `layout.tsx`'s Next-required `metadata` export — a known false-positive (Vite's
  react-refresh rule lacks the exception `eslint-config-next` normally provides).
  Scoped the rule off for `fixtures/nextjs-consumer/**` only, not suppressed globally.
- Added `pnpm test:nextjs-consumer` script (mirrors `test:consumer`'s pattern) and a
  `.claude/launch.json` entry for previewing `next dev`.
- Re-ran the full pre-existing validation suite after adding the workspace: `pnpm
  typecheck`, `pnpm lint`, `pnpm test` (7 files/19 tests, unchanged), `pnpm build`,
  `pnpm test:consumer` all still pass — confirming the workspace addition didn't
  disturb anything pre-existing.
- This closes a `PROJECT_SPEC.md` requirement ("must support... Vite and Next.js
  consumption") that had been an open, explicitly flagged gap since the M0 recon pass.

## 2026-07-27 — M3 config-driven WebGL composition

- Added `src/renderer/webglUniforms.ts` (`deriveWebglUniforms`, pure and tested — 4
  tests) mirroring `selectActiveLayers`: reduces `selectActiveLayers(scene)` into 4
  shader uniforms — glow intensity (from a `lighting` layer's `intensity`×`opacity`),
  rain density (from `code-rain`'s `density`×`opacity`, driving the gradient's
  oscillation speed), portrait opacity (overall brightness), and sparkle (from a
  `particles` layer's `count`/200 capped at 1, ×`opacity`) — each zeroed when its
  layer isn't active (effect flag off).
- `SceneWebgl`'s fragment shader now consumes these: a radial glow at a fixed screen
  position, gradient speed, brightness, and procedural sparkle dots all respond to
  `scene.layers`/`scene.effects`, not just `reducedMotion` as before.
- Uniforms are recomputed via `useMemo` and synced to a ref inside an effect (not
  captured once at mount), so config changes take effect live without restarting the
  WebGL context; the static/reduced-motion paint path also repaints when config
  changes, not just when animating.
- **Bug caught by lint, not by me:** ESLint's `react-hooks/refs` rule flagged mutating
  a ref directly during render. Fixed by moving the uniform derivation into `useMemo`
  and syncing the ref inside an effect.
- Live-verified in Claude in Chrome (real browser): exact pixel readback at the
  shader's glow center matched hand-computed shader math (`[81, 193, 169]`); a far
  corner matched the existing gradient baseline (`[23, 88, 81]`). Temporarily set
  `effects.glow: false` in `main.tsx`, reloaded, confirmed the glow-center pixel
  dropped to match the far-corner baseline (`[23, 88, 80]`) — proving the effects
  toggle gates WebGL output, not just CSS — then reverted before final validation and
  commit.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (7 files / 19 tests, up from
  6/15), `pnpm build`, `pnpm test:consumer` all passed. Library artifact size
  unchanged (2.26 kB).

## 2026-07-27 — Real-browser spot-check of WebGL animation/resize

- Re-verified the previous slice's WebGL animation/resize plumbing in Claude in Chrome
  (a real, non-sandboxed Chrome instance, distinct from this session's synthetic
  browser-pane tool). Static output (shader math via `gl.readPixels`, canvas mount,
  mount-time sizing) reproduced identically with no console errors.
- `requestAnimationFrame` and `ResizeObserver` still did not fire. Traced to
  `window.innerWidth`/`innerHeight` reporting `[0, 0]` in this automated tab — it has
  no actual rendering viewport at all, so Chrome legitimately suspends both APIs
  (standard behavior for any non-composited page, in any browser).
- Confirmed the suspension tracks Chrome's real internal compositor-visibility state,
  not the JS-observable `document.hidden` flag: spoofing `document.hidden` to `false`
  via `Object.defineProperty` did not unlock `rAF` (0 frames over 3 real seconds);
  `document.visibilityState` kept reporting the true hidden state regardless.
- **Conclusion:** a literal frame-by-frame visual check isn't achievable with any tool
  available this session. This is a hard environment limitation, not a code defect —
  and it positively confirms the lifecycle host's pause-on-hidden logic tracks genuine
  browser compositor state rather than a fragile JS-only flag. Only a literal
  human-eyes-on-screen check (opening the dev server in a real, visible window)
  remains outside what any available tool could verify; not required before
  proceeding.
- No code changes this session — verification only. Updated `ROADMAP.md`,
  `NEXT_TASK.md`, `PROJECT_STATE.md`, `RESTART_PROMPT.md` with the findings.

## 2026-07-27 — M3 trivial animated gradient

- Replaced `SceneWebgl`'s placeholder clear-color with a real shader: a fullscreen
  triangle vertex shader and a fragment shader mixing two colors via
  `sin(uTime * 0.4 + ...)`, animated through `requestAnimationFrame`, gated to only
  run while the lifecycle host reports `running` and only when `scene.reducedMotion`
  is false (a single static frame otherwise).
- **Bug found and fixed during verification:** the canvas's WebGL drawing-buffer size
  was only kept in sync via a `window.resize` listener, which doesn't fire for all
  viewport-size changes — caught live (CSS layout size updated, actual render
  resolution did not). Fixed by switching to a `ResizeObserver` on the canvas element,
  the correct API for this, which also immediately repaints at the last-known
  animation time so paused/reduced-motion scenes stay correctly sized after a resize.
- Verified live: shader math via `gl.readPixels` (matched hand-computed color),
  lifecycle running/paused gating (via forced `document.hidden` toggling), and
  mount-time canvas sizing at 1440×900 and 320×700.
- **Verification gap, stated plainly:** could not observe continuous animation frames
  or post-mount resize repainting live, because this session's browser-pane tool does
  not composite frames at all — confirmed directly (a raw `ResizeObserver` never fired
  even for a manual style change; a raw `requestAnimationFrame` counter never
  completed in 30s). This is a tool-environment limitation, not a known defect;
  flagged in `NEXT_TASK.md` as worth a real-browser spot-check.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (6 files / 15 tests,
  unchanged), `pnpm build`, `pnpm test:consumer` all passed. Library artifact size
  unchanged (2.26 kB).

## 2026-07-27 — M3 WebGL wiring (Option B)

- Added `src/components/Scene.tsx`: a composition root that detects
  `prefersReducedMotion`, `supportsWebGL` (via a throwaway canvas WebGL-context probe),
  and `constrainedDevice` (via `navigator.hardwareConcurrency`/`deviceMemory`) live in
  the browser, feeds them to `selectRenderer`, and mounts `SceneWebgl` or
  `SceneFallback` accordingly.
- Added `src/components/SceneWebgl.tsx`: mounts a real `<canvas>`, obtains a genuine
  `WebGLRenderingContext`, wires up `createWebglRendererHost`, and paints a
  placeholder clear color on start/resume. Deliberately no shaders or geometry yet.
- `main.tsx` now renders `<Scene>` instead of `<SceneFallback>` directly.
- Live-verified both branches in a real browser: WebGL branch confirmed via
  `gl.readPixels` (placeholder color actually painted on a correctly-sized canvas);
  CSS fallback branch confirmed by temporarily forcing `detectSupportsWebGL()` to
  return `false`, reloading, verifying `SceneFallback` mounted, then reverting the
  override before running final validation and committing.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (6 files / 15 tests,
  unchanged — this slice is integration wiring around already-tested units), `pnpm
  build`, `pnpm test:consumer`. Library artifact size unchanged (2.26 kB).
- M3 marked "in progress" (wiring done, no rendering content yet) in
  `ROADMAP.md`/`ACCEPTANCE_CRITERIA.md`; next slice (actual WebGL rendering content)
  proposed in `NEXT_TASK.md`, pending confirmation.

## 2026-07-27 — M3 WebGL renderer lifecycle scaffold

- Extracted `src/renderer/browser/environment.ts` (shared `BrowserLifecycleEnvironment`
  types and default factory) out of `cssRendererHost.ts` so the new WebGL host doesn't
  duplicate it; `cssRendererHost.ts` behavior is unchanged and its existing tests still
  pass unmodified.
- Added `src/renderer/browser/webglRendererHost.ts`: a lifecycle host mirroring the
  CSS host's `start`/`pause`/`resume`/`dispose`/`getState` shape, plus a
  `context-lost` state driven by `webglcontextlost`/`webglcontextrestored` that takes
  precedence over visibility/intersection-driven pausing until restored.
- Added 4 unit tests covering hidden/offscreen pausing, context-loss entry/recovery,
  context-loss surviving a visibility change, and manual pause/resume/dispose cleanup.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (6 files / 15 tests, up from
  5/11), `pnpm build`, `pnpm test:consumer` all passed. Library artifact size unchanged
  (2.26 kB), confirming no browser-only code leaked into the public entry.
- Deliberately scoped to the lifecycle contract only: no shaders, geometry, or actual
  WebGL drawing, and not wired into `selectRenderer`/`SceneFallback`. M3 marked
  "in progress" in `ROADMAP.md`/`ACCEPTANCE_CRITERIA.md`; two candidate next slices
  proposed in `NEXT_TASK.md`, pending confirmation before starting.

## 2026-07-27 — M2 core scene composition

- Added `src/scene/composition.ts` (`selectActiveLayers`, pure and tested) so
  `scene.effects` toggles (codeRain/particles/glow) actually determine which
  configured `scene.layers` render, rather than being ignored.
- Wired `SceneFallback` to render only active layers, applying each layer's
  `opacity`, and `density`/`intensity`/`count` where applicable, to real output.
- Added a `particles` layer render path (previously typed and validated but never
  rendered anywhere).
- Added real CSS layout differentiation for `hero`/`portrait`/`square` formats
  (distinct aspect-ratio, min-height, alignment) — verified via computed-style
  inspection, not just class-name presence.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (5 files / 11 tests, up from
  4/7), `pnpm build`, `pnpm test:consumer` all passed. Live browser inspection at
  1440×900 and 320×700 confirmed config values reach rendered output with no console
  errors.
- Marked M2 complete in `ROADMAP.md`/`ACCEPTANCE_CRITERIA.md`; proposed the first M3
  (WebGL lifecycle) slice in `NEXT_TASK.md`, pending confirmation before starting.

## 2026-07-27 — Recon and record reconciliation

- Ran a full recon pass (no product code changed): re-verified typecheck, lint, tests
  (4 files / 7 tests), demo build, library build, and the consumer fixture all pass;
  read every file in `src/` for stubs, mocks, TODOs, or placeholder logic (none found).
- Discovered `ROADMAP.md`, `NEXT_TASK.md`, and `PROJECT_STATE.md` had drifted from
  actual code state: the browser-only CSS renderer lifecycle host
  (`src/renderer/browser/cssRendererHost.ts`) was already implemented and tested but
  still described as pending work in all three files.
- Discovered the real remaining M2 gap: `SceneFallback` renders fixed hardcoded markup
  and does not read `scene.layers` or `scene.effects` from the validated `SceneConfig`
  — the schema and validation exist and are tested, but nothing in the render path
  consumes them yet.
- Corrected `ROADMAP.md` (M2 status), `NEXT_TASK.md` (real next task), and this file's
  companion `PROJECT_STATE.md` to reflect verified reality rather than assumed
  progress.
- Initialized a Git repository for the first time (none existed previously), merged in
  a pre-existing remote `README.md`, and pushed to `github.com/reshimu/matrix-women`.

## 2026-07-26 — M0 governance initialization

- Audited the supplied workspace: it is empty and is not a Git repository.
- Added the source-of-truth, product specification, state, roadmap, acceptance, decision, risk, next-task, and changelog records.
- Recorded the missing prototype as a high-severity blocker; no application code or dependency setup was created.

## 2026-07-26 — M1 foundation

- Recorded explicit greenfield authorization and completed M0 under ADR-0002.
- Added Vite, React, TypeScript, Tailwind, lint, test, and production-build configuration.
- Added renderer-independent scene defaults plus a responsive CSS fallback scene.
- Validated typecheck, lint, test, build, and visual behavior at desktop and 320px mobile.

## 2026-07-26 — M1 schema and fallback contract

- Added typed portrait, code-rain, particle, and lighting scene layers.
- Added deterministic scene validation and renderer-selection tests.
- Added an import-safe public entry point and documented ADR-0003.
- Created `RESTART_PROMPT.md` for a clean future-session handoff.
## 2026-07-26 — M1 library artifact

- Added a separate Vite library build with declaration output and explicit package exports.
- Declared React and React DOM as package peers.
- Added a package-name consumer fixture and validated it against the built artifact.
- Completed M1; next work begins M2 renderer lifecycle infrastructure.