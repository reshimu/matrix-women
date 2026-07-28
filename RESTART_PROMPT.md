# Matrix AI UI — restart prompt pack

Use this file at the start of any new session before changing code.

## Copy/paste prompt

Continue the Matrix AI UI greenfield build in `C:\dev\matrix-women`. Read `AGENTS.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `DECISIONS.md`, `ACCEPTANCE_CRITERIA.md`, and this file first. Follow the repository authority order and work-slice loop. Implement exactly the atomic task in `NEXT_TASK.md`; validate with `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:consumer`, and `pnpm build`; inspect visual output when visual behavior changes; then update project records and this file. Do not weaken tests, skip validations, or add out-of-scope product features.

## Current verified state

- Explicit greenfield authorization; no prototype was provided.
- M0, M1, and M2 are complete. M3 (progressive WebGL enhancement) is functionally
  complete end-to-end (lifecycle, wiring, animation, config-driven composition,
  real-browser spot-check) — only visual parity with the CSS scene and further
  constrained-device work remain, both deferred by choice. The Next.js consumption
  proof required by `PROJECT_SPEC.md` (a spec gate, not tied to any one milestone) is
  also done.
- Demo: Vite 8 + React 19 + TypeScript 5.9 + Tailwind 4. `src/main.tsx` renders the responsive CSS fallback in `src/components/SceneFallback.tsx`.
- Library: `src/index.ts` exports browser-free scene defaults/types/validation, renderer selection, and `selectActiveLayers`. `vite.library.config.ts` emits `dist/lib/index.js`; `tsconfig.lib.json` emits declarations.
- Consumer proof: `fixtures/library-consumer.mjs` imports `@matrix-ai/ui` after `pnpm build:library`.
- Browser-only CSS renderer lifecycle host exists at
  `src/renderer/browser/cssRendererHost.ts` — `start`/`pause`/`resume`/`dispose`,
  driven by `visibilitychange` and `IntersectionObserver`, with injectable environment
  and its own passing test file.
- **(2026-07-27, M2 composition slice)** `src/scene/composition.ts` exports
  `selectActiveLayers`, which filters `scene.layers` by the matching `scene.effects`
  flag. `SceneFallback` renders only active layers and applies each layer's
  opacity/density/intensity/count to actual output. `hero`/`portrait`/`square` now
  produce real, distinct CSS layouts (aspect-ratio, min-height, alignment all differ),
  verified via computed-style inspection in a live browser.
- Last visual inspection passed 2026-07-27 at 1440×900 and 320×700 in a live dev
  server (not just the built artifact): no browser-console errors; confirmed via
  `getComputedStyle` that density/intensity/format actually reach rendered output.
- **(2026-07-27, M3 lifecycle scaffold)** `src/renderer/browser/webglRendererHost.ts`
  mirrors the CSS host's start/pause/resume/dispose shape, adds a `context-lost` state
  (via `webglcontextlost`/`webglcontextrestored`) that overrides visibility/
  intersection pausing until restored. Shared environment types extracted to
  `src/renderer/browser/environment.ts` (used by both hosts, no behavior change to the
  CSS host).
- **(2026-07-27, M3 wiring, Option B)** `src/components/Scene.tsx` now runs
  `selectRenderer` with live capability detection and mounts `SceneWebgl` or
  `SceneFallback`. `main.tsx` mounts `<Scene>`. Both branches confirmed live in a real
  browser.
- **(2026-07-27, M3 trivial animated gradient)** `SceneWebgl` now renders a real
  shader (fullscreen triangle + `sin(uTime*0.4+...)` two-color mix), animating via
  `requestAnimationFrame` only while the lifecycle host is `running` and only when
  `scene.reducedMotion` is false. Canvas resizing uses a `ResizeObserver` (fixed from
  an initial `window.resize`-listener bug that left the drawing-buffer size stale after
  a viewport change).
- **(2026-07-27, M3 real-browser spot-check)** Re-verified in Claude in Chrome (a
  real, non-sandboxed browser). Static behavior reproduced identically, no console
  errors. `requestAnimationFrame`/`ResizeObserver` still didn't fire — traced to the
  automated tab having a `0×0` viewport (no real rendering surface), and confirmed
  this suspension tracks Chrome's actual compositor-visibility state, not a spoofable
  JS flag (`document.hidden` override didn't unlock `rAF`). This is a hard limitation
  of every automated tool available this session, not a code defect — and it
  positively confirms the lifecycle host's pause-on-hidden logic tracks genuine
  browser state. Only a literal human-eyes-on-screen check remains outside what any
  available tool could verify.
- **(2026-07-27, M3 config-driven WebGL composition)** Added
  `src/renderer/webglUniforms.ts` (`deriveWebglUniforms`, pure, tested) mirroring
  `selectActiveLayers`: reduces active layers into 4 shader uniforms (glow intensity,
  rain-speed density, portrait brightness, sparkle), each zeroed when its effect flag
  is off. `SceneWebgl`'s shader now uses these. Live-verified in Claude in Chrome via
  exact pixel readback, including confirming an `effects.glow: false` override
  actually zeroes the glow pixel (tested by temporarily editing `main.tsx`, then
  reverting before commit). Caught a real `react-hooks/refs` lint error along the way
  (mutating a ref during render) and fixed it via `useMemo` + effect.
- **(2026-07-27, Next.js consumption proof)** Added `pnpm-workspace.yaml` and
  `fixtures/nextjs-consumer/` — a real Next.js 15 app, its own pnpm workspace member,
  depending on `@matrix-ai/ui` via `workspace:*` (confirmed resolved as a real
  symlink). `app/page.tsx` is a Server Component (no `'use client'`) importing
  `defaultScene`/`validateScene`/`selectRenderer`/`selectActiveLayers` directly.
  `next build` statically prerendered the page; `next dev` live-verified in a real
  browser with correct SSR-computed output and no console errors. Caught and fixed a
  real lint break (`react-refresh/only-export-components` false-positive on Next's
  required `metadata` export) by scoping the rule off for the fixture directory only.
  Added `pnpm test:nextjs-consumer` and a `.claude/launch.json` entry for `next dev`.
- **(2026-07-27, digital-woman subject illustration)** Added
  `src/components/SubjectPortrait.tsx`: a real hand-authored SVG replacing the
  placeholder CSS blob divs — symmetric faceless silhouette (mirrored half-path via
  SVG transform), soft halo, flowing hair with confined strand highlights, subtle
  center-face light. This session's screenshot tools were fundamentally broken (see
  Known risks); worked around it by rasterizing the SVG directly (`npx resvg-cli`) and
  reading the PNG, iterating 4 versions until proportions read correctly (not the
  earlier "snowman"). Confirmed the shipped component's live DOM output is
  byte-identical to the verified preview.
- **(2026-07-27, hardening branch `webgl-portrait-texture`, PR #1)** Five slices, all
  live-verified: (1) ported the illustration into the WebGL scene via a Canvas2D→
  WebGL texture, positioned per-format with `computePortraitBox`; (2) added `jsdom`
  real-DOM lifecycle test coverage for `createDefaultBrowserEnvironment()`, closing a
  repeatedly-flagged gap; (3) added accessibility/keyboard tests
  (`@testing-library/react`); (4) demoed `portrait`/`square` live, which surfaced and
  fixed a real duplicate-id a11y bug (`useId()`); (5) built a minimal config
  round-trip builder (`SceneBuilder.tsx`, `exportSceneConfig`/`importSceneConfig` now
  public), round-trip verified exact. Final hardening: an asset-failure test, a real
  `README.md`, a genuine clean-install verification (`rm -rf node_modules` + `pnpm
  install --frozen-lockfile`), and release-gate reconciliation.
- Last full validation passed 2026-07-27 from a **clean install**: typecheck, lint,
  **12 Vitest files / 40 tests** (up from 7/19), both consumer fixtures, demo build,
  and library build (2.69 kB, up from 2.26 kB — a real public API addition).
- **PR #1 merged to `main`.** Follow-up: rewrote `SceneWebgl`'s fragment shader for
  visual parity with the CSS scene — background gradient position/colors, aura/glow
  position (fixed a silent bug: was using the wrong bottom-origin y value), and a
  real procedural matrix-rain effect replacing the old abstract diagonal-wave hack.
  Found and fixed a real robustness bug along the way: config changes now repaint
  immediately regardless of animation state (previously only took effect on the next
  animation frame, invisible-fast in a real browser but never arriving at all in
  this session's environment). Live-verified via `gl.readPixels` scans: rain
  glyph-flicker present/absent correctly on the `effects.codeRain` toggle, exactly
  reversible.

- **(2026-07-28, risk/performance audit)** Added
  [`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md) — freshly-verified bundle
  sizes (library 2.69 kB, demo 211.56 kB JS), runtime performance characteristics,
  and a consolidated risk register (R-001–R-009) reconciling the piecemeal risk
  bullets previously scattered across `PROJECT_STATE.md`/`RISKS.md` (several were
  stale/already-resolved — called out explicitly, not silently repeated). This closes
  the last open release gate in `ACCEPTANCE_CRITERIA.md`. Also closed a genuinely
  still-open gap found during reconciliation: added `Scene.test.tsx` covering the
  webgl-vs-css branch decision (13 files/43 tests now, up from 12/40).

