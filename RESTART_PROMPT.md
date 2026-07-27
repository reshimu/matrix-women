# Matrix AI UI — restart prompt pack

Use this file at the start of any new session before changing code.

## Copy/paste prompt

Continue the Matrix AI UI greenfield build in `C:\dev\matrix-women`. Read `AGENTS.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `DECISIONS.md`, `ACCEPTANCE_CRITERIA.md`, and this file first. Follow the repository authority order and work-slice loop. Implement exactly the atomic task in `NEXT_TASK.md`; validate with `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:consumer`, and `pnpm build`; inspect visual output when visual behavior changes; then update project records and this file. Do not weaken tests, skip validations, or add out-of-scope product features.

## Current verified state

- Explicit greenfield authorization; no prototype was provided.
- M0, M1, and M2 are complete. M3 (progressive WebGL enhancement) is **in
  progress**: lifecycle contract done, no rendering content yet.
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
  `selectRenderer` with live capability detection and mounts `SceneWebgl` (real canvas
  + working `WebGLRenderingContext` + `createWebglRendererHost`, placeholder
  clear-color paint only) or `SceneFallback`. `main.tsx` mounts `<Scene>`. Both
  branches confirmed live in a real browser (WebGL via `gl.readPixels` pixel check;
  CSS fallback via a temporary forced-false override, reverted before commit).
- Last full validation passed 2026-07-27: typecheck, lint, **6 Vitest files / 15
  tests**, consumer fixture, demo build, and library build. Library artifact size
  unchanged (2.26 kB), confirming none of the new browser-only code leaks into the
  public entry.

## Exact next task

M2 is done; the WebGL lifecycle scaffold and its wiring into `selectRenderer`/`Scene`
are both done. Proposed next slice (not started, needs confirmation): give the WebGL
mount point actual rendering content (shaders/geometry) driven by `SceneConfig`,
respecting the lifecycle host's paused/context-lost states and reduced-motion. Full
done-criteria in `NEXT_TASK.md`. Update all project records and this restart pack with
factual validation evidence when done.

## Non-negotiables

- React + TypeScript; Tailwind; Vite demo.
- Public scene config remains renderer-independent and browser-free.
- WebGL is enhancement only; CSS/Canvas/SVG fallback is mandatory.
- Support 320px, reduced motion, keyboard access, lifecycle cleanup, hidden-document/offscreen pausing.
- No backend/auth/accounts/payments/database/analytics/cloud storage or unlicensed external visual assets.
- The default subject is dignified, symbolic, feminine, ethereal, and non-sexualized.

## Known risks

- WebGL renderer has a working lifecycle contract and is correctly wired into
  `selectRenderer`/`Scene`, but has no actual rendering content yet — the mounted
  canvas only clears to a placeholder color. That's the next slice.
- The `Scene` branch decision (webgl vs. css) has no automated test — verified only by
  manual live-browser checks (repeatable, but not run in CI).
- Builder round-trip, Next.js fixture, real-DOM/browser regression tests (current
  tests only exercise an injected fake environment for both the CSS and WebGL hosts),
  and full release validation remain outstanding.
- Only one format (`hero`) is actually mounted in the demo app (`main.tsx`); `portrait`
  and `square` are proven correct via computed-style inspection but not demoed live.
  Low priority — real M4 builder work will exercise this properly.
- Git repository now exists and is pushed to `github.com/reshimu/matrix-women` — the
  "no Git repository" risk recorded on 2026-07-26 no longer applies. Both Codex and
  Claude Code now work against this remote; treat any tracker file (`NEXT_TASK.md`,
  `ROADMAP.md`, `PROJECT_STATE.md`) as unverified until cross-checked against the
  actual code and a real test run — this file was itself found stale on 2026-07-27.