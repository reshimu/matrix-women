# Spec: Matrix glyph-hologram avatar

## Problem

The scene's "digital woman" is two mirrored abstract SVG paths. It has no face, no
recognizable human presence, and no motion of its own — the owner's verdict is that it
reads as a static blob. The target look (owner-supplied video reference, X post
2081136328004063352) is: a serene woman rendered as a luminous green hologram whose
skin and hair are formed from tiny code glyphs, with code-rain streaming both behind
and in front of her, a dark city skyline in the distance, and continuous life —
glyph churn, brightness waves, breathing.

## Approach

A source-agnostic, canvas-2D glyph-field renderer:

1. **Luminance sampling** — any `CanvasImageSource` (image, video, offscreen canvas)
   is cover-fitted and downsampled into a `cols × rows` luminance grid every frame
   (videos) or on change (static sources).
2. **Glyph field** — each grid cell whose luminance clears a floor draws one glyph
   from a pre-rendered atlas (charset × brightness tiers). Cell brightness =
   luminance × breathing × traveling wave + Sobel edge boost, so silhouette contours
   burn white-hot like the reference. Cells stochastically swap glyphs (~4%/frame).
3. **Rain + backdrop** — dim dense rain behind the figure, sparse bright-headed rain
   in front, procedural skyline (repo-owned, painted once per resize) at the back.
4. **Default subject** — `paintDefaultPortrait` sculpts a serene, dignified,
   non-sexualized head-and-shoulders woman (eyes closed) from canvas gradients:
   repo-owned art, no external image service (AGENTS.md requirement).
5. **Own your source** — the demo's Avatar Lab accepts a dropped/browsed local image
   or video (object URL, never uploaded, never committed); a video source is
   luminance-sampled per frame, i.e. the reference video itself can drive the avatar
   pixel-for-pixel on the owner's machine without its frames entering the repo.

## Integration

- `MatrixAvatar` replaces `SubjectPortrait` as the hero subject in BOTH renderers:
  directly in `SceneFallback`'s portrait layer; as a positioned overlay in
  `SceneWebgl` (which stops drawing its portrait texture — WebGL keeps background
  rain/aura/sparkle shaders). `SubjectPortrait` stays exported for consumers.
- Exported publicly via `@reshimu/matrix-ai-ui/react`. If `react.js` passes its
  30 KB budget, the budget is raised in the same PR with the measured number.

## Lifecycle / a11y (AGENTS.md invariants)

- Reuses `createCssRendererHost`: pauses on hidden document / offscreen, resumes on
  return; deterministic teardown of rAF, observers, object URLs, video elements.
- `reducedMotion` renders one static glyph frame — no churn, no rain motion.
- Canvas is `aria-hidden`; the Avatar Lab controls are keyboard-reachable inputs.
- DPR capped at 2; grid resolution bounded so cell count stays ≤ ~5k.

## Non-goals

- No audio reactivity in this slice (voice-drivers tie-in is a natural follow-up).
- No committed photographic assets; no external image/CDN dependency.
- No server; dropped media never leaves the browser.
