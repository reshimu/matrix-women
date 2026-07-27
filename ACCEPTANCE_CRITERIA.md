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
- [ ] Actual WebGL rendering content (shaders, geometry, a rendered scene) — not
      started.
- [ ] Wiring into `selectRenderer`/`SceneFallback` so `webgl` capability actually
      renders something — not started.
- [ ] Constrained-device behavior beyond what `selectRenderer` already does (steering
      constrained devices to `css`) — not re-evaluated in this slice.