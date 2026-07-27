# Matrix AI UI — restart prompt pack

Use this file at the start of any new session before changing code.

## Copy/paste prompt

Continue the Matrix AI UI greenfield build in `C:\dev\matrix-women`. Read `AGENTS.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `DECISIONS.md`, `ACCEPTANCE_CRITERIA.md`, and this file first. Follow the repository authority order and work-slice loop. Implement exactly the atomic task in `NEXT_TASK.md`; validate with `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:consumer`, and `pnpm build`; inspect visual output when visual behavior changes; then update project records and this file. Do not weaken tests, skip validations, or add out-of-scope product features.

## Current verified state

- Explicit greenfield authorization; no prototype was provided.
- M0 and M1 are complete. M2 has not started.
- Demo: Vite 8 + React 19 + TypeScript 5.9 + Tailwind 4. `src/main.tsx` renders the responsive CSS fallback in `src/components/SceneFallback.tsx`.
- Library: `src/index.ts` exports browser-free scene defaults/types/validation plus renderer selection. `vite.library.config.ts` emits `dist/lib/index.js`; `tsconfig.lib.json` emits declarations.
- Consumer proof: `fixtures/library-consumer.mjs` imports `@matrix-ai/ui` after `pnpm build:library`.
- Last full validation passed 2026-07-26: typecheck, lint, 3 Vitest files / 5 tests, consumer fixture, demo build, and library build.
- Last visual inspection passed at 1440×900 and 320×700 with no browser-console warnings/errors.

## Exact next task

Implement a browser-only CSS renderer host under a new internal renderer path. Define start/pause/resume/dispose behavior. It must pause when the document is hidden or its host is offscreen, clean up listeners/observers, and expose no browser APIs from `src/index.ts`. Write unit tests for transition behavior. Update all project records and this restart pack with factual validation evidence.

## Non-negotiables

- React + TypeScript; Tailwind; Vite demo.
- Public scene config remains renderer-independent and browser-free.
- WebGL is enhancement only; CSS/Canvas/SVG fallback is mandatory.
- Support 320px, reduced motion, keyboard access, lifecycle cleanup, hidden-document/offscreen pausing.
- No backend/auth/accounts/payments/database/analytics/cloud storage or unlicensed external visual assets.
- The default subject is dignified, symbolic, feminine, ethereal, and non-sexualized.

## Known risks

- No Git repository exists; no commits can be made.
- Browser-only enhanced renderer lifecycle, WebGL, builder round-trip, Next.js fixture, browser regression tests, and full release validation remain outstanding.