# Next atomic task

The `webgl-portrait-texture` branch (PR #1) closed five slices: WebGL portrait
rendering, real-DOM lifecycle test coverage, accessibility/keyboard tests, live
portrait/square format demos (plus a real duplicate-id bug fix), and a minimal
config-round-trip builder — followed by a final hardening pass (asset-failure test,
`README.md`, clean-install verification, release-gate reconciliation). Full evidence
in `PROJECT_STATE.md`/`ROADMAP.md`. Test suite: 12 files / 40 tests.

## Immediate next step

**Review and merge PR #1** (https://github.com/reshimu/matrix-women/pull/1) — not
done automatically; merging main-branch history is a decision for you, not something
to do unilaterally.

## Proposed next steps after merge (not started, needs direction)

1. **Visual parity pass.** Bring the WebGL scene's look closer to the CSS scene
   (matrix-rain-like motion, portrait/lighting cues) instead of the current abstract
   gradient/glow/sparkle plus portrait texture.
2. **Decide on public component exports.** Right now `@matrix-ai/ui` ships only
   config/validation/selection primitives — the actual rendering components are
   demo-only. Decide whether/how to export `Scene`/`SceneFallback`/`SceneWebgl`
   publicly (this affects bundling of CSS, the WebGL shader/texture code, and API
   surface design — worth a deliberate decision, not a quick add).
3. **Full M4 responsive builder scope.** The round-trip minimum is done; a real
   drag/drop, multi-scene-management builder is a substantially larger effort.
4. **Consolidated risk/performance audit.** Evidence exists piecemeal across
   `PROJECT_STATE.md`/`RISKS.md`; synthesizing it into one document would close the
   last open release gate.

**Current blocker:** none technical — the branch is validated and ready; next step
is either merging it or picking a direction from the above.
