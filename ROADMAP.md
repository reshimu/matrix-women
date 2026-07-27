# Roadmap

| Milestone | Outcome | Status |
| --- | --- | --- |
| M0 | Audit repository and establish governance; use explicit greenfield authorization when no prototype exists | Complete — authorization recorded 2026-07-26 |
| M1 | Establish package boundaries, renderer-independent scene schema, and Vite builder baseline | Complete — separate library artifact and consumer fixture validated |
| M2 | Implement core scene composition and dependable non-WebGL fallback | Complete — CSS fallback lifecycle host and config-driven scene composition (layers + effects + format) implemented and tested; validated 2026-07-27. |
| M3 | Add progressive WebGL enhancement, lifecycle management, and constrained-device behavior | In progress — renderer lifecycle contract, context-loss handling, and end-to-end wiring (`selectRenderer` → `Scene` → mounted WebGL host) implemented and live-verified. No actual WebGL rendering content (shaders/geometry) exists yet — the mounted canvas only clears to a placeholder color. |
| M4 | Build responsive builder, configuration round-trip, and documented public API | Pending |
| M5 | Complete automated/browser/visual/accessibility/performance validation and release audit | Pending |

No downstream milestone starts until M0 has a recorded runnable baseline or an explicit decision authorizes a greenfield start.

## Correction (2026-07-27)

M2 was previously marked "Pending" in full. A recon pass found the renderer lifecycle
host (`src/renderer/browser/cssRendererHost.ts`) already implemented and tested —
apparently completed during an earlier session that never updated this file,
`NEXT_TASK.md`, or `CHANGELOG.md`. Status above now reflects actual code state,
verified by reading the implementation and running `pnpm test` (7/7 passing).

## M2 completed (2026-07-27, same session)

Added `src/scene/composition.ts` (`selectActiveLayers`, pure and tested) and wired
`SceneFallback` to render only active layers, apply per-layer `opacity`/`density`/
`intensity`/`count`, and give `hero`/`portrait`/`square` real, measurably distinct CSS
layouts. Full validation (`typecheck`, `lint`, `test`: 5 files/11 tests, `build`,
`test:consumer`) passed, plus live browser inspection at 1440×900 and 320×700 with
computed-style verification that format and effect toggles actually change output.
M3 (WebGL enhancement) has not started.

## M3 lifecycle scaffold added (2026-07-27, same day)

Added `src/renderer/browser/environment.ts` (shared browser-lifecycle environment
types/factory, extracted from `cssRendererHost.ts` to avoid duplicating it a second
time) and `src/renderer/browser/webglRendererHost.ts`: a lifecycle host mirroring the
CSS host's `start`/`pause`/`resume`/`dispose` shape, plus a `context-lost` state
driven by `webglcontextlost`/`webglcontextrestored` that takes precedence over
visibility/intersection pausing. 4 new unit tests (6 files/15 total now). Scoped
deliberately to the lifecycle contract only — no shaders, geometry, or actual WebGL
rendering yet, and it is not wired into `selectRenderer` or `SceneFallback`. M3 is
therefore "in progress," not complete.

## M3 wiring added (2026-07-27, same day, Option B)

Added `src/components/Scene.tsx` (composition root: runs `selectRenderer` with live
`prefersReducedMotion`/`supportsWebGL`/`constrainedDevice` detection, mounts
`SceneWebgl` or `SceneFallback` accordingly) and `src/components/SceneWebgl.tsx` (a
real `<canvas>` that obtains a genuine `WebGLRenderingContext`, wires up
`createWebglRendererHost`, and clears to a placeholder color — no shaders/geometry
yet, by design). `main.tsx` now mounts `<Scene>` instead of `<SceneFallback>` directly.

Live-verified in a real browser (not just built artifacts): the WebGL branch mounts a
correctly-sized canvas with a working WebGL context (`gl.readPixels` confirmed the
placeholder clear-color actually painted), and — by temporarily forcing
`detectSupportsWebGL` to return `false`, verifying the CSS fallback mounts instead,
then reverting before commit — the fallback branch was also confirmed live, not just
type-checked. Library artifact size unchanged (2.26 kB): `Scene`/`SceneWebgl` are
demo-only and don't leak into the public entry.

M3 remains "in progress": the end-to-end wiring works, but there is still no actual
WebGL rendering content.
