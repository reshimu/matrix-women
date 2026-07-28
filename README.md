# @matrix-ai/ui

A renderer-independent scene-configuration system for a cinematic "digital human in
light/code" hero visual — portrait, code-rain, particle, and lighting layers, composed
from a single `SceneConfig`. Ships as a small (~2.7 kB) package usable from Vite,
Next.js, or any other React setup.

Full product spec, governance, and build history: [`PROJECT_SPEC.md`](PROJECT_SPEC.md),
[`ROADMAP.md`](ROADMAP.md), [`PROJECT_STATE.md`](PROJECT_STATE.md).

## Install

```bash
pnpm add @matrix-ai/ui
```

Peer dependencies: `react >=18`, `react-dom >=18`.

## What's in the package

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

## What's *not* in the package yet

The package currently ships **configuration, validation, and selection primitives
only** — it does not yet export the actual rendering components (`Scene`,
`SceneFallback`, `SceneWebgl`, `SubjectPortrait`). Those live in `src/components/` in
this repo as a demo/reference implementation (a CSS+SVG fallback renderer and a WebGL
renderer, both driven by the same config via `selectActiveLayers`), but they are not
currently importable via `@matrix-ai/ui` — a consumer wanting the actual visual scene
has to build their own rendering layer on top of `selectActiveLayers`/`selectRenderer`
today, or copy the reference implementation.

Whether/how to expose the rendering components publicly (bundling React components +
CSS + the WebGL shader/texture code) is an open product decision, not yet made — see
`NEXT_TASK.md` for context. Documenting this honestly here rather than implying a
capability that isn't shipped yet.

## Local development (this repo)

```bash
pnpm install       # installs the workspace (root package + fixtures/nextjs-consumer)
pnpm dev           # Vite demo at localhost:5173 — shows hero/portrait/square + a live config-round-trip builder
pnpm typecheck
pnpm lint
pnpm test          # Vitest — unit + jsdom real-DOM/real-browser-environment + accessibility tests
pnpm build         # builds both the demo (dist/) and the library artifact (dist/lib/)
pnpm test:consumer          # proves the built library is importable standalone (plain Node/ESM)
pnpm test:nextjs-consumer   # proves it under a real `next build` (fixtures/nextjs-consumer)
```

This is a pnpm workspace: the root package (`@matrix-ai/ui`) and
`fixtures/nextjs-consumer` (a real Next.js app depending on it via `workspace:*`) are
both workspace members.

### Repo layout

- `src/scene/` — public, browser-free: types, defaults, validation, layer selection, JSON round-trip.
- `src/renderer/` — `selectRenderer` (public, pure) plus WebGL-specific pure helpers (`deriveWebglUniforms`, `computePortraitBox`).
- `src/renderer/browser/` — browser-only renderer lifecycle hosts (CSS + WebGL), isolated from the public entry per the package's own architectural rule (`DECISIONS.md`, ADR-0003).
- `src/components/` — demo-only React components (not exported publicly): the reference CSS/WebGL scene renderers, the digital-woman SVG illustration, and a live config-editing builder used for the round-trip demo.
- `fixtures/` — consumption proofs (plain Node, and a real Next.js app).
