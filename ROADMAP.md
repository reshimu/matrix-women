# Roadmap

| Milestone | Outcome | Status |
| --- | --- | --- |
| M0 | Audit repository and establish governance; use explicit greenfield authorization when no prototype exists | Complete — authorization recorded 2026-07-26 |
| M1 | Establish package boundaries, renderer-independent scene schema, and Vite builder baseline | Complete — separate library artifact and consumer fixture validated |
| M2 | Implement core scene composition and dependable non-WebGL fallback | Complete — CSS fallback lifecycle host and config-driven scene composition (layers + effects + format) implemented and tested; validated 2026-07-27. |
| M3 | Add progressive WebGL enhancement, lifecycle management, and constrained-device behavior | In progress — renderer lifecycle contract, end-to-end wiring, an animated shader now driven by `scene.layers`/`scene.effects` (mirroring `selectActiveLayers`), and a real-Chrome spot-check are all done. No visual parity with the CSS scene attempted; constrained-device behavior not re-evaluated beyond `selectRenderer`. |
| M4 | Build responsive builder, configuration round-trip, and documented public API | In progress — Next.js consumption proof done; a minimal config-round-trip builder (`SceneBuilder.tsx`) done and live-verified; public API documented (`README.md`). A full *responsive* visual builder (drag/drop layer editing, multi-scene management) is explicitly out of scope for this minimum and remains open. |
| M5 | Complete automated/browser/visual/accessibility/performance validation and release audit | In progress — real-DOM lifecycle tests, accessibility/keyboard tests, and an asset-failure test added this session; clean-install verified. Formal performance budget and a consolidated risk audit document remain open. |

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

## Digital-woman subject: real illustration (2026-07-27)

Replaced the placeholder CSS blob shapes (`.subject__halo/head/neck/shoulders`, plain
divs with border-radius/gradient hacks) with a real hand-authored SVG illustration —
`src/components/SubjectPortrait.tsx`. Design: a symmetric, front-facing, faceless
silhouette (head/neck/shoulders as one continuous mirrored path — mirroring done via
SVG `transform="translate(400,0) scale(-1,1)"` on a single half-path for guaranteed
symmetry, not hand-duplicated coordinates), a soft halo ring + radial glow behind the
head, a darker flowing "hair" shape framing the head/shoulders, thin strand-highlight
lines confined within the hair silhouette, and a subtle vertical center-face highlight.
Chosen deliberately over a literal/photorealistic face: faceless and symbolic reads as
serene/dignified/ethereal per `AGENTS.md`'s requirements, and sidesteps uncanny-valley
risk entirely.

**Screenshot tooling was fully broken this session** — this session's sandboxed
browser pane doesn't composite frames (established earlier), and Claude in Chrome's
automated tab turned out to have a genuine `0×0` viewport with no visible screen
surface (`resize_window` failed with "bounds must be at least 50% within visible
screen space"), so screenshots and zoom captures both errored. Worked around this by
rasterizing the SVG directly to PNG (`npx resvg-cli`) and reading the resulting image
directly — iterated through 4 versions this way: v1 read as a snowman (no neck
definition, hair looked like a cloak); v2 fixed proportions via a clean mirrored
half-path (head/neck/shoulder read correctly); v3 added hair-strand highlights that
crossed over the torso and looked like scratches (anatomically backwards — hair falls
behind wider shoulders, not draped over the front); v4 confined the strand highlights
within the hair silhouette itself, which resolved it. Confirmed the shipped component
renders byte-identical markup to the verified rasterized preview by extracting the
live DOM's actual `.scene__subject svg` output via the dev server (temporarily forcing
the CSS-fallback branch, then reverting — same pattern used for prior renderer-branch
checks this session).

## Hardening branch (`webgl-portrait-texture`, PR #1) — 2026-07-27

A follow-up session picked up "make her show up in the WebGL scene too, then keep
hardening toward production-ready." Five slices landed on this branch, each validated
(`typecheck`/`lint`/`test`/`build`/consumer fixtures) before the next started:

1. **WebGL portrait rendering.** Extracted the SVG path/gradient data into
   `src/scene/portraitArt.ts` (single source of truth), added
   `src/renderer/browser/portraitTexture.ts` (repaints the same paths onto an
   offscreen Canvas2D context, uploads as a WebGL texture) and
   `src/renderer/portraitLayout.ts` (`computePortraitBox`, pure/tested — contain-fits
   the portrait within a format-specific region mirroring the CSS scene's anchor
   behavior). Wired into `SceneWebgl`'s fragment shader as a `uPortraitBox` uniform.
   She now renders in both the CSS and WebGL paths from the same artwork.
