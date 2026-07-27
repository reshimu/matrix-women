# Next atomic task

M3's WebGL path is now: lifecycle contract (done) → wired into `selectRenderer`/`Scene`
(done) → trivial animated gradient (done, 2026-07-27). `src/components/SceneWebgl.tsx`
renders a real fullscreen-gradient shader, animates only while the lifecycle host
reports `running`, stays static when `scene.reducedMotion` is true, and resizes its
drawing buffer via `ResizeObserver`. Full evidence in `PROJECT_STATE.md`/`ROADMAP.md`,
including an important caveat: continuous animation and resize-repaint behavior were
verified by code review, not live observation, because this session's browser-pane
tool doesn't composite frames (confirmed directly — neither `requestAnimationFrame`
nor `ResizeObserver` fire in it). **Recommend a spot-check in a real browser tab
outside this tool before treating that part as fully proven.**

## Proposed next steps (not started, needs direction)

No single obvious next atomic task — pick a direction:

1. **Visual parity pass.** Bring the WebGL scene's look closer to the CSS scene
   (matrix-rain-like motion, portrait/lighting cues) instead of a plain color mix.
2. **Config-driven WebGL composition.** Mirror what `selectActiveLayers` did for the
   CSS scene — make the WebGL shader actually respond to `scene.layers`/`scene.effects`
   (e.g. intensity/density affecting the gradient), not just `reducedMotion`.
3. **Real-browser spot-check.** Before building further on top of the animation/resize
   plumbing, verify it in an actual browser tab (not this tool's sandboxed pane) to
   close the verification gap noted above.
4. **Move on from M3 entirely** and pick up other roadmap gaps (Next.js consumption
   proof, additional scene formats demoed live, accessibility/keyboard test coverage)
   since M3 already has a working (if simple) progressive-enhancement path.

**Current blocker:** none technical — this is a direction choice, not a technical
gate.
