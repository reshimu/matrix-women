# Project state

**Current milestone:** M1 — package and scene-schema foundation **complete**

## Evidence as of 2026-07-26

- Greenfield authorization was explicitly granted after the M0 audit found no existing repository or prototype.
- Vite 8, React 19, TypeScript 5.9, and Tailwind 4 demo established with a responsive CSS fallback.
- Public library artifact is separate from the demo: `dist/lib/index.js` (1.94 kB pre-gzip) plus declaration files.
- Public source entry: `src/index.ts`. It exports browser-free scene types/defaults/validation and pure renderer selection.
- Consumer fixture imports `@matrix-ai/ui` successfully and verifies configuration validation plus CSS fallback selection.
- Validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test` (3 files, 5 tests), `pnpm test:consumer`, and `pnpm build`.
- Rendered inspection passed: local demo at 1440×900 and 320×700; heading, description, and button are visible; browser console had no warnings or errors.

## Completed

- M0 governance completed under explicit greenfield authorization.
- M1 package boundaries, source-level public API, independently consumable ES library artifact, and Vite builder baseline completed.
- Added typed portrait, code-rain, particle, and lighting layers; deterministic scene validation; and pure renderer selection.
- Added a dignified, responsive, non-WebGL CSS fallback scene with reduced-motion CSS behavior.
- Added `RESTART_PROMPT.md` for context-safe handoff.

## Risks and blockers

- No Git repository is initialized, so work slices cannot be committed yet.
- No browser-only enhanced renderer exists yet; lifecycle cleanup, offscreen/hidden pausing, and context-loss recovery are unimplemented.
- Reduced-motion behavior is implemented in CSS and renderer selection, but browser emulation coverage is not yet automated.

## Exact next task

Define the renderer lifecycle contract and implement a browser-only CSS renderer host that pauses on hidden/offscreen states, cleans up deterministically, and has unit tests for its state transitions.