2. **Real-DOM lifecycle test coverage.** Added `jsdom` + a new test file exercising
   `createDefaultBrowserEnvironment()` — the actual production code path — through
   real `document.hidden`/`visibilitychange`/`webglcontextlost` events, not just the
   injected fake environment. Closes a gap flagged repeatedly across prior sessions.
3. **Accessibility/keyboard test coverage.** Added `@testing-library/react` +
   `SceneFallback.test.tsx`: real focusable `<button>`, non-dangling
   `aria-labelledby`, decorative-layer `aria-hidden`, reduced-motion class toggling.
4. **Demoed portrait/square formats live**, and in doing so **found and fixed a real
   accessibility bug**: both scene components hardcoded `id="scene-title"` —
   mounting more than one scene on a page produced duplicate DOM ids and an
   ambiguous `aria-labelledby`. Fixed via React's `useId()`.
5. **Minimal config-round-trip builder** (`src/components/SceneBuilder.tsx` +
   `src/scene/roundTrip.ts`, `exportSceneConfig`/`importSceneConfig` — exported
   publicly). Live-verified the actual round-trip: export while in one format,
   switch away, paste the export back in, exact string match restored plus the live
   preview updating. Also verified the error path (malformed JSON → validation
   issue, no throw).

**Final hardening pass** closing out this branch:

- Added an asset-failure test (`SceneWebgl.test.tsx`): renders without throwing and
  without console errors when `canvas.getContext` returns `null` (WebGL
  unavailable), and disposes cleanly on unmount in that state.
- Wrote real API documentation (`README.md`) — public exports, `SceneConfig` shape,
  and an explicit, honest statement that the rendering components themselves are
  demo-only and not yet part of the public package (an open product decision, not
  silently implied as shipped).
- Ran a genuine clean-install verification: `rm -rf node_modules` (root + the
  Next.js fixture workspace member), `pnpm install --frozen-lockfile`, then the full
  validation suite (`typecheck`/`lint`/`test`/`build`/`test:consumer`/
  `test:nextjs-consumer`) — all passed from the fresh install.
- Reconciled `ACCEPTANCE_CRITERIA.md`'s release gates against actual verified state
  (most gates now checked; the two still open — a consolidated risk/performance
  audit doc, and full *responsive* builder scope beyond this round-trip minimum —
  are named explicitly, not glossed over).

Final count on this branch: test suite grew from 7 files/19 tests to **12 files/40
tests**. Two real bugs were caught and fixed during this hardening work (not
pre-existing, found *by* the hardening): the WebGL canvas resize listener bug (prior
session) and the duplicate-id accessibility bug (this session, item 4 above) — both
are the kind of thing "harden until production-ready" is supposed to surface.

## WebGL visual parity pass (2026-07-27, after PR #1 merged)

Rewrote `SceneWebgl`'s fragment shader to actually resemble the CSS scene instead of
an unrelated abstract gradient:

