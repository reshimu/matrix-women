# Next atomic task

M3's WebGL path is complete end-to-end (lifecycle → wiring → animation → spot-check →
config-driven composition). The Next.js consumption proof required by
`PROJECT_SPEC.md` is also done, 2026-07-27: `fixtures/nextjs-consumer/` (a real Next.js
15 app, pnpm workspace member) imports `@matrix-ai/ui` from a Server Component,
`next build` statically prerenders it, `next dev` was live-verified in a real browser.
Full evidence in `PROJECT_STATE.md`/`ROADMAP.md`.

## Proposed next steps (not started, needs direction)

1. **M3 visual parity pass.** The WebGL scene uses an abstract gradient/glow/sparkle
   vocabulary, nothing like the CSS scene's matrix-rain/portrait-silhouette look.
2. **Demo the other scene formats live.** `portrait`/`square` are proven correct via
   computed-style checks but `main.tsx` only ever mounts the default `hero` scene —
   nobody has actually seen them rendered in the running demo.
3. **Start M4 (responsive builder + config round-trip + documented public API).** The
   biggest remaining roadmap item; likely worth its own spec discussion given its
   size, per `ACCEPTANCE_CRITERIA.md`'s release gates.
4. **Accessibility/keyboard test coverage** — named in `AGENTS.md`'s requirements,
   not yet covered by any automated test.

**Current blocker:** none technical — this is a direction choice, not a technical
gate.
