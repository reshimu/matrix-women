import { defaultScene, selectRenderer, validateScene } from '@reshimu/matrix-ai-ui'

const result = validateScene(defaultScene)
if (!result.ok) throw new Error(result.issues.join(' '))
if (selectRenderer({ prefersReducedMotion: true, supportsWebGL: true, constrainedDevice: false }) !== 'css') {
  throw new Error('Expected the importable library to select CSS fallback.')
}
console.log(`Library consumer passed for ${result.value.id}.`)