- **Background** now mirrors `.scene`'s `radial-gradient(circle at 67% 38%, ...)` —
  same three color stops, same position (converted from CSS's top-down percentage to
  this shader's bottom-origin `gl_FragCoord` convention: 38%-from-top → 0.62 in `uv`),
  aspect-corrected so it renders a true circle regardless of viewport aspect ratio.
- **Matrix code-rain**: replaced the old "diagonal sine wave changes color-mix speed"
  approximation with an actual procedural digital-rain effect — hashed per-column
  scroll speed and phase, quantized into flickering glyph-like cells that scroll
  downward over time, gated by `uRainDensity` (already zero when `effects.codeRain`
  is off, so the toggle genuinely hides it rather than just slowing an unrelated
  gradient).
- **Aura/glow position** corrected to match `.scene__aura`'s actual `circle at 65%
  42%` (from top) — the previous shader used `(0.65, 0.42)` directly in bottom-origin
  `uv` space, which was silently wrong (should have been `(0.65, 0.58)`); fixed as
  part of this parity pass.

**Bug found and fixed during verification, not before:** config changes (e.g.
toggling `effects.codeRain` off in the live builder) only took visual effect on the
*next animation frame* — fine in any real browser (~16ms later, imperceptible), but
this session's tooling has an already-documented dead `requestAnimationFrame` (see
the earlier real-browser spot-check entry), so toggling a control produced no visible
change at all here, which looked at first like a shader bug. Traced it to
`SceneWebgl`'s uniforms-sync effect only forcing an immediate repaint when
`scene.reducedMotion` was true; fixed it to always repaint immediately on any config
change regardless of animation/reduced-motion state, using the last-known elapsed
time (not a jarring reset to `t=0`) — this is a genuine robustness improvement
independent of this session's tooling quirk, since it also covers a paused/backgrounded
tab whose rAF loop isn't currently running for entirely legitimate reasons.

Live-verified in a real browser via `gl.readPixels` scans: a fixed vertical strip
showed a clearly jagged on/off glyph-flicker pattern with `effects.codeRain: true`,
and a smooth gradient-only falloff (rain fully gone) with it toggled `false` via a
real `.click()` on the checkbox — confirmed reversible in both directions, exact
match to the original baseline on toggling back on. Also re-confirmed the glow and
portrait-texture rendering were undisturbed across all four mounted canvases
(hero/portrait/square/builder-preview).

Also surfaced a real test-methodology lesson worth recording: `checked` property +
dispatched `'change'` event does **not** reliably trigger React's `onChange` for a
checkbox the way the native-setter + `'input'`-event trick does for text/range/select
inputs — a real `.click()` is required. Two false-alarm "bugs" this session (the
Next.js-era format select and this codeRain checkbox) both turned out to be this same
class of test-harness mistake, not product defects; noting the pattern here so a
future session doesn't re-debug the same false lead.

Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (12 files/40 tests, unchanged —
this is shader/JS wiring, not new testable pure logic), `pnpm build`,
`pnpm test:consumer`. Library artifact size unchanged (2.69 kB).

## Risk/performance audit (2026-07-28)

Added [`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md), consolidating what had
been scattered across `PROJECT_STATE.md`/`RISKS.md`/`ACCEPTANCE_CRITERIA.md` into one
document — this was the last open item on the release-gate checklist.

- Re-verified every number fresh rather than carrying over old claims: published
  library `2.69 kB` (1.13 kB gzip), demo app `211.56 kB` JS / `11.55 kB` CSS. Documented
  explicitly that the demo number isn't representative of a single production scene
  (it mounts hero/portrait/square + the builder simultaneously for inspection).
- Wrote a runtime performance characteristics section: single fullscreen-triangle
  WebGL draw call with O(1) per-pixel shader cost, compositor-friendly CSS animations,
  lifecycle hosts that actually pause on hidden/offscreen (a real perf/battery
  positive, already unit- and jsdom-tested), zero network-fetched assets in either
  renderer.
- Built a consolidated risk register (R-001 through R-009) by re-verifying each
  scattered risk bullet against current code rather than copying it forward. Found
  that `PROJECT_STATE.md`'s "Risks and blockers" section and `RESTART_PROMPT.md`'s
  "Known risks" section had both accumulated **stale, already-resolved entries**
  (visual parity, jsdom lifecycle coverage, `DemoFormats.tsx` all resolved earlier
  bullets that were never removed) — reconciled both in place with strikethrough
  notes explaining what resolved them and when, rather than silently deleting the
  history.
- Found one bullet that looked resolved but wasn't: "the `Scene` branch decision has
  no automated test." Verified by checking for a `Scene.test.tsx` — none existed.
  Added one (3 tests: mounts `SceneWebgl` when WebGL available + motion not reduced,
  mounts `SceneFallback` when WebGL unavailable, mounts `SceneFallback` when reduced
  motion requested even with WebGL available), which required building a proper
  minimal fake WebGL context object for jsdom (a bare `{}` throws — `createShader`
  etc. don't exist on it) rather than reusing the null-context trick the existing
  asset-failure test used.
- Marked `ACCEPTANCE_CRITERIA.md`'s last open release gate (consolidated risk/
  performance evidence) as done, pointing at the new document.

Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (13 files/43 tests, up from
12/40), `pnpm build`, `pnpm test:consumer`. Library artifact size unchanged (2.69 kB).

## Rendering components exported publicly (2026-07-28) — resolves audit R-006

Added `src/react.ts` as a **second, separate library entry** (`@matrix-ai/ui/react`),
rather than adding the rendering components to the main `src/index.ts` entry — see
`DECISIONS.md` ADR-0004 for the full rationale. Exports `Scene`, `SceneFallback`,
`SceneWebgl`, `SubjectPortrait`. `SceneBuilder`/`DemoFormats` stay internal (dev
tooling, not reusable production components).

