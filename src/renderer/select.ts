export type RendererKind = 'css' | 'webgl'

export type RendererCapabilities = Readonly<{
  prefersReducedMotion: boolean
  supportsWebGL: boolean
  constrainedDevice: boolean
}>

export function selectRenderer(capabilities: RendererCapabilities): RendererKind {
  if (capabilities.prefersReducedMotion || capabilities.constrainedDevice || !capabilities.supportsWebGL) return 'css'
  return 'webgl'
}