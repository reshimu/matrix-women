export const PORTRAIT_VIEWBOX = { width: 400, height: 500 } as const

export const HAIR_PATH = `M200,58
  C246,60 280,92 288,145
  C292,178 288,208 284,238
  C290,268 302,296 308,326
  C314,356 316,388 308,418
  C300,448 286,472 268,494
  L200,494
  Z`

export const FIGURE_PATH = `M200,50
  C235,50 258,80 262,125
  C266,155 258,180 248,190
  C242,198 232,208 225,215
  C220,222 224,238 228,250
  C234,270 260,290 290,310
  C320,330 335,355 340,380
  C345,420 348,460 350,500
  L200,500
  Z`

export const HIGHLIGHT_PATH = 'M200,72 C188,110 188,155 200,192'

export type ColorStop = Readonly<{ offset: number; color: string; opacity?: number }>

export const STRAND_PATHS: readonly Readonly<{ d: string; width: number; opacity: number }>[] = [
  { d: 'M272,110 C280,150 274,195 278,235 C282,275 298,305 300,345', width: 1.6, opacity: 0.4 },
  { d: 'M284,135 C290,170 286,205 289,240 C292,275 303,300 304,330', width: 1.1, opacity: 0.3 },
]

export const HALO_GLOW = { cx: 200, cy: 170, r: 215 } as const
export const HALO_RING = { cx: 200, cy: 130, rx: 105, ry: 118, stroke: '#a7f9e2', strokeOpacity: 0.27, strokeWidth: 1.5 } as const

export const HALO_GLOW_STOPS: readonly ColorStop[] = [
  { offset: 0, color: '#bffef0', opacity: 0.32 },
  { offset: 0.7, color: '#8cf9d3', opacity: 0.05 },
  { offset: 1, color: '#8cf9d3', opacity: 0 },
]

export const FIGURE_GRADIENT_STOPS: readonly ColorStop[] = [
  { offset: 0, color: '#d9fff5' },
  { offset: 0.3, color: '#7fd6bd' },
  { offset: 0.65, color: '#2f7a6d' },
  { offset: 1, color: '#0c2a29' },
]

export const HAIR_GRADIENT_STOPS: readonly ColorStop[] = [
  { offset: 0, color: '#0f3d3a' },
  { offset: 0.55, color: '#0b2f2d', opacity: 0.85 },
  { offset: 1, color: '#0b2f2d', opacity: 0 },
]

export const STRAND_GRADIENT_STOPS: readonly ColorStop[] = [
  { offset: 0, color: '#a7f9e2', opacity: 0.8 },
  { offset: 1, color: '#a7f9e2', opacity: 0 },
]

export const HIGHLIGHT_STROKE = { color: '#eafffb', opacity: 0.26, width: 2 } as const
