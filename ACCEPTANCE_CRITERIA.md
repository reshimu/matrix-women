# Acceptance criteria

## M0 — baseline and governance

- [x] Repository inventory identified no pre-existing source, dependencies, scripts, tests, or assets; greenfield authorization recorded.
- [x] Greenfield application installs and runs using documented commands.
- [x] Greenfield fallback baseline recorded at 1440×900 and 320×700; reduced-motion CSS behavior is present.
- [x] Governance documents exist and contain factual project state.
- [x] Baseline risks, architectural debt, and exact next task are recorded with evidence.

## Release gates

- [ ] Typecheck and lint pass.
- [ ] Relevant unit, schema/migration, lifecycle, browser, visual, responsive, reduced-motion, keyboard, asset-failure, fallback, context-loss, and stability tests pass.
- [ ] Visual output is inspected at required breakpoints.
- [ ] Builder round-trips scene configuration and package is independently consumable in Vite and Next.js.
- [ ] Fallback, accessibility, performance evidence, risks, API documentation, and clean-install results are recorded.
- [ ] No unresolved critical or high-severity defect remains.

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