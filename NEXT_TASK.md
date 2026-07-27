# Next atomic task

M3's WebGL path is now complete end-to-end: lifecycle contract → wired into
`selectRenderer`/`Scene` → animated shader → real-browser spot-check → config-driven
composition (`deriveWebglUniforms` mirroring `selectActiveLayers`, live-verified via
exact pixel checks including an `effects.glow: false` toggle test). Full evidence in
`PROJECT_STATE.md`/`ROADMAP.md`.

## Proposed next steps (not started, needs direction)

1. **Visual parity pass.** The WebGL scene currently uses an abstract
   gradient/glow/sparkle vocabulary that doesn't resemble the CSS scene's matrix-rain/
   portrait-silhouette look. Bring them closer together, or decide they're
   intentionally different renderer "styles."
2. **Move on from M3.** M3 now has a working, config-driven, spot-checked progressive
   enhancement path. Candidate other roadmap gaps: Next.js consumption proof (spec
   requires it, only a plain-Node fixture exists), additional scene formats
   (portrait/square) demoed live in the actual demo app (currently only proven via
   computed-style checks), or accessibility/keyboard test coverage.
3. **M4 builder work.** `ACCEPTANCE_CRITERIA.md`'s release gates require a responsive
   builder and config round-trip — a much larger slice, likely worth its own spec
   discussion before starting.

**Current blocker:** none technical — this is a direction choice, not a technical
gate.
