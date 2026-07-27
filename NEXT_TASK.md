# Next atomic task

M2 (core scene composition and dependable non-WebGL fallback) is **complete** as of
2026-07-27. `selectActiveLayers` makes `scene.layers`/`scene.effects` actually drive
render output, and `hero`/`portrait`/`square` produce real distinct layouts. Full
evidence in `PROJECT_STATE.md` and `ROADMAP.md`.

## Proposed next task (M3 kickoff — not started, needs confirmation)

**Task:** Define the enhanced (WebGL) renderer's lifecycle contract, mirroring
`src/renderer/browser/cssRendererHost.ts`'s `start`/`pause`/`resume`/`dispose` shape,
and implement a minimal WebGL renderer host behind the existing `selectRenderer`
boundary (`src/renderer/select.ts`). Scope to the *lifecycle scaffold* only — do not
attempt full visual parity with the CSS scene in this slice.

**Done when:**
- A `WebglRendererHost` (or equivalently named) module exists under
  `src/renderer/browser/`, exposing the same `start`/`pause`/`resume`/`dispose`/
  `getState` shape as the CSS host, with an injectable environment for testing.
- It handles WebGL context loss (`webglcontextlost`/`webglcontextrestored`) explicitly
  — this is the one behavior the CSS host has no analog for and is named in
  `PROJECT_SPEC.md`/`AGENTS.md` as a hard requirement.
- It pauses on hidden-document/offscreen states, same as the CSS host.
- No WebGL-specific code leaks into `src/index.ts` (the public library entry stays
  renderer-independent per ADR-0003).
- Unit tests cover start/pause/resume/dispose transitions and context-loss/restore,
  using an injected fake environment (same pattern as `cssRendererHost.test.ts`).
- Constrained-device behavior (already partially handled by `selectRenderer` steering
  constrained devices to `css`) is not re-litigated here — this slice is the lifecycle
  contract only.

**Current blocker:** none technical. This starts a new milestone (M3) — confirm before
implementation begins, since it's a larger and more architecturally novel slice than
prior M1/M2 work (first browser-only enhancement path, first place WebGL context-loss
handling is needed).