- `vite.library.config.ts` now builds two entries (`index`, `react`) in one pass —
  Rollup automatically extracts their shared dependency (`select.ts`) into a small
  common chunk rather than duplicating it. Added the `@vitejs/plugin-react` and
  `@tailwindcss/vite` plugins (needed now that a real entry contains JSX/CSS).
  `build.lib.cssFileName: 'react'` controls the emitted stylesheet name explicitly
  (Vite's default naming derives from `package.json`'s `name` field otherwise, which
  produced a confusingly-named `ui.css`).
- `package.json` exports map gained `./react` (`dist/lib/react.js`) and `./react.css`
  (`dist/lib/react.css`, which consumers must import explicitly — not auto-injected).
- `tsconfig.lib.json`'s `include` extended to the four exported `.tsx` components
  (not `SceneBuilder.tsx`/`DemoFormats.tsx`); `exclude` extended to `*.test.tsx`.
- **Real bug found and fixed during verification:** `Scene.tsx`'s
  `detectConstrainedDevice()` had no try/catch (unlike its sibling
  `detectSupportsWebGL()`), so it would throw under SSR in any runtime where
  `navigator` isn't a global at all. It happened to work in this session's Node 24
  (which polyfills `navigator.hardwareConcurrency`), but that's runtime-version luck,
  not a guarantee — wrapped it in the same defensive try/catch pattern.
- **Real Rollup gotcha found and fixed:** a `'use client'` directive placed in each
  individual component source file (`Scene.tsx`, `SceneFallback.tsx`,
  `SceneWebgl.tsx`) gets silently stripped once Rollup bundles them together — it's
  only preserved when it's the first statement of the bundled *entry* file. Moved the
  directive that actually matters to the top of `src/react.ts`; kept the per-file ones
  as accurate (if cosmetic, post-bundling) source-level documentation.
- Added `fixtures/react-consumer.mjs` (new `pnpm test:react-consumer` script):
  renders `SceneFallback`, `SubjectPortrait`, and `Scene` via `react-dom/server` in
  plain Node (no bundler) and asserts on the output HTML — proves the built
  `dist/lib/react.js` is genuinely consumable standalone, mirroring the existing
  `test:consumer` pattern for the main entry.
- Added `fixtures/nextjs-consumer/app/react/page.tsx`: a Server Component (no
  `'use client'` of its own) that imports and renders `SceneFallback` from
  `@matrix-ai/ui/react` directly — proving the shipped `'use client'` directive lets
  Next's App Router treat it as a valid Server-Component-renders-Client-Component
  boundary. `next build` statically prerendered it; `next dev` live-verified in a real
  browser: correct styling applied (exact radial-gradient match, not just unstyled
  HTML), portrait SVG present, no console errors.
- Confirmed the existing `.` entry is completely unaffected: `fixtures/library-consumer.mjs`
  and the root `fixtures/nextjs-consumer/app/page.tsx` (the pure-entry proof) still
  pass unmodified — the split entry design means consumers who only want
  config/validation never pull in React-rendering code, CSS, or WebGL/Canvas2D
  internals.

Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (13 files/43 tests, unchanged —
this is build/export wiring, not new testable pure logic), `pnpm build`,
`pnpm test:consumer`, `pnpm test:react-consumer`, `pnpm test:nextjs-consumer` (both
Next.js pages). New artifact sizes: `dist/lib/index.js` 2.28 kB, `dist/lib/react.js`
20.19 kB (6.27 kB gzip), `dist/lib/react.css` 11.56 kB.

## CI + bundle-size performance budget (2026-07-28) — resolves audit R-005

No CI existed for this repo at all until now — every validation command up to this
point had been run manually, every session, by whoever (Codex or Claude) was
working. Added both a CI workflow and the performance budget in the same slice, since
"a CI performance budget" implies CI has to exist first.

- Added `.github/workflows/ci.yml`: on every push to `main` and every PR, installs
  with `--frozen-lockfile`, then runs `typecheck` → `lint` → `test` → `build` →
  `test:consumer` → `test:react-consumer` → `test:nextjs-consumer` →
  `check:bundle-size`, in that order — the exact sequence this project's sessions
  have been running by hand.
