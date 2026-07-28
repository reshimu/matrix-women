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

## ADR-0004 — Rendering components exported via a separate `./react` subpath, not the main entry

- **Status:** Accepted
- **Date:** 2026-07-28
- **Context:** The rendering components (`Scene`, `SceneFallback`, `SceneWebgl`, `SubjectPortrait`) were demo-only reference implementations. The product decision was made to export them publicly so consumers don't have to copy/rebuild them, but ADR-0003's rule (public entry stays renderer-independent and browser-free) still holds — `defaultScene`, `validateScene`, `selectRenderer`, etc. must keep working in a plain Node script or a React Server Component with zero DOM/CSS side effects, which the existing consumer fixtures (`fixtures/library-consumer.mjs`, `fixtures/nextjs-consumer/`) already prove and must keep proving.
- **Decision:** Add `src/react.ts` as a second, separate library entry (built to `dist/lib/react.js`, exposed as `@matrix-ai/ui/react`), rather than adding the components to `src/index.ts`. It imports `styles.css` (extracted to `dist/lib/react.css`, exposed as `@matrix-ai/ui/react.css`, which consumers import explicitly) and carries a single `'use client'` directive at the top of the entry file so Next.js's App Router can correctly treat it as a Client Component boundary when a Server Component imports and renders it. `SceneBuilder`/`DemoFormats` (dev-tooling/demo-only, not reusable production components) are not exported from either entry.
- **Consequence:** `@matrix-ai/ui`'s main entry is completely unchanged and still has zero DOM/CSS dependencies — the plain-Node and Next.js Server Component consumer fixtures for it still pass unmodified. `@matrix-ai/ui/react` is unambiguously the browser-only, opt-in surface; a consumer who only wants config/validation never pays for or accidentally pulls in React-rendering code, CSS, or the WebGL/Canvas2D renderer internals. Discovered during implementation: Rollup only preserves a `'use client'` directive when it sits at the very top of the *entry* file that becomes the bundle's first statement — placing it in each individual component source file (`Scene.tsx`, `SceneFallback.tsx`, `SceneWebgl.tsx`) gets silently stripped once those modules are bundled together. Kept the per-file directives anyway as accurate source-level documentation, but the one that actually matters for the shipped artifact is the one in `src/react.ts`.