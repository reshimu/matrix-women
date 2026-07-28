# Acceptance criteria

## M0 — baseline and governance

- [x] Repository inventory identified no pre-existing source, dependencies, scripts, tests, or assets; greenfield authorization recorded.
- [x] Greenfield application installs and runs using documented commands.
- [x] Greenfield fallback baseline recorded at 1440×900 and 320×700; reduced-motion CSS behavior is present.
- [x] Governance documents exist and contain factual project state.
- [x] Baseline risks, architectural debt, and exact next task are recorded with evidence.

## Release gates

- [x] Typecheck and lint pass — reverified from a genuine clean install (`rm -rf
      node_modules && pnpm install --frozen-lockfile`), not just an incrementally
      warm environment. See "Final hardening pass" below.
- [x] Unit tests pass (13 files / 43 tests): scene validation/composition/round-trip
      (pure, node env), renderer selection and WebGL uniform derivation (pure),
      lifecycle-host state transitions (both CSS and WebGL hosts, injected fake
      environment). Real-DOM/real-browser-environment coverage (jsdom): the actual
      `createDefaultBrowserEnvironment()` path, both lifecycle hosts driven through
      real `document.hidden`/`visibilitychange`/`webglcontextlost` events — previously
      an explicitly accepted gap, now closed. Accessibility/keyboard: real button
      focusability, non-dangling `aria-labelledby` (via `useId`), decorative-layer
      `aria-hidden`, reduced-motion class toggling. Asset-failure: `SceneWebgl` renders
      without throwing and without console errors when `canvas.getContext` returns
      `null` (WebGL unavailable). Context-loss: WebGL host unit + jsdom real-event
      coverage. Schema/round-trip: `exportSceneConfig`/`importSceneConfig` reproduce an
      exact `SceneConfig`, and malformed/wrong-shaped JSON surfaces as a validation
      issue rather than throwing.