- Added `scripts/check-bundle-size.mjs` (`pnpm check:bundle-size`, no new
  dependency — a plain Node script, consistent with this repo's
  minimal-dependencies preference over pulling in something like `size-limit`):
  reads `dist/lib/`, checks `index.js` (budget 5 kB, current 2.28 kB), `react.js`
  (budget 30 kB, current 20.19 kB), `react.css` (budget 20 kB, current 11.56 kB),
  and any other shared chunk file (budget 2 kB each, current 0.48 kB) — each budget
  set with real headroom above the current verified size, not tuned to just barely
  pass.
- **Verified the check-script can actually fail, not just always pass**: temporarily
  patched a copy of the script with an impossibly small budget, confirmed it printed
  `[FAIL]` for the affected file and exited non-zero, then discarded the patched
  copy. A budget check nobody ever saw fail is indistinguishable from no check at
  all — this is the same verification discipline as everywhere else in this project
  (e.g. the earlier accessibility/reduced-motion tests were confirmed to actually
  catch the behavior they claim to, not just pass trivially).
- Resolves `RISK_PERFORMANCE_AUDIT.md`'s R-005 (the last Medium-severity open risk).

Validated: ran the exact full CI sequence locally end-to-end (`typecheck` → `lint` →
`test` → `build` → `test:consumer` → `test:react-consumer` → `test:nextjs-consumer` →
`check:bundle-size`) — all pass, 13 files/43 tests unchanged.

## Full M4 responsive builder scope (2026-07-28) — resolves audit R-009

Brought `SceneBuilder.tsx` from the round-trip minimum up to the scope named in
`ROADMAP.md`'s original M4 outcome and repeated across `NEXT_TASK.md` for multiple
sessions: "drag/drop layer editing" and "multi-scene management," neither of which
existed before this.

