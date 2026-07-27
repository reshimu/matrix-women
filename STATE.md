# STATE.md — Recon findings (2026-07-27)

## a. Ten-line summary

Matrix AI UI is a greenfield React/TypeScript/Tailwind/Vite design-system package
(`@matrix-ai/ui`) for a "digital human in code-rain" hero scene. Codex built it from
scratch (no prior prototype existed) after recording explicit greenfield authorization
in `DECISIONS.md`. Scope is: a renderer-independent scene config schema, deterministic
validation, a pure renderer-selection function, and a browser-only CSS fallback
renderer with a real start/pause/resume/dispose lifecycle (visibility + intersection
observer driven). It builds as both a demo app and a separately-emitted library
artifact (`dist/lib/index.js`, ~2KB). Everything I ran — typecheck, lint, 7 tests
across 4 files, demo build, library build, and the consumer-fixture import — passed
with real exit code 0 and no fudging. There was no git repository until this session;
I initialized one, merged in a remote README that predated it, and pushed to
`github.com/reshimu/matrix-women`. The code is small (35 files) but everything present
is real, not stubbed — no TODO/FIXME/mock/placeholder/lorem/`any`-escape hits anywhere
in `src/`. WebGL enhancement, the visual builder, and Next.js consumption are not
started yet (M2–M5 per `ROADMAP.md`). This is an honest, narrow M1 checkpoint, not a
shippable design system.

## b. Inventory table

| File/module | Purpose | Status | Evidence |
|---|---|---|---|
| `src/scene/types.ts` | Scene config schema + `defaultScene` + `normalizeScene` | Done | Real discriminated-union layer types, real merge logic, tested |
| `src/scene/validate.ts` | Deterministic scene validation | Done | Full range/uniqueness checks per layer kind, tested with exact issue-string assertions |
| `src/scene/index.ts` | Public scene barrel export | Done | Trivial re-export, correct |
| `src/renderer/select.ts` | Pure renderer-kind selection (css vs webgl) | Done | 3-branch pure function, tested both branches |
| `src/renderer/browser/cssRendererHost.ts` | Browser-only lifecycle host: start/pause/resume/dispose, visibility + IntersectionObserver driven | Done | Real state machine, listener/observer cleanup on dispose, injectable environment for testing; tested for hidden+offscreen pause, manual pause/resume, and cleanup-on-dispose |
| `src/components/SceneFallback.tsx` | Renders the CSS fallback hero scene, wires up the lifecycle host | Done | Real JSX markup, ref + effect wiring, cleanup on unmount |
| `src/main.tsx` | Demo entrypoint | Done | Reads `prefers-reduced-motion`, mounts `SceneFallback` |
| `src/styles.css` | All visual styling for the fallback scene (aura/rain/subject/shoulders etc.) | Done | Hand-authored CSS, includes reduced-motion and <640px media queries — no placeholder colors or lorem |
| `src/index.ts` | Public library entry | Done | Re-exports only browser-free scene + selector symbols — no DOM imports leak in |
| `fixtures/library-consumer.mjs` | Proof the built library is importable standalone | Done | Actually imports `@matrix-ai/ui`, asserts validation + renderer selection, run via `pnpm test:consumer` — passed |
| `*.test.ts` (4 files, 7 tests) | Unit tests | Real assertions, not smoke tests | Assert exact returned objects/issue strings/state transitions, not just "renders without throwing" |
| `vite.config.ts` / `vite.library.config.ts` | Demo build vs. library build configs | Done | Library config externalizes react/react-dom, emits ES-only `dist/lib` |
| `tsconfig.*.json` (4 files) | Project-reference split (app/lib/node) | Done | Strict mode on, `noUnusedLocals`/`noUnusedParameters` on, lib config excludes tests and emits declarations only |
| `eslint.config.js` | Flat config, TS + react-hooks + react-refresh | Done | `--max-warnings=0` passes clean |
| No WebGL renderer | Enhanced renderer per `ROADMAP.md` M3 | **Not started** | No file exists under `src/renderer/` beyond `select.ts` and the CSS host |
| No visual builder | M4 scope | **Not started** | No builder UI, no config round-trip code anywhere |
| No Next.js fixture | Required by `PROJECT_SPEC.md` ("Vite and Next.js consumption") | **Not started** | Only `fixtures/library-consumer.mjs` (plain Node/ESM), nothing Next-specific |
| No browser/visual regression tests | M5 scope | **Not started** | Vitest config runs in `environment: 'node'` — no jsdom/browser test run exists despite DOM-touching code in `cssRendererHost.ts`/`SceneFallback.tsx` |

## c. Broken-now list

Nothing is currently broken. Every command I ran returned exit code 0:

- `pnpm typecheck` → exit 0, no output (clean)
- `pnpm lint` → exit 0, no output (clean, `--max-warnings=0`)
- `pnpm test` → exit 0, `4 passed (4)` files / `7 passed (7)` tests
- `pnpm build` (demo + library) → exit 0, both artifacts emitted
- `pnpm test:consumer` → exit 0, `Library consumer passed for matrix-serenity.`

The only pre-existing "broken" item was structural, not code: **no git repository
existed**. That's now fixed — repo initialized, remote README merged
(`--allow-unrelated-histories`), pushed to `origin/main` at
`github.com/reshimu/matrix-women`. `.pnpm-store` (pnpm's local package cache, not
project output) was caught before the first commit and added to `.gitignore`.

## d. Gap list — distance to a shippable design system

1. **No enhanced WebGL renderer.** Only the CSS fallback exists. The spec calls WebGL
   "optional enhancement" but M3 (lifecycle + constrained-device behavior for it) hasn't
   started at all.
