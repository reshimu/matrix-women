# Next atomic task

CI now exists (`.github/workflows/ci.yml` — there was none before this) and enforces
a bundle-size performance budget (`scripts/check-bundle-size.mjs`,
`pnpm check:bundle-size`) on every push/PR, running the exact validation sequence
every session has been running by hand: typecheck → lint → test → build → all three
consumer fixtures → bundle-size check. This resolves audit R-005 — the last
Medium-severity item in `RISK_PERFORMANCE_AUDIT.md`. Full evidence in
`PROJECT_STATE.md`/`ROADMAP.md`.

## Proposed next steps (not started, needs direction)

Every Medium-or-higher risk is now resolved and every release gate is checked.
Remaining items are Low/Informational and purely optional:

1. **Full M4 responsive builder** (audit R-009) — `SceneBuilder.tsx` satisfies the
   round-trip release gate; a real drag/drop multi-scene builder is a much larger,
   separate scope.
2. **Visual regression tooling** (audit R-007) — would close the "no automated
   real-browser animation verification" gap properly, if this moves toward an
   actual release.
3. **Consider publishing to npm** — the package has a real, documented, CI-validated,
   size-budgeted public API surface now. Not started; versioning/registry-auth/semver
   policy worth discussing explicitly before doing.
4. **Canvas-based particle rendering** (audit R-004) — only if real usage approaches
   the 200-particle validation ceiling on low-end hardware; not needed today.

**Current blocker:** none technical — these are all optional next steps, not gates.
The system is production-ready, CI-enforced, and has no known unresolved defect above
Low severity.
