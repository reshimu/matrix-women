# @matrix-ai/ui

A renderer-independent scene-configuration system for a cinematic "digital human in
light/code" hero visual — portrait, code-rain, particle, and lighting layers, composed
from a single `SceneConfig`. Ships as a small (~2.3 kB) config/validation core, plus an
opt-in React rendering layer, both usable from Vite, Next.js, or any other React setup.

Full product spec, governance, and build history: [`PROJECT_SPEC.md`](PROJECT_SPEC.md),
[`ROADMAP.md`](ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md),
[`RISK_PERFORMANCE_AUDIT.md`](RISK_PERFORMANCE_AUDIT.md).

## Install

```bash
pnpm add @matrix-ai/ui
```

Peer dependencies: `react >=18`, `react-dom >=18`.

## Two entry points

| Entry | What it is | DOM/CSS dependency |
| --- | --- | --- |
| `@matrix-ai/ui` | Config, validation, and renderer-selection primitives. | None — safe in a plain Node script or a React Server Component. |
| `@matrix-ai/ui/react` | The actual rendering components. | Requires the DOM (client-rendered); ships its own `'use client'` directive for Next.js App Router. Needs `@matrix-ai/ui/react.css` imported once. |

This split is deliberate — see `DECISIONS.md` ADR-0003/ADR-0004. You can use just the
config layer and build your own renderer, or use the shipped rendering components
directly.

## `@matrix-ai/ui` — config, validation, selection

The public entry (`src/index.ts`) is deliberately **renderer-independent and
browser-free** — it has zero DOM/`window` dependencies, so it's safe to import in a
React Server Component or any other server-rendered context (verified against a real
Next.js `next build`; see `fixtures/nextjs-consumer/`).

```ts
import {
  defaultScene,
  normalizeScene,
  validateScene,
  selectActiveLayers,
  selectRenderer,
  exportSceneConfig,
  importSceneConfig,
} from '@matrix-ai/ui'
import type {
  SceneConfig,
  SceneFormat,
  SceneInput,
  SceneLayer,
  SceneValidationResult,
  RendererCapabilities,
  RendererKind,
} from '@matrix-ai/ui'
```

| Export | What it does |
| --- | --- |
| `defaultScene` | A complete, valid `SceneConfig` — the reference scene used throughout this repo's demo. |
| `normalizeScene(input: SceneInput): SceneConfig` | Fills in any missing fields of a partial scene config against `defaultScene`. |
| `validateScene(input: SceneInput): SceneValidationResult` | Normalizes and validates a scene config, returning `{ ok: true, value }` or `{ ok: false, issues }`. |
| `selectActiveLayers(scene: SceneConfig): readonly SceneLayer[]` | Filters `scene.layers` by the matching `scene.effects` flag (`code-rain`→`codeRain`, `particles`→`particles`, `lighting`→`glow`; `portrait` is always active). This is what makes rendering config-driven — a renderer should only draw what this returns. |
| `selectRenderer(capabilities: RendererCapabilities): RendererKind` | Pure decision function: `'css'` or `'webgl'`, given `prefersReducedMotion`, `supportsWebGL`, and `constrainedDevice`. |
| `exportSceneConfig(scene: SceneConfig): string` | Serializes a scene to pretty-printed JSON. |
| `importSceneConfig(json: string): SceneValidationResult` | Parses and validates JSON back into a `SceneConfig`. Never throws — parse/shape errors surface as validation issues. |

### `SceneConfig` shape

```ts
type SceneFormat = 'hero' | 'portrait' | 'square'

type SceneLayer =
  | { id: string; type: 'portrait'; opacity: number }
  | { id: string; type: 'code-rain'; opacity: number; density: number }
  | { id: string; type: 'particles'; opacity: number; count: number }
  | { id: string; type: 'lighting'; opacity: number; intensity: number }

type SceneConfig = {
  id: string
  format: SceneFormat
  title: string
  eyebrow: string
  reducedMotion: boolean
  effects: { codeRain: boolean; particles: boolean; glow: boolean }
  layers: readonly SceneLayer[]
}
```