2. **No visual builder / config round-trip UI.** `ACCEPTANCE_CRITERIA.md` requires this
   as a release gate; nothing exists yet.
3. **No Next.js consumption proof.** Spec requires Vite *and* Next.js support; only a
   plain-Node consumer fixture exists.
4. **No browser-environment test run.** `cssRendererHost.ts` and `SceneFallback.tsx`
   touch `document`, `IntersectionObserver`, and DOM refs, but Vitest is configured
   `environment: 'node'`. The lifecycle unit tests pass by injecting a fake
   `BrowserLifecycleEnvironment` — clever, but it means the *real* `browserEnvironment()`
   path (using actual `window.document`/`IntersectionObserver`) has zero automated
   coverage. Only a manual visual inspection (per `PROJECT_STATE.md`) has touched the
   real DOM path.
5. **No accessibility/keyboard-specific automated tests**, despite `AGENTS.md` requiring
   keyboard access — the button exists and has `:focus-visible` styling, but nothing
   asserts tab order or ARIA behavior beyond the static `aria-hidden`/`aria-labelledby`
   attributes already in the markup.
6. **No performance evidence** (bundle-size budget, render-cost checks) despite it being
   a named release gate in `ACCEPTANCE_CRITERIA.md`.
7. **Only one scene variant is wired up** (`defaultScene`, format `hero`). `portrait`
   and `square` formats are typed but nothing renders or tests them.
8. **Asset provenance is genuinely unresolved** — the "subject" is pure CSS shapes
   (halo/head/neck/shoulders gradients), not an actual illustration/photo/SVG asset.
   That satisfies "no external image service / no unlicensed artwork," but it's
   nowhere near a finished visual identity — R-003 in `RISKS.md` is still open and
   accurately reflects this.

## e. Completion plan (dependency-ordered, small enough to review per phase)

1. **Phase A — Lock in the checkpoint.** Done this session: git history exists, pushed
   to `reshimu/matrix-women`. Confirm branch protection / desired workflow (see open
   questions).
2. **Phase B — Real-DOM test coverage for the existing CSS lifecycle host.** Add a
   jsdom (or browser-mode) Vitest project alongside the current node project so
   `browserEnvironment()` itself — not just the injected fake — gets exercised at least
   once. Small, isolated, no new product surface.
3. **Phase C — Second scene format wired to a real render path.** Pick `portrait` or
   `square`, render it through `SceneFallback`, add a visual + unit check. Proves the
   schema→render pipeline generalizes before investing in WebGL.
4. **Phase D — WebGL enhancement (M3).** Only after B and C. Define the enhanced
   renderer's lifecycle contract analogous to `cssRendererHost.ts`, implement
   context-loss recovery, gate behind `selectRenderer`.
5. **Phase E — Next.js consumption fixture (M4 prerequisite).** A minimal Next app (or
   fixture) importing `@matrix-ai/ui`, proving SSR/hydration doesn't choke on the
   browser-only renderer path.
6. **Phase F — Visual builder + config round-trip (M4).** Larger; should be its own
   spec-reviewed slice, not bundled with anything above.
7. **Phase G — Accessibility, performance, and release-gate closeout (M5).** Keyboard
   nav tests, reduced-motion browser-emulation coverage, bundle budget, final
   `ACCEPTANCE_CRITERIA.md` sign-off.

Each phase should get its own spec-compliance + code-quality review pass per the
nafs-dev-system work-slice loop before moving to the next.

## f. Open questions for Shimon

1. **Repo visibility/protection.** `reshimu/matrix-women` is live with an initial push.
   Do you want branch protection on `main`, or is direct-push fine while this is early
   and solo?
2. **Asset direction.** The current "subject" is abstract CSS gradients (halo/head/neck/
   shoulders shapes) — intentionally non-figurative to dodge the "no unlicensed
   artwork" constraint. Is that the intended visual direction long-term, or is this a
   placeholder pending a real illustration/asset decision? `RISKS.md` (R-003) flags
   this as still open — I'm not resolving it, just surfacing it.
3. **Toggling between Codex and Claude on this repo.** You mentioned wanting to
   alternate agents on this repo now that it's pushed. Any convention you want enforced
   (e.g., both agents must update `PROJECT_STATE.md`/`NEXT_TASK.md` before finishing a
   session, or a required PR-per-slice instead of direct pushes to `main`) so the two
   agents' work stays legible to each other?
4. **Vitest DOM coverage gap (Gap #4 above).** Worth a dedicated slice before WebGL
   work starts, or acceptable to defer to M5?
5. **Scope confirmation on M2 next task.** `NEXT_TASK.md` says the lifecycle host is
   still pending, but it's already implemented and tested
   (`src/renderer/browser/cssRendererHost.ts` + its test file exist and pass). Either
   Codex finished this and forgot to update `NEXT_TASK.md`/`ROADMAP.md`, or there's a
   scope I'm misreading. Confirm before I (or the next agent) picks a "next task" —
   I did not update `NEXT_TASK.md`/`ROADMAP.md`/`PROJECT_STATE.md` myself since Phase 1
   is recon-only; that reconciliation is implementation-adjacent and should wait for
   your go-ahead.

## Session actions taken (outside strict recon, done at your explicit request)

- `git init`, added `.pnpm-store` to `.gitignore` (was accidentally about to be
  committed — it's pnpm's local package cache, not project output).
- Committed all existing files as the initial commit.
- Added remote `origin` → `https://github.com/reshimu/matrix-women.git`, fetched,
  found the remote already had a one-file `README.md` commit, merged it in with
  `--allow-unrelated-histories`, and pushed. `main` now tracks `origin/main`.

No other project files were modified. No implementation work was started.
