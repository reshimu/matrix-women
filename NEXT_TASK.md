# Next atomic task

**Task:** Wire `SceneFallback` (or a new composition layer beneath it) to actually
render from validated `SceneConfig` data, instead of the current hardcoded markup.
Specifically: respect `scene.layers` (per-layer `opacity`, and `density`/`intensity`
where applicable), `scene.effects` (`codeRain`/`particles`/`glow` toggles), and
`scene.format` (`hero`/`portrait`/`square` should produce visually distinct layouts,
not just a no-op CSS class).

**Done when:**
- Setting `effects.codeRain`, `effects.particles`, or `effects.glow` to `false`
  measurably removes or hides the corresponding visual layer in rendered output.
- Layer `opacity`/`density`/`intensity` values from a `SceneConfig` are reflected in
  what's rendered (not hardcoded constants).
- `portrait` and `square` formats render distinguishably different layouts from
  `hero`, not just a differently-named class with identical visual result.
- Unit or rendering tests cover at least one non-default `SceneConfig` to prove the
  composition is config-driven.
- Project records (`PROJECT_STATE.md`, `CHANGELOG.md`, `ROADMAP.md`, this file) are
  updated with evidence before the session ends.

**Current blocker:** none. The renderer-independent schema, validation, renderer
selection, and CSS lifecycle host are all implemented and tested — this task connects
that existing infrastructure to actual render output.

## Correction (2026-07-27)

This file previously listed "Define the renderer lifecycle contract and implement a
browser-only CSS renderer host" as the next task. That work is already done:
`src/renderer/browser/cssRendererHost.ts` implements `start`/`pause`/`resume`/`dispose`
with visibility-change and `IntersectionObserver`-driven pausing, isolated from the
public library entry (`src/index.ts` exports no browser APIs). Its test file
(`cssRendererHost.test.ts`) covers hidden/offscreen pausing, manual pause/resume, and
listener/observer cleanup on dispose. Verified 2026-07-27 by reading the implementation
and running `pnpm test` (7/7 tests passing, 0 failures).

This was apparently completed in an earlier session but never reported back — this
file, `ROADMAP.md`, and `CHANGELOG.md` all still described it as pending. Treat any
tracker file in this repo as unverified until cross-checked against the actual code and
a real test run.