- Added `src/components/builderState.ts`: pure, unit-tested helpers
  (`createLayer`, `removeLayer`, `moveLayer`, `reorderLayers`, `createScene`,
  `duplicateScene`) plus `loadBuilderState`/`saveBuilderState` (localStorage-backed,
  guarded for `typeof window === 'undefined'`, validates every stored scene through
  the existing `validateScene` so corrupted/old-shape localStorage data can't crash
  the builder — it's silently dropped instead). 18 new unit tests, no DOM needed.
- Rewrote `SceneBuilder.tsx`: a scene switcher (select + New/Duplicate/Delete,
  persisted to `localStorage` under `matrix-ai-ui:builder-state`), Title/Eyebrow text
  fields (previously only editable via raw JSON import — a real gap), and a generic
  per-layer editor replacing the old three hardcoded sliders — any layer type can now
  be added (only offering types not already present), removed, and reordered via
  either native HTML5 drag-and-drop (mouse/touch) or keyboard-accessible ↑/↓ buttons
  (drag-and-drop alone isn't keyboard-operable, and `AGENTS.md` requires keyboard
  access — this was a deliberate accessibility decision, not an oversight).
- Added 9 new `SceneBuilder.test.tsx` tests (jsdom + Testing Library): add/remove a
  particles layer, move-up/move-down with correct disabled-state at the boundaries,
  new/switch/duplicate/delete scene flows (including that edits to one scene don't
  leak into another), state persisting across a component remount, and that the
  existing export→import round-trip still works end-to-end with the new generic
  layer model.
- **Real bug found and fixed during verification, not before:** `src/react.ts`
  imports the whole `styles.css` file, and CSS isn't tree-shaken the way JS is — the
  `.builder`/`.demo-format` rules (used only by this repo's own dev tooling, never
  exported) were being bundled into the *public* `react.css` regardless, inflating it
  for every consumer. Caught by watching `react.css`'s size grow to 12.98 kB while
  adding builder-only styles. Fixed by splitting into `src/styles.css` (public
  design-system styles, imported by `src/react.ts`) and a new `src/demo.css`
  (demo-only builder/gallery chrome, imported only by `src/main.tsx`) —
  `dist/lib/react.css` dropped to **10.08 kB**, smaller than its size *before* this
  slice even started, since the split removed styles that had been silently along
  for the ride all along.
- **Test-methodology note**: synchronously reading the DOM/exported-JSON textarea in
  the same script tick as a `.click()` call intermittently read stale
  pre-render state during live-browser verification (React's state update hadn't
  flushed yet) — not a product bug. Awaiting a short `setTimeout` before reading
  resolved it; noting this since it produced a brief false alarm during this
  session's live verification, similar in spirit to the checkbox-`.click()` lesson
  from an earlier session.
- Live-verified in a real browser: add/remove/move/drag-and-drop layer reordering,
  new/switch/duplicate/delete scenes, and `localStorage` persistence surviving an
  actual page reload — all confirmed via direct DOM/state inspection. Confirmed no
  horizontal overflow and correct responsive collapsing (scenes bar to a column,
  builder layout to one column) at 320px width.

Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (15 files/70 tests, up from
13/43), `pnpm build`, `pnpm test:consumer`, `pnpm test:react-consumer`,
`pnpm test:nextjs-consumer`, `pnpm check:bundle-size` all pass. `dist/lib/react.css`
is now **10.08 kB** (down from 11.56 kB before this slice, due to the CSS-split bug
fix above) — comfortably within budget.

## npm publish attempt: two real packaging bugs found and fixed; publish itself blocked (2026-07-28)

Shimon asked to publish to npm. Checked readiness before attempting anything, and
found two genuine packaging bugs — not proceeding with a publish attempt would have
been the wrong call, but publishing *as-is* would have shipped something broken:

1. **`react`, `react-dom`, `vite`, `@vitejs/plugin-react`, and `tailwindcss` were all
   listed under `"dependencies"`**, not `"devDependencies"`. Since `react`/`react-dom`
   were *also* correctly declared as `peerDependencies`, this meant any consumer
   installing the package would get a second copy of React installed alongside their
   own — the classic "duplicate React instance" bug (`Invalid hook call` errors) — plus
   Vite and Tailwind forced in as unnecessary runtime installs for a package with zero
   actual runtime dependencies. Fixed: moved all five into `devDependencies` (needed
   for this repo's own build/dev, not by consumers of the published package).
2. **`"files": ["dist"]` included the entire build output directory**, but `pnpm build`
   writes both the library (`dist/lib/`) *and* this repo's own demo app
   (`dist/assets/*.js`, `dist/index.html`) into the same `dist/` folder. Verified via
   `npm pack --dry-run`: the tarball was **82.8 kB packed / 281.8 kB unpacked**,
   including the full 216 kB demo bundle that has nothing to do with the published
   package. Fixed: `"files": ["dist/lib"]`. Re-checked with `npm pack --dry-run`:
   **16.6 kB packed / 52.0 kB unpacked**, 25 files, exactly `dist/lib/**` + `README.md`
   + `package.json` — nothing else.
3. Full validation re-run after both fixes: `pnpm typecheck`, `pnpm lint`, `pnpm test`
   (15 files/70 tests, unchanged), `pnpm build`, `pnpm test:consumer`,
   `pnpm test:react-consumer`, `pnpm test:nextjs-consumer`, `pnpm check:bundle-size` —
   all pass.

**The actual `npm publish` was not attempted and could not have succeeded regardless:**

- `npm whoami` confirmed this machine has no npm auth configured at all
  (`ENEEDAUTH`). Logging in requires entering Shimon's npm credentials/OTP, which is
  a prohibited action for an agent to perform on a user's behalf regardless of
  explicit request — this needs Shimon to run `npm login` himself.
- `package.json` still has `"private": true`, which `npm publish` refuses outright
  regardless of auth. Left as-is rather than flipped, since which npm scope/account
  to publish under is a genuine open decision (see `NEXT_TASK.md`) — flipping the
  switch that makes a publish *possible* before that's resolved would be presumptuous.
- Confirmed via `npm view @matrix-ai/ui` (a read-only registry query, no auth needed)
  that the exact package name is unclaimed (404) — but whether Shimon can publish
  *under the `@matrix-ai` scope specifically* depends on whether he owns that npm
  org/username, which isn't something this session can determine or decide.

## 2026-07-28 — Renamed to `@reshimu/matrix-ai-ui`

Asked Shimon which npm scope/account to publish under (own `@matrix-ai` vs. rename
vs. unscoped). His answer: rename to `@reshimu/matrix-ai-ui`, matching this repo's
GitHub org. Renamed `package.json` and every functional consumer/fixture, README,
DECISIONS.md, ACCEPTANCE_CRITERIA.md, RISK_PERFORMANCE_AUDIT.md, and the evergreen
sections of RESTART_PROMPT.md. Regenerated the lockfile via `pnpm install` and
re-ran full validation — all green. Historical dated entries above (and in
CHANGELOG.md/STATE.md) referencing the old `@matrix-ai/ui` name are left as-is:
accurate record of what was true when written. Only remaining publish blocker is
Shimon running `npm login` himself — see `NEXT_TASK.md`.
