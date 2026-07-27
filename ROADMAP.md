# Roadmap

| Milestone | Outcome | Status |
| --- | --- | --- |
| M0 | Audit repository and establish governance; use explicit greenfield authorization when no prototype exists | Complete — authorization recorded 2026-07-26 |
| M1 | Establish package boundaries, renderer-independent scene schema, and Vite builder baseline | Complete — separate library artifact and consumer fixture validated |
| M2 | Implement core scene composition and dependable non-WebGL fallback | Complete — CSS fallback lifecycle host and config-driven scene composition (layers + effects + format) implemented and tested; validated 2026-07-27. |
| M3 | Add progressive WebGL enhancement, lifecycle management, and constrained-device behavior | Pending |
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
