# Matrix AI UI operating instructions

## Authority and scope

Follow this order when requirements conflict: explicit user direction, `PROJECT_SPEC.md`, `ACCEPTANCE_CRITERIA.md`, accepted records in `DECISIONS.md`, `ROADMAP.md`, `NEXT_TASK.md`, then existing implementation.

Matrix AI UI is a React and TypeScript visual-effects system. Use Tailwind CSS and Vite for its builder/demo. The library must remain independently importable and renderer-independent at the public scene-config boundary. WebGL is optional enhancement; a Canvas, SVG, or CSS fallback is required.

## Work-slice loop

1. Read `PROJECT_STATE.md`, `NEXT_TASK.md`, and applicable decisions.
2. Inspect the implementation before changing it.
3. Deliver one atomic change with proportional tests and validation.
4. Inspect visual changes at the stated viewports.
5. Update the state, risk, changelog, and next-task records with evidence.
6. Commit a coherent slice when a Git repository is available.

Do not bypass type, lint, test, accessibility, lifecycle, fallback, or reduced-motion checks to obtain a passing result. Do not add a server, accounts, storage, payments, analytics, databases, or unrelated features.

## Visual and safety requirements

The default digital-woman subject must be serene, intelligent, dignified, feminine, ethereal, symbolic, and non-sexualized. Use only licensable/repo-owned assets; defaults must not depend on an external image service. Support 320px onward, keyboard access, reduced motion, hidden-document/offscreen pausing, and deterministic cleanup of observers, listeners, animation frames, and rendering resources.
