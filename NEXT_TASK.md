# Next atomic task

The rendering components are now exported publicly: `@matrix-ai/ui/react` ships
`Scene`, `SceneFallback`, `SceneWebgl`, `SubjectPortrait`, plus a `@matrix-ai/ui/react.css`
stylesheet the consumer imports explicitly. A separate library entry, not added to the
main `@matrix-ai/ui` entry (ADR-0004) — the main entry stays zero-DOM/zero-CSS. A
`'use client'` boundary was verified against a real `next build`
(`fixtures/nextjs-consumer/app/react/page.tsx`), and a new
`fixtures/react-consumer.mjs` proves the built artifact works standalone under plain
Node via `react-dom/server`. This resolves audit R-006. Full evidence in
`PROJECT_STATE.md`/`ROADMAP.md`/`RISK_PERFORMANCE_AUDIT.md`.

## Proposed next steps (not started, needs direction)

All release gates in `ACCEPTANCE_CRITERIA.md` are checked, and the two biggest named
product decisions (R-006, the risk audit itself) are both done. Remaining items are
smaller and more optional:

1. **CI performance budget** (audit R-005) — nothing currently fails a build on
   bundle-size regression for either `dist/lib/index.js` or `dist/lib/react.js`.
2. **Full M4 responsive builder** (audit R-009) — `SceneBuilder.tsx` satisfies the
   round-trip release gate; a real drag/drop multi-scene builder is a much larger,
   separate scope.
3. **Visual regression tooling** (audit R-007) — would close the "no automated
   real-browser animation verification" gap properly.
4. **Consider publishing to npm** now that the package has a real, exported,
   documented API surface — not started, and a bigger step (versioning, registry
   auth, semver policy) worth discussing explicitly before doing.

**Current blocker:** none technical — these are all optional next steps, not gates.
The system is genuinely production-ready for its current, now-broader stated scope.
