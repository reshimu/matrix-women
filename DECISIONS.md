# Architectural decisions

## ADR-0001 — Do not scaffold before baseline authorization

- **Status:** Accepted
- **Date:** 2026-07-26
- **Context:** The production directive explicitly requires an audit and preservation of the existing prototype before implementation. The workspace has no repository or prototype.
- **Decision:** Stop at M0 governance; do not generate a replacement application or dependencies.
- **Consequence:** Implementation is blocked until the intended source is supplied or the user explicitly authorizes a greenfield build.

## ADR-0002 — Greenfield build authorized

- **Status:** Accepted
- **Date:** 2026-07-26
- **Context:** No prototype or repository was available after M0 audit, and the user explicitly authorized a greenfield build.
- **Decision:** Create the Vite/React/TypeScript/Tailwind foundation and a CSS fallback before advanced renderer work.
- **Consequence:** M0 baseline evidence is an authored fallback baseline, not a preserved prototype.

## ADR-0003 — Public configuration and renderer choice remain browser-free

- **Status:** Accepted
- **Date:** 2026-07-26
- **Context:** The library must work in Vite and Next.js while WebGL remains progressive enhancement.
- **Decision:** Define scene layers, validation, and renderer selection as pure TypeScript modules. Browser-specific renderer implementations will live behind this selection boundary.
- **Consequence:** CSS fallback can be selected and tested without DOM or WebGL imports; enhanced renderer code cannot leak into the public configuration API.