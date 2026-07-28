# Next atomic task

PR #1 (`webgl-portrait-texture`) merged to `main`. A follow-up WebGL visual parity
pass then landed: the WebGL scene's background gradient, aura/glow position, and
code-rain effect now match the CSS scene's actual design instead of an unrelated
abstract vocabulary, live-verified via pixel scans. A real robustness bug was found
and fixed along the way — config changes now repaint immediately regardless of
animation state, not just on the next (possibly-never-arriving) animation frame.
Full evidence in `PROJECT_STATE.md`/`ROADMAP.md`.

## Proposed next steps (not started, needs direction)

1. **Decide on public component exports.** `@matrix-ai/ui` still ships only
   config/validation/selection primitives — the rendering components are demo-only.
   Decide whether/how to export `Scene`/`SceneFallback`/`SceneWebgl` publicly (affects
   bundling of CSS, the WebGL shader/texture code, and API surface design).
2. **Full M4 responsive builder scope.** The round-trip minimum (`SceneBuilder.tsx`)
   is done; a real drag/drop, multi-scene-management builder is substantially larger.
3. **Consolidated risk/performance audit.** Evidence exists piecemeal across
   `PROJECT_STATE.md`/`RISKS.md`; synthesizing it into one document would close the
   last open release gate.
4. **Further WebGL polish**, if desired — the rain effect is a reasonable
   approximation (hashed flickering glyph cells) rather than a literal recreation of
   the CSS scene's falling-text columns; could go further if warranted.

**Current blocker:** none technical — this is a direction choice, not a technical
gate.
