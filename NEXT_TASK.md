# Next atomic task

The WebGL renderer lifecycle contract and its end-to-end wiring are both **done** as
of 2026-07-27:

- `src/renderer/browser/webglRendererHost.ts` — lifecycle contract, unit tested.
- `src/components/Scene.tsx` + `src/components/SceneWebgl.tsx` — live detection of
  `prefersReducedMotion`/`supportsWebGL`/`constrainedDevice`, feeding the already-tested
  `selectRenderer`, mounting a real `<canvas>` with a working `WebGLRenderingContext`
  when `webgl` is selected. Both the `webgl` and `css` branches were confirmed live in
  a real browser. `main.tsx` now mounts `<Scene>`.

The canvas currently only clears to a placeholder color — no shaders, geometry, or
actual rendering. Full evidence in `PROJECT_STATE.md`/`ROADMAP.md`.

## Proposed next task (not started, needs confirmation)

**Task:** Give the WebGL mount point actual rendering content driven by
`SceneConfig`, so the `webgl` path stops being a placeholder clear-color and starts
being a real progressive enhancement over the CSS fallback.

**Done when:**
- The WebGL canvas renders something config-driven (at minimum: responds to
  `scene.layers`/`scene.effects` the same way `SceneFallback` does — e.g. an animated
  gradient or simple particle field, not necessarily full parity with the CSS scene's
  visual design).
- Rendering starts/stops correctly with the existing lifecycle host states (`running`
  paints/animates, `paused`/`context-lost` stop doing GPU work — verify no per-frame
  work happens while paused).
- `prefers-reduced-motion` is respected (no continuous animation loop when
  `scene.reducedMotion` is true, mirroring the CSS host's `scene--still` behavior).
- Full validation (`typecheck`/`lint`/`test`/`build`/`test:consumer`) passes, plus live
  browser inspection at 1440×900 and 320×700 confirming the WebGL path actually
  animates/renders and the CSS fallback still works when forced.
- Project records updated with evidence.

**Current blocker:** none technical. This is the first slice with genuine WebGL
drawing code (shaders/buffers/draw calls) rather than lifecycle plumbing — worth
confirming scope (how close to CSS-scene visual parity is expected) before starting,
since "real rendering content" could range from a trivial animated fill to a fairly
involved shader.
