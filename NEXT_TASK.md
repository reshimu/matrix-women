# Next atomic task

Full M4 responsive builder scope is done: `SceneBuilder.tsx` now supports multi-scene
management (new/switch/duplicate/delete, persisted to `localStorage`) and generic
layer add/remove/reorder (native drag-and-drop plus keyboard-accessible ↑/↓ buttons),
on top of the format/effects/round-trip controls that already existed. A real bug was
found and fixed along the way: the public `@matrix-ai/ui/react.css` was accidentally
shipping demo-only builder styles (CSS isn't tree-shaken); split into
`src/styles.css` (public) and `src/demo.css` (demo-only), shrinking `react.css` to
10.08 kB. This resolves audit R-009 — the last named item in the risk register with
an open resolution path. Full evidence in `PROJECT_STATE.md`/`ROADMAP.md`.

## Where things stand

Every item in `RISK_PERFORMANCE_AUDIT.md`'s risk register (R-001 through R-009) is
now either resolved or an explicitly-accepted Low/Informational item that doesn't
block anything:

- R-001–R-003: resolved (historical, greenfield-era).
- R-004 (particle DOM node count): accepted, not needed at current usage.
- R-005 (CI performance budget): resolved.
- R-006 (public component exports): resolved.
- R-007 (no automated real-browser animation verification): accepted, environment-
  constrained — not closeable without different tooling (real Playwright/Puppeteer
  with an actual display).
- R-008 (WebGL visual parity is an approximation, not pixel-identical): accepted by
  deliberate design.
- R-009 (full M4 builder scope): resolved.

## Proposed next steps (not started, needs direction — all optional now)

1. **Visual regression tooling** (R-007) — the one item that could still be
   "resolved" rather than "accepted," if a different test environment becomes
   available (this session's tools all have a dead `requestAnimationFrame`/no real
   display).
2. **Consider publishing to npm** — the package has a real, documented, CI-validated,
   size-budgeted, now fully-featured-builder public API. Not started; versioning/
   registry-auth/semver policy worth discussing explicitly before doing.
3. **New feature work** — at this point, further "hardening" tasks are exhausted;
   anything past this is new product scope (new scene layer types, new formats, a
   different visual direction) rather than closing a named gap.

**Current blocker:** none. There is no forced next task — every audit item is closed
or accepted. Direction from here is a product decision, not a technical necessity.
