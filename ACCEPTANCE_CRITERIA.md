# Acceptance criteria

## M0 — baseline and governance

- [x] Repository inventory identified no pre-existing source, dependencies, scripts, tests, or assets; greenfield authorization recorded.
- [x] Greenfield application installs and runs using documented commands.
- [x] Greenfield fallback baseline recorded at 1440×900 and 320×700; reduced-motion CSS behavior is present.
- [x] Governance documents exist and contain factual project state.
- [x] Baseline risks, architectural debt, and exact next task are recorded with evidence.

## Release gates

- [ ] Typecheck and lint pass.
- [ ] Relevant unit, schema/migration, lifecycle, browser, visual, responsive, reduced-motion, keyboard, asset-failure, fallback, context-loss, and stability tests pass.
- [ ] Visual output is inspected at required breakpoints.
- [ ] Builder round-trips scene configuration and package is independently consumable in Vite and Next.js.
- [ ] Fallback, accessibility, performance evidence, risks, API documentation, and clean-install results are recorded.
- [ ] No unresolved critical or high-severity defect remains.

## M1 — package and schema foundation

- [x] Vite builder/demo runs with React, TypeScript, and Tailwind.
- [x] Public scene configuration is renderer-independent and has deterministic validation coverage.
- [x] CSS fallback selection is pure and tested for reduced-motion, constrained-device, and missing-WebGL cases.
- [x] A separately emitted ES library artifact is consumable through the package name without importing demo code.