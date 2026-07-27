# Next atomic task

The WebGL renderer lifecycle contract is **done** as of 2026-07-27:
`src/renderer/browser/webglRendererHost.ts` mirrors the CSS host's
`start`/`pause`/`resume`/`dispose`/`getState` shape, adds a `context-lost` state driven
by `webglcontextlost`/`webglcontextrestored` that takes precedence over visibility/
intersection pausing, and is unit tested (4 tests). It is deliberately unwired and
contains no actual rendering — see `ROADMAP.md`/`PROJECT_STATE.md` for full evidence.

## Proposed next task (not started, needs confirmation)

Two candidate next slices — pick one, don't do both in one pass:

**Option A — Minimal WebGL rendering content.** Give `webglRendererHost` something
real to drive: a small shader/geometry program that renders a simple version of the
scene (e.g. an animated gradient or particle field reacting to `SceneConfig`), proving
the lifecycle contract actually gates real GPU work, not just a state machine.

**Option B — Wire the host into the selection boundary.** Connect
`selectRenderer`/`SceneFallback` so that when `webgl` is chosen, something (even a
placeholder canvas) actually mounts and uses `createWebglRendererHost`, proving the
end-to-end path from config → renderer selection → mounted WebGL host works, before
investing in real rendering content.

**Done when (whichever option):**
- The chosen slice has a clear, narrow deliverable (not both rendering content *and*
  wiring in the same pass).
- Constrained-device behavior is not re-litigated — `selectRenderer` already steers
  constrained devices to `css`.
- Public library entry (`src/index.ts`) still exposes no browser-only APIs.
- Validation (`typecheck`/`lint`/`test`/`build`/`test:consumer`) passes, and a visual
  inspection happens if anything becomes actually renderable in the demo.

**Current blocker:** none technical. Recommend confirming which option before
starting, since they lead to different follow-on work (Option A grows the renderer's
visual surface; Option B proves integration plumbing first).