- [x] Visual output inspected at 1440×900 and 320×700 across every slice this session
      (see `ROADMAP.md`'s dated entries for the specific evidence per feature), plus a
      real-browser (Claude in Chrome) spot-check distinct from this session's
      non-compositing sandboxed pane where that pane's limitations mattered.
- [x] Package is independently consumable in Vite (the demo app itself) and in
      Next.js (a real `next build`/`next dev` fixture — see the Next.js consumption
      proof entry in `ROADMAP.md`).
- [x] Builder round-trips scene configuration — `src/components/SceneBuilder.tsx` +
      `exportSceneConfig`/`importSceneConfig`, live-verified: export while in one
      format, switch away, paste the export back in, confirm an exact string match
      restored plus the live preview updating.
- [x] Clean-install results recorded: full `node_modules` removal (root + the Next.js
      fixture workspace member) followed by `pnpm install --frozen-lockfile` succeeded,
      and every validation command (`typecheck`, `lint`, `test`, `build`,
      `test:consumer`, `test:nextjs-consumer`) passed from that fresh install.
- [x] API documentation recorded — see `README.md`, covering both public entries
      (`@reshimu/matrix-ai-ui` config/validation/selection, `@reshimu/matrix-ai-ui/react` rendering
      components) accurately, including the required `react.css` import and the
      `'use client'`/Next.js note.
- [x] Fallback/performance evidence and a full risk audit are now consolidated in
      [`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md) — real, freshly-verified
      bundle sizes (published library 2.69 kB / demo 211.56 kB JS), a runtime
      performance characteristics section, a consolidated risk register (superseding
      the piecemeal bullets previously scattered across `PROJECT_STATE.md`/`RISKS.md`
      — several of which were found stale/already-resolved during this reconciliation
      and are called out as such, not silently repeated), and this release-gate
      table cross-checked against it.
- [x] No unresolved critical or high-severity defect is known. Two real bugs were
      found and fixed *during* this session's hardening work (see `ROADMAP.md`): a
      stale WebGL canvas resize listener, and a duplicate-DOM-id accessibility bug
      that would have broken `aria-labelledby` the moment more than one scene was
      mounted on a page (fixed via `useId`). Open, non-blocking items are tracked in
      `NEXT_TASK.md` (full M4 builder scope beyond this round-trip minimum, visual
      regression tooling).

## Rendering components exported publicly (2026-07-28) — resolves audit R-006

- [x] `Scene`/`SceneFallback`/`SceneWebgl`/`SubjectPortrait` exported via a separate
      `@reshimu/matrix-ai-ui/react` entry (`DECISIONS.md` ADR-0004), not merged into the main
      browser-free `@reshimu/matrix-ai-ui` entry — confirmed the main entry is completely
      unaffected (`fixtures/library-consumer.mjs` still passes unmodified).
- [x] A `'use client'` directive at the top of the bundled `react.js` output lets
      Next.js App Router Server Components render these components directly —
      verified against a real `next build`/`next dev`
      (`fixtures/nextjs-consumer/app/react/page.tsx`), including a live browser check
      that real styling is applied (not just unstyled HTML) and no console errors.
- [x] A new `fixtures/react-consumer.mjs` (`pnpm test:react-consumer`) proves the
      built artifact is consumable standalone under plain Node via
      `react-dom/server`, mirroring the existing `test:consumer` pattern.
- [x] Two real bugs found and fixed during verification: a missing try/catch in
      `detectConstrainedDevice()` that would throw under SSR without a `navigator`
      global, and a `'use client'` directive placement gotcha (Rollup only preserves
      it at the top of the bundled entry file, not in individual source files).

## CI + bundle-size performance budget (2026-07-28) — resolves audit R-005

- [x] `.github/workflows/ci.yml` added — no CI existed for this repo before this. Runs
      on every push to `main` and every PR: `typecheck` → `lint` → `test` → `build` →
      `test:consumer` → `test:react-consumer` → `test:nextjs-consumer` →
      `check:bundle-size`.
- [x] `scripts/check-bundle-size.mjs` (`pnpm check:bundle-size`, no new dependency)
      fails the build if `dist/lib/index.js`, `react.js`, `react.css`, or any shared
      chunk regresses past a defined budget, each set with real headroom above the
      current verified size.
- [x] Verified the check-script can actually fail: temporarily patched a copy with an
      impossibly low budget, confirmed `[FAIL]` output and a non-zero exit code, then
      discarded the patched copy — not just trusted that it would work.

## Full M4 responsive builder scope (2026-07-28) — resolves audit R-009

- [x] Multi-scene management: new/switch/duplicate/delete, persisted to
      `localStorage` across reloads (`src/components/builderState.ts`,
      `SceneBuilder.tsx`).
- [x] Generic layer add/remove/reorder for any layer type — native HTML5 drag-and-drop
      plus keyboard-accessible ↑/↓ move buttons (drag alone isn't keyboard-operable,
      and `AGENTS.md` requires keyboard access).
- [x] Title/Eyebrow text fields added (previously only editable via raw JSON import).
- [x] 27 new tests (18 pure-logic + 9 component-level) covering layer management,
      multi-scene isolation/persistence, and confirming the export→import round-trip
      still works with the new generic layer model.
- [x] Real bug found and fixed during verification: the public `react.css` was
      accidentally shipping demo-only builder styles (CSS isn't tree-shaken) —
      split into `src/styles.css` (public) and `src/demo.css` (demo-only), shrinking
      `react.css` from a bloated 12.98 kB to 10.08 kB.
- [x] Live-verified in a real browser: drag-and-drop reordering, full multi-scene
      lifecycle, persistence across an actual reload, and correct responsive
      collapsing with no horizontal overflow at 320px.

**Every item in `RISK_PERFORMANCE_AUDIT.md`'s risk register (R-001–R-009) is now
resolved or an explicitly-accepted Low/Informational item.**

## WebGL/CSS visual parity (2026-07-27)

- [x] WebGL scene's background gradient, aura/glow position, and code-rain effect now
      match the CSS scene's actual design (position, color stops) instead of an
      unrelated abstract vocabulary — verified via `gl.readPixels` scans in a real
      browser, including confirming the `effects.codeRain` toggle genuinely hides the
      rain effect (not just slows an unrelated animation).
- [x] Fixed a real robustness gap found during verification: config changes now
      repaint the WebGL canvas immediately regardless of animation/reduced-motion
      state, rather than only on the next animation frame (which may not come soon,
      or at all, for a paused/backgrounded tab).

## M1 — package and schema foundation

- [x] Vite builder/demo runs with React, TypeScript, and Tailwind.
- [x] Public scene configuration is renderer-independent and has deterministic validation coverage.
- [x] CSS fallback selection is pure and tested for reduced-motion, constrained-device, and missing-WebGL cases.
- [x] A separately emitted ES library artifact is consumable through the package name without importing demo code.

## M2 — core scene composition and dependable non-WebGL fallback

- [x] Rendered output is driven by validated `SceneConfig`: `scene.layers` (per-layer opacity, and density/intensity/count where applicable) and `scene.effects` (codeRain/particles/glow toggles) measurably change what renders, verified by unit tests (`composition.test.ts`) and live in a real browser via computed-style inspection.
- [x] `hero`, `portrait`, and `square` formats produce distinguishable layouts (aspect-ratio, min-height, alignment), not a cosmetic class-name-only difference — verified via computed-style inspection in a real browser.
- [x] Browser-only CSS renderer lifecycle host (start/pause/resume/dispose) pauses on hidden-document/offscreen states with deterministic listener/observer cleanup — unit tested.
- [ ] Real-DOM/browser-environment automated test coverage for the lifecycle host (current tests exercise only an injected fake environment; the real `browserEnvironment()` path has manual-only verification). Deferred to M5 validation closeout — see `RISKS.md`.
- [ ] Additional scene formats/layer combinations demoed in the actual demo app, not just proven in isolation (`main.tsx` still mounts only the default hero scene). Deferred — not required for M2's composition-correctness goal.

## M3 — progressive WebGL enhancement (in progress)

- [x] WebGL renderer lifecycle contract mirrors the CSS host: `start`/`pause`/
      `resume`/`dispose`/`getState`, pausing on hidden-document/offscreen states.
- [x] WebGL context loss (`webglcontextlost`) and restoration
      (`webglcontextrestored`) are handled explicitly, taking precedence over
      visibility/intersection-driven pausing — unit tested.
- [x] No WebGL-specific code leaks into `src/index.ts`; verified the library artifact
      size is unchanged (2.26 kB) after adding the host.
- [x] Wired into `selectRenderer`/`Scene` so `webgl` capability actually mounts a real
      canvas with a working WebGL context — live-verified in a real browser (both the
      `webgl` and `css` branches were exercised and confirmed, not just type-checked).
- [x] A trivial animated-gradient shader renders, respects the lifecycle host's
      running/paused states (no animation while paused/context-lost), and respects
      `scene.reducedMotion` (static single frame instead of a continuous loop).
      Shader math and mount-time sizing verified live via `gl.readPixels`;
      continuous-frame and post-mount-resize behavior verified by code review only —
      this sandboxed browser pane doesn't composite frames, so neither
      `requestAnimationFrame` nor `ResizeObserver` fire in it (confirmed directly).
- [x] The WebGL scene is config-driven the same way the CSS scene is: `deriveWebglUniforms`
      mirrors `selectActiveLayers`, so `scene.layers`/`scene.effects` measurably change
      shader output (glow intensity, gradient speed, brightness, sparkle). Verified
      live via exact pixel-value checks in a real browser, including confirming an
      `effects.glow: false` override zeroes the glow contribution.
- [ ] Visual parity with the CSS scene (matrix rain, portrait, lighting) — explicitly
      out of scope; the WebGL scene uses an abstract gradient/glow/sparkle vocabulary,
      not a literal recreation of the CSS visuals.
- [ ] Constrained-device behavior beyond what `selectRenderer` already does (steering
      constrained devices to `css`) — not re-evaluated in this slice.

## Next.js consumption proof (2026-07-27)

- [x] A real Next.js app (`fixtures/nextjs-consumer/`, its own pnpm workspace member,
      linked via `workspace:*`) imports `@reshimu/matrix-ai-ui` — `defaultScene`,
      `validateScene`, `selectRenderer`, `selectActiveLayers` — from a Server
      Component with no `'use client'` directive, proving the public entry is
      genuinely SSR/build-time-safe with zero DOM/browser API usage.
- [x] `next build` succeeds and statically prerenders the page (`○ (Static)`),
      meaning the package's exports executed correctly inside Next's actual
      server-rendering pipeline, not just a Node script emulating one.
- [x] `next dev` live-verified in a real browser: page renders the correct
      SSR-computed values (`Scene id: matrix-serenity`, `Renderer kind: webgl`,
      `Active layers: subject, matrix-rain, ambient-light`), no console errors.
- [x] Root `pnpm lint`/`pnpm typecheck`/`pnpm test`/`pnpm build` all still pass
      unaffected after adding the workspace member.

## Digital-woman subject illustration (2026-07-27)

- [x] `AGENTS.md`'s visual requirement — "serene, intelligent, dignified, feminine,
      ethereal, symbolic, and non-sexualized" — addressed by a real hand-authored SVG
      illustration (`src/components/SubjectPortrait.tsx`), replacing the earlier
      placeholder CSS blob shapes.
- [x] No external image service or unlicensed artwork — fully inline, hand-coded SVG
      paths and gradients, matching `PROJECT_SPEC.md`'s asset-representation
      constraint.
- [x] Faceless/symbolic by design rather than photorealistic — avoids uncanny-valley
      risk and reads as dignified/ethereal per the spec's own vocabulary.
- [x] Visually verified via rasterized-PNG inspection (this session's screenshot
      tooling was fundamentally broken — see `ROADMAP.md` for the workaround) across
      4 design iterations, and confirmed the shipped component's live DOM output is
      byte-identical to the verified preview.
- [x] Full validation (`typecheck`/`lint`/`test`/`build`/`test:consumer`) passes; no
      console errors at 1440×900 or 320×700 in a live dev server.