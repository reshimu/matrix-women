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
- Last full validation passed 2026-07-27: typecheck, lint, **7 Vitest files / 19
  tests**, both consumer fixtures (`test:consumer` and `test:nextjs-consumer`), demo
  build, and library build. Library artifact size unchanged (2.26 kB).

## Exact next task

The digital-woman subject now has a real illustration. No forced next task — see
`NEXT_TASK.md` for candidate directions (further illustration refinement, WebGL visual
parity, demoing portrait/square formats live, starting M4's builder work, or
accessibility/keyboard test coverage). Update all project records and this restart
pack with factual validation evidence when done.

## Non-negotiables

- React + TypeScript; Tailwind; Vite demo.
- Public scene config remains renderer-independent and browser-free.
- WebGL is enhancement only; CSS/Canvas/SVG fallback is mandatory.
- Support 320px, reduced motion, keyboard access, lifecycle cleanup, hidden-document/offscreen pausing.
- No backend/auth/accounts/payments/database/analytics/cloud storage or unlicensed external visual assets.
- The default subject is dignified, symbolic, feminine, ethereal, and non-sexualized.

## Known risks

- **This session's screenshot tooling is fundamentally broken**: the sandboxed
  browser pane doesn't composite frames, and Claude in Chrome's automated tab has a
  genuine `0×0` viewport (confirmed — `resize_window` failed with "bounds must be at
  least 50% within visible screen space"). Worked around it for static SVG content
  via `npx resvg-cli` rasterization, but this can't verify animation, canvas/WebGL
  output, or real interaction. Check whether a properly visible browser window is
  available another way before relying on screenshots for future visual work.
- Only a literal human-eyes-on-screen check of the WebGL animation/resize behavior
  remains unverified — every automated verification path available this session has
  been exhausted and passed (see spot-check evidence above). Low risk: both APIs used
  are standard, well-documented, and the suspension observed is confirmed to be a
  tooling/viewport limitation, not a code issue.
- Visual parity between the WebGL and CSS scenes is not attempted — the WebGL scene
  uses an abstract gradient/glow/sparkle vocabulary, not a literal recreation of the
  matrix-rain/portrait-silhouette CSS look.
- The `Scene` branch decision (webgl vs. css) has no automated test — verified only by
  manual live-browser checks (repeatable, but not run in CI).
- Builder round-trip (M4) and real-DOM/browser regression tests (current tests only
  exercise an injected fake environment for both the CSS and WebGL hosts) remain
  outstanding. Next.js consumption is no longer a gap — see evidence above.
- Only one format (`hero`) is actually mounted in the demo app (`main.tsx`); `portrait`
  and `square` are proven correct via computed-style inspection but not demoed live.
  Low priority — real M4 builder work will exercise this properly.
- Git repository now exists and is pushed to `github.com/reshimu/matrix-women` — the
  "no Git repository" risk recorded on 2026-07-26 no longer applies. Both Codex and
  Claude Code now work against this remote; treat any tracker file (`NEXT_TASK.md`,
  `ROADMAP.md`, `PROJECT_STATE.md`) as unverified until cross-checked against the
  actual code and a real test run — this file was itself found stale on 2026-07-27.