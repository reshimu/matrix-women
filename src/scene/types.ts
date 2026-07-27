export type SceneFormat = 'hero' | 'portrait' | 'square'

export type SceneLayer =
  | Readonly<{ id: string; type: 'portrait'; opacity: number }>
  | Readonly<{ id: string; type: 'code-rain'; opacity: number; density: number }>
  | Readonly<{ id: string; type: 'particles'; opacity: number; count: number }>
  | Readonly<{ id: string; type: 'lighting'; opacity: number; intensity: number }>

export type SceneConfig = Readonly<{
  id: string
  format: SceneFormat
  title: string
  eyebrow: string
  reducedMotion: boolean
  effects: Readonly<{
    codeRain: boolean
    particles: boolean
    glow: boolean
  }>
  layers: readonly SceneLayer[]
}>

export type SceneInput = Partial<Omit<SceneConfig, 'effects'>> & {
  effects?: Partial<SceneConfig['effects']>
}

export const defaultScene: SceneConfig = {
  id: 'matrix-serenity',
  format: 'hero',
  title: 'Human presence, luminous intelligence.',
  eyebrow: 'Matrix AI UI / scene system',
  reducedMotion: false,
  effects: { codeRain: true, particles: true, glow: true },
  layers: [
    { id: 'subject', type: 'portrait', opacity: 1 },
    { id: 'matrix-rain', type: 'code-rain', opacity: 0.38, density: 0.4 },
    { id: 'ambient-light', type: 'lighting', opacity: 0.6, intensity: 0.7 },
  ],
}

export function normalizeScene(input: SceneInput): SceneConfig {
  return {
    ...defaultScene,
    ...input,
    effects: { ...defaultScene.effects, ...input.effects },
  }
}