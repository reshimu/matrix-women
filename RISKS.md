# Risks

**Superseded 2026-07-28** by [`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md),
which consolidates and re-verifies these against current code (R-001 through R-003
below are now resolved/downgraded — see that document's §4 for the current register,
including newer items this file predates). Kept here for historical record of the
original M0 risk assessment.

| ID | Severity | Risk | Mitigation / owner | State |
| --- | --- | --- | --- | --- |
| R-001 | Medium | No legacy prototype exists; original baseline behavior and API cannot be recovered. | Greenfield authorization is recorded; maintain objective acceptance evidence for all new behavior. | Resolved — see audit R-001 |
| R-002 | Medium | Greenfield scaffolding could contradict an unprovided visual system, assets, or dependency choices. | Require explicit greenfield authorization if source cannot be supplied. | Resolved — see audit R-002 |
| R-003 | Medium | External or unlicensed artwork could violate the directive. | Use authored procedural/CSS/SVG defaults until asset provenance is established. | Resolved — see audit R-003 |
