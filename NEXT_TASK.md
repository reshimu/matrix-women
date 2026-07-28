# Next atomic task

The consolidated risk/performance audit is done:
[`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md) — real, freshly-verified
bundle sizes, runtime performance characteristics, a consolidated risk register
(R-001 through R-009, superseding the piecemeal/stale bullets previously scattered
across `PROJECT_STATE.md`/`RISKS.md`), and a release-gate verdict. This closes the
last previously-open release gate in `ACCEPTANCE_CRITERIA.md`. Along the way, closed
a real test-coverage gap found stale during reconciliation: `Scene.test.tsx` now
covers the webgl-vs-css branch decision (was flagged open, actually already resolved
by the time this session started for most other flagged gaps — this one wasn't).

## Proposed next steps (not started, needs direction)

All release gates in `ACCEPTANCE_CRITERIA.md` are now checked. Remaining items are
scoped product decisions, not defects (see `RISK_PERFORMANCE_AUDIT.md` §5):

1. **Decide R-006**: whether/how to export the rendering components
   (`Scene`/`SceneFallback`/`SceneWebgl`/`SubjectPortrait`) publicly from
   `@matrix-ai/ui`, or keep them demo-only/reference-only permanently.
2. **CI performance budget** (R-005): nothing currently fails a build on bundle-size
   regression.
3. **Full M4 responsive builder** (R-009): the round-trip minimum
   (`SceneBuilder.tsx`) satisfies the release gate; a real drag/drop multi-scene
   builder is a much larger, separate scope.
4. **Visual regression tooling** (R-007): would close the "no automated real-browser
   animation verification" gap properly, if this moves toward an actual release.

**Current blocker:** none technical — this is a product-direction choice, not a
technical gate. The system is genuinely production-ready for its current stated
scope (config/validation/selection library + a working, tested reference renderer).
