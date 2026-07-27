# Matrix AI UI — restart prompt pack

Use this file at the start of any new session before changing code.

## Copy/paste prompt

Continue the Matrix AI UI greenfield build in `C:\dev\matrix-women`. Read `AGENTS.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `DECISIONS.md`, `ACCEPTANCE_CRITERIA.md`, and this file first. Follow the repository authority order and work-slice loop. Implement exactly the atomic task in `NEXT_TASK.md`; validate with `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:consumer`, and `pnpm build`; inspect visual output when visual behavior changes; then update project records and this file. Do not weaken tests, skip validations, or add out-of-scope product features.

## Current verified state

- Explicit greenfield authorization; no prototype was provided.
- M0 and M1 are complete. M2 (core scene composition + dependable non-WebGL fallback)
  is **in progress**, not unstarted.
- Demo: Vite 8 + React 19 + TypeScript 5.9 + Tailwind 4. `src/main.tsx` renders the responsive CSS fallback in `src/components/SceneFallback.tsx`.
- Library: `src/index.ts` exports browser-free scene defaults/types/validation plus renderer selection. `vite.library.config.ts` emits `dist/lib/index.js`; `tsconfig.lib.json` emits declarations.
- Consumer proof: `fixtures/library-consumer.mjs` imports `@matrix-ai/ui` after `pnpm build:library`.
- **Already done (verified 2026-07-27, was previously unreported in this file):** a
  browser-only CSS renderer lifecycle host exists at
  `src/renderer/browser/cssRendererHost.ts` — `start`/`pause`/`resume`/`dispose`,
  driven by `visibilitychange` and `IntersectionObserver`, with injectable environment
  and its own passing test file. Do not re-implement this.
- **Not yet done:** `SceneFallback` does not read `scene.layers` or `scene.effects` —
  it renders fixed hardcoded markup regardless of the `SceneConfig` passed in. This is
  the real next task (see below).
- Last full validation passed 2026-07-27: typecheck, lint, 4 Vitest files / 7 tests,
  consumer fixture, demo build, and library build — all re-verified fresh, not carried
  over from the 2026-07-26 record.
- Last visual inspection passed 2026-07-26 at 1440×900 and 320×700 with no
  browser-console warnings/errors. Not re-inspected in the 2026-07-27 pass (no visual
  code changed).

## Exact next task

Wire `SceneFallback` (or a new composition layer) to render from the validated
`SceneConfig` — respect `scene.layers` (opacity/density/intensity per layer),
`scene.effects` (codeRain/particles/glow toggles), and `scene.format`
(hero/portrait/square should look visually distinct) — instead of today's hardcoded
markup. Full done-criteria in `NEXT_TASK.md`. Update all project records and this
restart pack with factual validation evidence when done.

## Non-negotiables

- React + TypeScript; Tailwind; Vite demo.
- Public scene config remains renderer-independent and browser-free.
- WebGL is enhancement only; CSS/Canvas/SVG fallback is mandatory.
- Support 320px, reduced motion, keyboard access, lifecycle cleanup, hidden-document/offscreen pausing.
- No backend/auth/accounts/payments/database/analytics/cloud storage or unlicensed external visual assets.
- The default subject is dignified, symbolic, feminine, ethereal, and non-sexualized.

## Known risks

- Config-driven scene composition (layers/effects actually affecting render output) is
  the biggest gap toward a shippable design system — bigger than the still-pending
  WebGL enhancement, since the CSS fallback path is supposed to be the dependable
  baseline.
- Browser-only enhanced (WebGL) renderer lifecycle, builder round-trip, Next.js
  fixture, real-DOM/browser regression tests (current tests only exercise an injected
  fake environment), and full release validation remain outstanding.
- Git repository now exists and is pushed to `github.com/reshimu/matrix-women` — the
  "no Git repository" risk recorded on 2026-07-26 no longer applies. Both Codex and
  Claude Code now work against this remote; treat any tracker file (`NEXT_TASK.md`,
  `ROADMAP.md`, `PROJECT_STATE.md`) as unverified until cross-checked against the
  actual code and a real test run — this file was itself found stale on 2026-07-27.