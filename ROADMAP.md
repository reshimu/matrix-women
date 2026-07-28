# Roadmap

| Milestone | Outcome | Status |
| --- | --- | --- |
| M0 | Audit repository and establish governance; use explicit greenfield authorization when no prototype exists | Complete — authorization recorded 2026-07-26 |
| M1 | Establish package boundaries, renderer-independent scene schema, and Vite builder baseline | Complete — separate library artifact and consumer fixture validated |
| M2 | Implement core scene composition and dependable non-WebGL fallback | Complete — CSS fallback lifecycle host and config-driven scene composition (layers + effects + format) implemented and tested; validated 2026-07-27. |
| M3 | Add progressive WebGL enhancement, lifecycle management, and constrained-device behavior | In progress — renderer lifecycle contract, end-to-end wiring, an animated shader now driven by `scene.layers`/`scene.effects` (mirroring `selectActiveLayers`), and a real-Chrome spot-check are all done. No visual parity with the CSS scene attempted; constrained-device behavior not re-evaluated beyond `selectRenderer`. |
| M4 | Build responsive builder, configuration round-trip, and documented public API | Pending — Next.js consumption proof (a spec requirement, previously an open gap) completed 2026-07-27 ahead of the rest of M4; see entry below. |
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

## M3 trivial animated gradient added (2026-07-27, same day)

Replaced `SceneWebgl`'s placeholder clear-color with a real (if intentionally simple)
shader: a fullscreen triangle vertex shader plus a fragment shader that mixes two
colors with a `sin(uTime * 0.4 + ...)` term, driven by a `requestAnimationFrame` loop
that only runs while the lifecycle host reports `running`, and only if
`scene.reducedMotion` is false (matching the CSS host's reduced-motion behavior — a
single static frame otherwise).

**Bug found and fixed during verification:** the canvas's WebGL drawing-buffer size
was only resynced to its CSS size via a `window.resize` listener, which does not fire
for all viewport-size changes (caught live: `canvas.clientWidth/Height` updated
correctly but `canvas.width/height` — the actual render-target resolution — stayed
stale). Replaced with a `ResizeObserver` on the canvas element itself, which is the
correct API for this (reacts to any layout-driven size change, not just window
resizes) and also repaints immediately on resize using the last-known animation time,
so a paused/reduced-motion scene stays correctly sized too.

**Verification limits, stated plainly:** this sandboxed browser pane does not
composite frames (documented from the first screenshot attempt of this whole recon
session) — as a direct consequence, neither `requestAnimationFrame` nor
`ResizeObserver` callbacks fire in it at all, confirmed by direct tests (a raw
`ResizeObserver` on the canvas never fired even for a manual `canvas.style.width`
change; a raw `requestAnimationFrame` counter loop never completed within 30s). What
*was* verified live: the shader's static output at `uTime=0` (`gl.readPixels` matched
the hand-computed shader math to the pixel), the lifecycle host's `running`/`paused`
state gating works (confirmed by force-toggling `document.hidden` and checking
`canvas.dataset.rendererState`), and initial mount-time canvas sizing is correct at
both 1440×900 and 320×700. Continuous animation and post-mount resize behavior are
correct by code review and are standard, well-supported browser APIs, but could not be
observed frame-by-frame in this specific tool environment. This is an environment
constraint, not a known defect.

## M3 real-browser spot-check (2026-07-27, same day)

Re-verified the above in Claude in Chrome — a real, non-sandboxed Chrome instance,
distinct from this session's synthetic browser-pane tool. Static output (shader math,
canvas mount, mount-time sizing) reproduced identically and cleanly, with no console
errors. `requestAnimationFrame` and `ResizeObserver` still did not fire — traced to
`window.innerWidth`/`innerHeight` reporting `[0, 0]` in this automated tab, meaning it
has no actual rendering viewport at all, so Chrome legitimately suspends both APIs
(standard behavior for any non-composited page, in any browser). Confirmed this
suspension tracks Chrome's real internal compositor-visibility state, not the
JS-observable `document.hidden` flag: spoofing `document.hidden` to `false` via
`Object.defineProperty` did not unlock `rAF` (0 frames over 3 real seconds), while
`document.visibilityState` kept reporting the true hidden state regardless.

**Conclusion:** a literal frame-by-frame visual check isn't achievable with any tool
available this session — a hard environment limitation, not something fixable by
retrying or switching tools again. This raises confidence rather than lowering it: the
lifecycle host's pause behavior was shown to track genuine compositor-visibility
state (not a fragile JS-only flag), and both APIs are used in their standard,
well-documented form with no known edge case that would behave differently in a real,
visible browser tab. Only a literal human-eyes-on-screen check (opening
`http://localhost:5173` in an actual visible window and watching it for ~10 seconds)
remains outside what automated tooling in this session could verify.

