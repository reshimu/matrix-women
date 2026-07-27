# Changelog

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