- **(2026-07-28, rendering components exported publicly)** Added `src/react.ts`, a
  **second, separate** library entry (`@matrix-ai/ui/react`, not merged into the main
  `.` entry — ADR-0004), exporting `Scene`/`SceneFallback`/`SceneWebgl`/
  `SubjectPortrait` plus a `@matrix-ai/ui/react.css` the consumer imports explicitly.
  `'use client'` boundary verified against a real `next build`
  (`fixtures/nextjs-consumer/app/react/page.tsx`, live-checked in a real browser: real
  styling applied, no console errors); a new `fixtures/react-consumer.mjs` proves it
  works standalone under plain Node via `react-dom/server`. The `.` entry is
  completely unaffected — still zero DOM/CSS. Found and fixed two real bugs along the
  way: `Scene.tsx`'s `detectConstrainedDevice()` had no try/catch (would throw under
  SSR without a `navigator` global — worked by Node-version luck, not design); and a
  `'use client'` directive placed in individual component files gets silently
  stripped by Rollup once bundled — only the one at the top of the entry file
  (`src/react.ts`) survives. This resolves audit R-006.

## Exact next task

All release gates are checked, and R-006 is resolved. No forced next task — see
`NEXT_TASK.md` for candidate next steps (a CI performance budget, full M4
responsive-builder scope, visual regression tooling, or considering an npm publish
now that there's a real documented public API). Update all project records and this
restart pack with factual validation evidence when done.

## Non-negotiables

- React + TypeScript; Tailwind; Vite demo.
- The main `@matrix-ai/ui` entry remains renderer-independent and browser-free — the
  `@matrix-ai/ui/react` entry (rendering components) is deliberately the opt-in,
  browser-only counterpart (ADR-0004), not an exception to this rule.
- WebGL is enhancement only; CSS/Canvas/SVG fallback is mandatory.
- Support 320px, reduced motion, keyboard access, lifecycle cleanup, hidden-document/offscreen pausing.
- No backend/auth/accounts/payments/database/analytics/cloud storage or unlicensed external visual assets.
- The default subject is dignified, symbolic, feminine, ethereal, and non-sexualized.

## Known risks

**Reconciled 2026-07-28** — this section had accumulated several stale/superseded
entries across sessions (the exact staleness problem `RISK_PERFORMANCE_AUDIT.md` now
exists to prevent). Current, verified risks only; see
[`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md) §4 for the full register with
severities and mitigations (R-001–R-009).

- **This session's screenshot tooling is fundamentally broken**: the sandboxed
  browser pane doesn't composite frames, and Claude in Chrome's automated tab has a
  genuine `0×0` viewport (confirmed — `resize_window` failed with "bounds must be at
  least 50% within visible screen space"). Worked around it for static SVG content via
  `npx resvg-cli` rasterization and for dynamic content via `gl.readPixels` scans, but
  neither can verify continuous animation or real interaction visually. Check whether
  a properly visible browser window is available another way before relying on
  screenshots for future visual work. (audit R-007)
- The rendering components (`Scene`/`SceneFallback`/`SceneWebgl`/`SubjectPortrait`)
  are demo-only — not exported from `@matrix-ai/ui`. Documented explicitly in
  `README.md` rather than left implicit; a pending product decision, not a defect.
  (audit R-006)
- WebGL/CSS visual parity is close but not pixel-identical — the rain effect is a
  hashed flickering-glyph approximation. (audit R-008)
- A checkbox's `checked` property + dispatched `'change'` event does not reliably
  trigger React's `onChange` — use a real `.click()` when testing checkboxes. Two
  false-alarm "bugs" this session were this exact test-harness mistake, not product
  defects.
- No CI-enforced performance budget exists yet (bundle size regression wouldn't be
  caught automatically). (audit R-005)
- Treat every tracker file (`NEXT_TASK.md`, `ROADMAP.md`, `PROJECT_STATE.md`, this
  file) as unverified until cross-checked against the actual code and a real test
  run — this file was found stale more than once across this project's sessions.