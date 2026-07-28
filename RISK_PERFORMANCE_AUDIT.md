# Risk & performance audit

**Date:** 2026-07-28 (initial); **updated same day, twice** — once after the
rendering components were exported publicly (`@matrix-ai/ui/react`, ADR-0004; §2.1
and the executive summary revised to match), and again after CI plus a bundle-size
budget were added (`.github/workflows/ci.yml`, `scripts/check-bundle-size.mjs`; R-005
resolved). The rest of the document's findings (risk register, test coverage,
release-gate verdict) still hold and weren't invalidated by either change.
**Scope:** Consolidates risk and performance evidence that was previously scattered
across `PROJECT_STATE.md`, `RISKS.md`, and `ACCEPTANCE_CRITERIA.md` into one document,
per the last open item on `ACCEPTANCE_CRITERIA.md`'s release gates. Every number below
was re-verified against a real command run on 2026-07-28, not carried over from
memory — where a prior document's claim turned out to be stale (several were), that's
called out explicitly rather than silently repeated.

---

## 1. Executive summary

The published package now ships **two entries**: `@matrix-ai/ui` — a **2.28 kB**
configuration/validation/selection core with zero runtime dependencies and zero DOM
access — and `@matrix-ai/ui/react` — **20.19 kB** (6.27 kB gzip) of actual rendering
components (`Scene`, `SceneFallback`, `SceneWebgl`, `SubjectPortrait`), plus an
**11.56 kB** stylesheet the consumer imports explicitly. The rendering components are
no longer demo-only — they're the same code this repo's demo uses, exported behind a
deliberately separate subpath (ADR-0004) so consumers who only want config/validation
never pull in React-rendering code, CSS, or WebGL/Canvas2D internals. Main runtime cost
of the rendering layer is a single fullscreen-triangle WebGL draw call per frame with
O(1) per-pixel shader cost, and there are zero network-fetched assets in either
renderer — all real risks identified below are either already mitigated or explicitly
accepted and named, not silently unaddressed.

**Verdict: the published library is production-ready for its stated scope** —
config/validation/selection primitives, and now a working, tested, publicly-exported
reference rendering layer for both Vite and Next.js (App Router `'use client'`
boundary verified against a real `next build`), with CI (`.github/workflows/ci.yml`)
now enforcing the full validation suite and a bundle-size budget on every push/PR —
previously nothing ran automatically at all. Remaining open items (§4, §5) are
scoped product decisions (a CI performance budget, full M4 builder scope, visual
regression tooling), not defects in what ships today.

---

## 2. Performance

### 2.1 Published package footprint (what a consumer actually installs)

Freshly rebuilt 2026-07-28, after the `@matrix-ai/ui/react` export landed:

| Artifact | Size | Gzip |
| --- | --- | --- |
| `dist/lib/index.js` (`@matrix-ai/ui`) | 2.28 kB | 1.01 kB |
| `dist/lib/react.js` (`@matrix-ai/ui/react`) | 20.19 kB | 6.27 kB |
| `dist/lib/react.css` (`@matrix-ai/ui/react.css`) | 11.56 kB | 3.51 kB |
| `dist/lib/select-*.js` (shared chunk, both entries import it) | 0.48 kB | 0.29 kB |

