import { defaultScene, selectActiveLayers, selectRenderer, validateScene } from '@reshimu/matrix-ai-ui'

export default function Page() {
  const result = validateScene(defaultScene)
  if (!result.ok) throw new Error(result.issues.join(' '))

  const rendererKind = selectRenderer({ prefersReducedMotion: false, supportsWebGL: true, constrainedDevice: false })
  const activeLayers = selectActiveLayers(result.value)

  return (
    <main>
      <h1>Matrix AI UI — Next.js consumer fixture</h1>
      <p>Scene id: {result.value.id}</p>
      <p>Renderer kind (SSR-computed): {rendererKind}</p>
      <p>Active layers: {activeLayers.map((layer) => layer.id).join(', ')}</p>
    </main>
  )
}