## M3 config-driven WebGL composition (2026-07-27, same day)

Added `src/renderer/webglUniforms.ts` (`deriveWebglUniforms`, pure and tested — 4
tests) mirroring `selectActiveLayers`: it reduces `selectActiveLayers(scene)` into four
shader uniforms — `glowIntensity` (from the `lighting` layer's `intensity`×`opacity`,
zeroed if `effects.glow` is off), `rainDensity` (from `code-rain`'s `density`×
`opacity`), `portraitOpacity` (from the `portrait` layer's `opacity`), and `sparkle`
(from a `particles` layer's `count`/200, capped at 1, ×`opacity`). `SceneWebgl`'s
fragment shader now uses these: a radial glow at a fixed screen position scaled by
`uGlowIntensity`, the base gradient's oscillation speed scaled by `uRainDensity`, an
overall brightness lift scaled by `uPortraitOpacity`, and procedural sparkle dots
scaled by `uSparkle`. Uniform values are read from a ref updated via `useMemo`/effect
(not captured in the mount-time closure), so config changes take effect without
restarting the WebGL context; a static (reduced-motion) scene also repaints
immediately when config changes, not just when animating.

Live-verified in Claude in Chrome (real browser): read exact pixel values at the
shader's glow center and a far corner, matching hand-computed shader math to the
pixel (`[81, 193, 169]` at glow center vs. `[23, 88, 81]` far corner, for the default
scene). Then temporarily set `effects.glow: false` in `main.tsx`, reloaded, and
confirmed the glow-center pixel dropped to match the far-corner baseline exactly
(`[23, 88, 80]` ≈ `[23, 88, 81]`) — proving the effects toggle actually gates WebGL
output, not just CSS output. Reverted the override before final validation and commit.
Full validation (`typecheck`/`lint`/`test`: 7 files/19 tests, up from 6/15/`build`/
`test:consumer`) passed. Library artifact size unchanged (2.26 kB) —
`webglUniforms.ts` is imported only by the demo-only `SceneWebgl`, not re-exported from
`src/index.ts`.

## Next.js consumption proof (2026-07-27) — M3 set aside, this closes a spec gap

`PROJECT_SPEC.md` requires the package work in "Vite and Next.js consumption"; only a
plain-Node fixture existed. Set up a real second proof:

- Added `pnpm-workspace.yaml` (`packages: ['.', 'fixtures/*']`) so
  `fixtures/nextjs-consumer` can depend on `@matrix-ai/ui` via `workspace:*`, resolved
  by pnpm as a real symlink (confirmed: `fixtures/nextjs-consumer/node_modules/@matrix-ai/ui
  -> /c/dev/matrix-women`) — not a hand-rolled path hack.
- `fixtures/nextjs-consumer/app/page.tsx` is a **Server Component** (no `'use client'`)
  importing `defaultScene`, `validateScene`, `selectRenderer`, `selectActiveLayers`
  from `@matrix-ai/ui` — proving the public entry has zero DOM/browser dependencies
  and works at Next's build/server-render time, not just in a browser.
- `next build` succeeded and **statically prerendered** the page (`○ (Static)`) — the
  package's exports ran correctly inside Next's real server-rendering pipeline.
  `next dev` live-verified in a real browser: correct SSR-computed values rendered
  (`Scene id: matrix-serenity`, `Renderer kind: webgl`, `Active layers: subject,
  matrix-rain, ambient-light`), no console errors.
- **Caught and fixed a real lint issue while wiring this up:** adding the fixture made
  root `pnpm lint` fail (`max-warnings=0`) on a `react-refresh/only-export-components`
  warning for `layout.tsx`'s required `metadata` export — a well-known false-positive
  where Vite's react-refresh rule doesn't recognize Next.js App Router's
  `metadata`-export convention (which `eslint-config-next` normally exempts). Scoped
  the rule off for `fixtures/nextjs-consumer/**` rather than suppressing it globally.
- Added `pnpm test:nextjs-consumer` (mirrors `test:consumer`'s pattern: rebuilds the
  library, then runs `next build` against it) and a `.claude/launch.json` entry for
  `next dev` preview.
- Re-ran the full existing validation suite after adding the workspace member: `pnpm
  typecheck`, `pnpm lint`, `pnpm test` (7 files/19 tests, unchanged), `pnpm build`, and
  `pnpm test:consumer` all still pass — the workspace addition didn't disturb anything
  pre-existing.
