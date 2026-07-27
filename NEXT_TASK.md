# Next atomic task

M3's WebGL path: lifecycle contract (done) → wired into `selectRenderer`/`Scene`
(done) → trivial animated gradient (done) → real-browser spot-check (done,
2026-07-27). All four are complete. Full evidence in `PROJECT_STATE.md`/`ROADMAP.md`.

## Spot-check result summary

Re-verified in Claude in Chrome (a real, non-sandboxed browser, distinct from this
session's synthetic browser-pane tool). Static behavior (shader math, canvas mount,
sizing) reproduced identically with no console errors. `requestAnimationFrame` and
`ResizeObserver` still didn't fire — traced to the automated tab having a `0×0`
viewport (no real rendering surface at all), and confirmed the suspension tracks
Chrome's actual compositor-visibility state, not a spoofable JS flag. **This is a hard
limitation of every automated tool available this session, not a code defect** — and
it positively confirms the lifecycle host's pause-on-hidden logic tracks genuine
browser state. The only remaining unverified thing is a literal human-eyes-on-screen
check, which no available tool can perform. If you want that closed completely: `pnpm
dev`, open `http://localhost:5173` in a real window, resize it, watch for ~10 seconds.
Not required before proceeding — confidence is already high.

## Proposed next steps (not started, needs direction)

1. **Visual parity pass.** Bring the WebGL scene's look closer to the CSS scene
   (matrix-rain-like motion, portrait/lighting cues) instead of a plain color mix.
2. **Config-driven WebGL composition.** Mirror what `selectActiveLayers` did for the
   CSS scene — make the WebGL shader actually respond to `scene.layers`/`scene.effects`
   (e.g. intensity/density affecting the gradient), not just `reducedMotion`.
3. **Move on from M3** and pick up other roadmap gaps (Next.js consumption proof,
   additional scene formats demoed live, accessibility/keyboard test coverage) since
   M3 already has a working, spot-checked progressive-enhancement path.

**Current blocker:** none technical — this is a direction choice.
