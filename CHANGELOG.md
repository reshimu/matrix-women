# Changelog

## 2026-07-27 — M2 core scene composition

- Added `src/scene/composition.ts` (`selectActiveLayers`, pure and tested) so
  `scene.effects` toggles (codeRain/particles/glow) actually determine which
  configured `scene.layers` render, rather than being ignored.
- Wired `SceneFallback` to render only active layers, applying each layer's
  `opacity`, and `density`/`intensity`/`count` where applicable, to real output.
- Added a `particles` layer render path (previously typed and validated but never
  rendered anywhere).
- Added real CSS layout differentiation for `hero`/`portrait`/`square` formats
  (distinct aspect-ratio, min-height, alignment) — verified via computed-style
  inspection, not just class-name presence.
- Validated: `pnpm typecheck`, `pnpm lint`, `pnpm test` (5 files / 11 tests, up from
  4/7), `pnpm build`, `pnpm test:consumer` all passed. Live browser inspection at
  1440×900 and 320×700 confirmed config values reach rendered output with no console
  errors.
- Marked M2 complete in `ROADMAP.md`/`ACCEPTANCE_CRITERIA.md`; proposed the first M3
  (WebGL lifecycle) slice in `NEXT_TASK.md`, pending confirmation before starting.

## 2026-07-27 — Recon and record reconciliation

- Ran a full recon pass (no product code changed): re-verified typecheck, lint, tests
  (4 files / 7 tests), demo build, library build, and the consumer fixture all pass;
  read every file in `src/` for stubs, mocks, TODOs, or placeholder logic (none found).
- Discovered `ROADMAP.md`, `NEXT_TASK.md`, and `PROJECT_STATE.md` had drifted from
  actual code state: the browser-only CSS renderer lifecycle host
  (`src/renderer/browser/cssRendererHost.ts`) was already implemented and tested but
  still described as pending work in all three files.
- Discovered the real remaining M2 gap: `SceneFallback` renders fixed hardcoded markup
  and does not read `scene.layers` or `scene.effects` from the validated `SceneConfig`
  — the schema and validation exist and are tested, but nothing in the render path
  consumes them yet.
- Corrected `ROADMAP.md` (M2 status), `NEXT_TASK.md` (real next task), and this file's
  companion `PROJECT_STATE.md` to reflect verified reality rather than assumed
  progress.
- Initialized a Git repository for the first time (none existed previously), merged in
  a pre-existing remote `README.md`, and pushed to `github.com/reshimu/matrix-women`.

## 2026-07-26 — M0 governance initialization

- Audited the supplied workspace: it is empty and is not a Git repository.
- Added the source-of-truth, product specification, state, roadmap, acceptance, decision, risk, next-task, and changelog records.
- Recorded the missing prototype as a high-severity blocker; no application code or dependency setup was created.

## 2026-07-26 — M1 foundation

- Recorded explicit greenfield authorization and completed M0 under ADR-0002.
- Added Vite, React, TypeScript, Tailwind, lint, test, and production-build configuration.
- Added renderer-independent scene defaults plus a responsive CSS fallback scene.
- Validated typecheck, lint, test, build, and visual behavior at desktop and 320px mobile.

## 2026-07-26 — M1 schema and fallback contract

- Added typed portrait, code-rain, particle, and lighting scene layers.
- Added deterministic scene validation and renderer-selection tests.
- Added an import-safe public entry point and documented ADR-0003.
- Created `RESTART_PROMPT.md` for a clean future-session handoff.
## 2026-07-26 — M1 library artifact

- Added a separate Vite library build with declaration output and explicit package exports.
- Declared React and React DOM as package peers.
- Added a package-name consumer fixture and validated it against the built artifact.
- Completed M1; next work begins M2 renderer lifecycle infrastructure.