## `@matrix-ai/ui/react` — the rendering components

```ts
import { Scene, SceneFallback, SceneWebgl, SubjectPortrait } from '@matrix-ai/ui/react'
import '@matrix-ai/ui/react.css'
```

| Export | What it does |
| --- | --- |
| `Scene` | The component most consumers want. Detects `prefersReducedMotion`/WebGL support/constrained-device at mount and renders `SceneWebgl` or `SceneFallback` accordingly (via `selectRenderer`). |
| `SceneFallback` | The dependable CSS + SVG scene — matrix-rain columns, particles, lighting aura, and the `SubjectPortrait` illustration, all driven by `scene.layers`/`scene.effects`. Works everywhere, no WebGL required. |
| `SceneWebgl` | The WebGL-enhanced scene — a config-driven shader (background gradient, procedural rain, glow, sparkle) with the same portrait illustration rasterized onto a texture and composited in. |
| `SubjectPortrait` | Just the digital-woman SVG illustration on its own, if you want to reuse it outside a full scene. Pure presentational — no hooks, works as a Server Component too. |

**You must import `@matrix-ai/ui/react.css` once** (e.g., in your root layout) for
these components to be styled — it isn't injected automatically, matching the
standard "consumer imports the stylesheet" pattern most component libraries use.

**Next.js App Router:** `Scene`, `SceneFallback`, and `SceneWebgl` ship a `'use client'`
directive (see `dist/lib/react.js`), so a Server Component can import and render them
directly without needing its own `'use client'` — verified against a real `next build`
(`fixtures/nextjs-consumer/app/react/page.tsx`).

**Not exported:** `SceneBuilder` and `DemoFormats` (this repo's dev-tooling/demo
components — a live config-editing control panel and a hero/portrait/square gallery)
stay internal to this repo. They're reference implementations for building your own
tooling, not shipped as part of the package.

## Local development (this repo)

```bash
pnpm install       # installs the workspace (root package + fixtures/nextjs-consumer)
pnpm dev           # Vite demo at localhost:5173 — shows hero/portrait/square + a live config-round-trip builder
pnpm typecheck
pnpm lint
pnpm test          # Vitest — unit + jsdom real-DOM/real-browser-environment + accessibility tests
pnpm build         # builds both the demo (dist/) and the library artifact (dist/lib/)
pnpm test:consumer         # proves @matrix-ai/ui is importable standalone (plain Node/ESM)
pnpm test:react-consumer   # proves @matrix-ai/ui/react is importable standalone and SSRs via react-dom/server
pnpm test:nextjs-consumer  # proves both entries under a real `next build` (fixtures/nextjs-consumer)
```

This is a pnpm workspace: the root package (`@matrix-ai/ui`) and
`fixtures/nextjs-consumer` (a real Next.js app depending on it via `workspace:*`) are
both workspace members.

### Repo layout

- `src/scene/` — public, browser-free: types, defaults, validation, layer selection, JSON round-trip.
- `src/renderer/` — `selectRenderer` (public, pure) plus WebGL-specific pure helpers (`deriveWebglUniforms`, `computePortraitBox`).
- `src/renderer/browser/` — browser-only renderer lifecycle hosts (CSS + WebGL) and the portrait Canvas2D→WebGL texture painter; internal implementation detail of the `@matrix-ai/ui/react` components, not exported directly.
- `src/components/` — `Scene.tsx`, `SceneFallback.tsx`, `SceneWebgl.tsx`, `SubjectPortrait.tsx` are exported publicly via `@matrix-ai/ui/react`; `SceneBuilder.tsx` and `DemoFormats.tsx` are this repo's own dev tooling and stay internal.
- `fixtures/` — consumption proofs: a plain-Node script for each entry, and a real Next.js app exercising both.
