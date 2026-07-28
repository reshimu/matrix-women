# Next atomic task

The digital-woman subject now has a real hand-authored SVG illustration
(`src/components/SubjectPortrait.tsx`) instead of placeholder CSS blob shapes —
faceless/symbolic, dignified, ethereal, matching `AGENTS.md`'s visual requirements.
M3's WebGL path and the Next.js consumption proof were completed just before this.
Full evidence in `PROJECT_STATE.md`/`ROADMAP.md`.

## Proposed next steps (not started, needs direction)

1. **Iterate further on the illustration.** The current design is a first pass,
   verified to look coherent (not the earlier "snowman" failure) but not extensively
   refined — proportions, hair detail, halo styling, and the `portrait`/`square`
   format crops could all use another look now that the base shape works.
2. **Bring the WebGL scene to visual parity.** `SceneWebgl` still renders an abstract
   gradient/glow/sparkle, nothing like this new illustrated figure. Could port the
   silhouette as an SVG texture, or design a from-scratch WebGL equivalent.
3. **Demo the other scene formats live.** `portrait`/`square` are proven correct via
   computed-style checks but nobody has seen the new illustration inside those crops
   in the running demo — only `hero` is ever mounted in `main.tsx`.
4. **Start M4 (responsive builder + config round-trip + documented public API).**

## Known tooling limitation (worth fixing before more visual work)

This session's screenshot tools were unusable: the sandboxed browser pane doesn't
composite frames, and Claude in Chrome's automated tab has a genuine `0×0` viewport
(confirmed — `resize_window` failed with "bounds must be at least 50% within visible
screen space"). The workaround (rasterize SVG via `npx resvg-cli`, read the PNG) only
works for static SVG content — it can't verify animation, WebGL canvas output, or
real interaction. If more visual/WebGL work is planned, worth checking whether a
properly-visible browser window is available another way before relying on
screenshots again.

**Current blocker:** none technical — next step is a direction choice.