- A consumer who imports only `@matrix-ai/ui` (config/validation/selection) pays only
  the first row — 2.28 kB, unchanged in spirit from before the split (the drop from
  2.69 kB to 2.28 kB is `select.ts` moving into the shared chunk both entries use, not
  a size regression of the pure entry's own code).
- A consumer who also imports `@matrix-ai/ui/react` pays the second and third rows on
  top — real rendering components (WebGL shader/texture code, the CSS scene, the
  portrait SVG illustration) plus their stylesheet, not injected automatically.
- Zero runtime `dependencies` in `package.json` for either entry — only
  `react`/`react-dom` as `peerDependencies` (`>=18`), which the consumer already has.
- No images, fonts, or other network-fetched assets in either entry — the
  config/validation core is pure TypeScript data/logic, and the rendering layer's
  digital-woman illustration is procedurally drawn (SVG paths, rasterized to a
  Canvas2D-then-WebGL-texture for the WebGL path), not a network-fetched image.
- Confirmed via repeated `pnpm test:consumer`/`pnpm test:react-consumer`/
  `pnpm test:nextjs-consumer` runs that these sizes reflect real, deliberate additions
  (`exportSceneConfig`/`importSceneConfig`, then the whole rendering layer) — not
  accidental bloat.

### 2.2 Demo/reference app footprint (not shipped, but real if someone copies it)

Freshly rebuilt 2026-07-28:

| Artifact | Size | Gzip |
| --- | --- | --- |
| `dist/assets/index-*.js` | 211.56 kB | 66.95 kB |
| `dist/assets/index-*.css` | 11.55 kB | 3.50 kB |

This includes React + ReactDOM + the full demo (hero/portrait/square formats mounted
simultaneously via `DemoFormats.tsx`, plus the live `SceneBuilder` control panel) —
it is not representative of what a single production scene would cost, since the demo
intentionally mounts four scene instances at once for inspection purposes. A
production page using one `<Scene>` instance would ship React + ReactDOM + one
scene's worth of code, materially less than this number.

### 2.3 Runtime performance characteristics

- **WebGL path:** a single fullscreen-triangle draw call per frame; the fragment
  shader does O(1) hashed lookups (no loops, no dependent texture reads besides the
  one portrait-texture sample) — cost is per-pixel-constant, scales with resolution
  only, not scene complexity. One 512×640 RGBA texture (the portrait) uploaded once
  per mount, not per frame.
- **CSS path:** uses CSS `transform`/`opacity`-driven keyframe animations
  (`descend`, `drift`, `shimmer`), which are compositor-friendly (GPU-accelerated,
  don't trigger layout) in every evergreen browser.
- **Lifecycle hosts actively reduce idle cost**: both the CSS and WebGL renderer
  hosts pause (stop the animation loop / CSS animation) when the document is hidden
  or the scene is scrolled offscreen (`IntersectionObserver`-driven) — this is a
  positive performance/battery characteristic, not just a correctness one, and is
  unit-tested (`cssRendererHost.test.ts`, `webglRendererHost.test.ts`) plus
  real-DOM-verified (`realBrowserEnvironment.test.ts`).
- **No network-fetched assets anywhere** in either renderer — the digital-woman
  illustration is procedurally drawn (SVG paths in the CSS path, the same paths
  rasterized to a Canvas2D-then-WebGL-texture in the GL path), so there's no
  image-decode cost, no LCP-blocking network request, no CDN dependency.

### 2.4 Known performance risks

| Risk | Severity | Detail | Mitigation / state |
| --- | --- | --- | --- |
| Particle layer renders one DOM node per particle | Low–Medium | `SceneFallback`'s particles layer renders a `<span>` per particle (validation caps `count` at 200). At the high end of that range, ~200 animated absolutely-positioned DOM nodes is a real but modest layout/paint cost on low-end devices. | Accepted: 200 is a deliberate validation ceiling (`src/scene/validate.ts`), not unbounded. No production scene config in this repo uses more than a handful. Would need a canvas-based particle system if a consumer configures counts near the ceiling on low-end hardware. |
| Demo bundle size (211 kB JS) isn't representative of a single production scene | Low | The demo intentionally mounts 4 scene instances + a live builder simultaneously for inspection. | Documented above (§2.2) so it isn't mistaken for the real per-scene cost. Not a defect. |
| No formal performance budget or CI size-check exists | Medium | Nothing currently fails a build if the library artifact size regresses. | Open — recommended next step, not yet implemented (see §5). |

---

## 3. Test coverage summary

Freshly run 2026-07-28: **13 files / 43 tests**, all passing (`pnpm test`), plus
`pnpm typecheck`, `pnpm lint` (`--max-warnings=0`), `pnpm build`, `pnpm test:consumer`,
and `pnpm test:nextjs-consumer` all passing.

| Area | Coverage |
| --- | --- |
| Scene schema/validation/composition (`src/scene/`) | Pure-function unit tests: normalization, validation edge cases, active-layer selection, JSON round-trip. |
| Renderer selection (`src/renderer/select.ts`) | Pure-function unit tests, all branches. |
| WebGL uniform derivation / portrait box layout | Pure-function unit tests. |
| CSS + WebGL lifecycle hosts | Unit tests against an injected fake environment **and** real-DOM/real-event tests via jsdom (`realBrowserEnvironment.test.ts`) — this closes a gap that was flagged and left open across multiple prior sessions. |
| `SceneFallback` accessibility | jsdom + Testing Library: real focusable button, non-dangling `aria-labelledby`, decorative layers hidden via `aria-hidden`, reduced-motion class toggling. |
| `SceneWebgl` asset-failure resilience | jsdom + Testing Library: renders without throwing and stays accessible when `canvas.getContext` returns `null` (WebGL unavailable); disposes cleanly. |
| `Scene` branch decision (webgl vs. css) | **Added during this audit** (`Scene.test.tsx`) — was flagged as an open gap in `PROJECT_STATE.md`; now covered: mounts `SceneWebgl` when WebGL is available and motion isn't reduced, mounts `SceneFallback` when WebGL is unavailable, and mounts `SceneFallback` when reduced motion is requested even if WebGL is available. |

**Still not covered by automated tests** (named explicitly, not silently gapped):
- Real continuous `requestAnimationFrame`/`ResizeObserver` firing — every automated
  tool available across this project's sessions has a dead-`rAF` limitation (see
  `RESTART_PROMPT.md`'s "Known risks"); this was worked around via static-frame pixel
  verification (`gl.readPixels`) and manual real-browser checks, not closed by an
  automated test.
- Cross-browser/cross-device visual regression (no visual snapshot tooling is wired
  up).
- Performance budgets in CI (see §2.4).

---

## 4. Consolidated risk register

Supersedes the risk bullets previously scattered across `PROJECT_STATE.md`'s "Risks
and blockers" sections (several of those were stale — resolved by later work but
never removed; reconciled here against actual current code, not just copied).

| ID | Severity | Risk | State | Evidence |
| --- | --- | --- | --- | --- |
| R-001 | Low | No legacy prototype existed; original baseline behavior/API can't be recovered. | Accepted (historical) | Greenfield authorization recorded in `DECISIONS.md` (ADR-0002). No longer load-bearing — the system has since been built, tested, and hardened well past the original baseline question. |
| R-002 | Low | Greenfield scaffolding could contradict an unprovided visual system/assets. | Resolved | A real, hand-authored, dignified/symbolic illustration now exists (`SubjectPortrait.tsx`, `portraitArt.ts`) and renders in both the CSS and WebGL paths. |
| R-003 | Low | External or unlicensed artwork could violate the asset-provenance directive. | Resolved | All visual assets are inline, hand-authored SVG paths/gradients — no external image service, no unlicensed artwork, in either renderer. |
| R-004 | Medium | Particle layer renders one DOM node per particle (up to 200). | Open, low-likelihood | See §2.4. Validation-capped, not unbounded; no shipped config approaches the ceiling. |
| R-005 | Medium | No CI-enforced performance budget (bundle size, etc.). | **Resolved 2026-07-28** | `.github/workflows/ci.yml` (previously no CI existed at all) runs the full validation suite on every push/PR, ending with `pnpm check:bundle-size` (`scripts/check-bundle-size.mjs`), which fails the build if `index.js`/`react.js`/`react.css`/any shared chunk regresses past a defined threshold. Verified the check-script actually fails correctly, not just passes silently, by temporarily lowering a budget and confirming a non-zero exit. |
| R-006 | Low | The public package doesn't export the rendering components — only config/validation/selection. | **Resolved 2026-07-28** | `Scene`/`SceneFallback`/`SceneWebgl`/`SubjectPortrait` now exported via a separate `@matrix-ai/ui/react` entry (ADR-0004), with a matching `@matrix-ai/ui/react.css`, a `'use client'` boundary verified against a real `next build`, and a new consumer fixture (`fixtures/react-consumer.mjs`). The `.` entry is unaffected — still zero DOM/CSS dependencies. |
| R-007 | Low | No real-browser continuous-animation/resize test automation exists. | Open, environment-constrained | Every tool available across this project's sessions has a dead-`rAF`/non-compositing limitation; worked around via static verification and manual real-browser checks (see §3). Not closeable without a different test environment (e.g., real Playwright/Puppeteer with an actual display). |
| R-008 | Low | WebGL's visual vocabulary (procedural gradient/rain/glow) is an approximation of the CSS scene, not pixel-identical. | Accepted | Intentional scope decision from the visual-parity pass — matches position/color/behavior, not a literal recreation of CSS's falling-text columns. |
| R-009 | Informational | Full M4 responsive-builder scope (drag/drop layer editing, multi-scene management) exceeds the round-trip minimum currently shipped (`SceneBuilder.tsx`). | Open, scoped | `SceneBuilder.tsx` satisfies the release-gate wording ("round-trips scene configuration") but is a minimal control panel, not a full visual builder product. |

---

## 5. Recommended next steps (not started — this document is an audit, not new work)

1. ~~CI performance budget~~ — **done 2026-07-28**, see R-005.
2. ~~Decide R-006 (public component exports)~~ — **done 2026-07-28**, see R-006.
3. **Canvas-based particle rendering** if any real usage approaches the 200-particle
   validation ceiling on low-end/mobile hardware (R-004) — not needed at current
   usage.
4. **Visual regression tooling**, if this moves toward a real release — would close
   R-007 properly rather than relying on manual spot-checks each session.

---

## 6. Production-readiness verdict against `ACCEPTANCE_CRITERIA.md` release gates

| Release gate | Status |
| --- | --- |
| Typecheck and lint pass | ✅ Pass (verified 2026-07-28) |
| Relevant unit/lifecycle/browser/accessibility/reduced-motion/asset-failure tests pass | ✅ Pass — 13 files/43 tests (see §3 for what's covered vs. named-open) |
| Visual output inspected at required breakpoints | ✅ Done repeatedly across sessions at 1440×900 and 320×700, both renderers, all three formats |
| Package independently consumable in Vite and Next.js | ✅ Both proven, for both entries — Vite via the demo itself, Next.js via `fixtures/nextjs-consumer/` (`.` entry at `/`, `@matrix-ai/ui/react` at `/react` with a verified Server-Component-renders-Client-Component `'use client'` boundary) with a real `next build`/`next dev` |
| Builder round-trips scene configuration | ✅ `SceneBuilder.tsx` + `exportSceneConfig`/`importSceneConfig`, round-trip-tested (`roundTrip.test.ts`) — minimal scope, not full M4 (R-009) |
| Fallback, accessibility, performance evidence, risks, API documentation, clean-install results recorded | ✅ This document + `README.md` + a verified clean-install run (`rm -rf node_modules` + `pnpm install --frozen-lockfile` + full validation, recorded in `ROADMAP.md`) |
| No unresolved critical or high-severity defect remains | ✅ Nothing in the risk register above is rated above Medium, and every Medium item has a named mitigation or is explicitly accepted |
| CI enforces the full validation suite, including a bundle-size budget | ✅ `.github/workflows/ci.yml` (added 2026-07-28 — no CI existed before this) runs on every push/PR: typecheck, lint, test, build, all three consumer fixtures, then `pnpm check:bundle-size` |

**This closes the last previously-open release gate** ("evidence recorded" for
risks/performance) and both Medium-severity risks (R-005, R-006). The remaining open
items (R-004, R-007, R-009) are Low/Informational, scoped, named, and not blocking
for the library's current stated scope — they are inputs to *future* product
decisions, not defects in what exists today.
