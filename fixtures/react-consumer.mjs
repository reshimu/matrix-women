import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultScene } from '@reshimu/matrix-ai-ui'
import { MatrixAvatar, Scene, SceneFallback, SubjectPortrait } from '@reshimu/matrix-ai-ui/react'

const fallbackHtml = renderToStaticMarkup(createElement(SceneFallback, { scene: defaultScene }))
if (!fallbackHtml.includes(defaultScene.title)) {
  throw new Error('Expected SceneFallback SSR output to include the scene title.')
}
if (!fallbackHtml.includes('<canvas')) {
  throw new Error('Expected SceneFallback SSR output to include the glyph-avatar canvas subject.')
}

const portraitHtml = renderToStaticMarkup(createElement(SubjectPortrait))
if (!portraitHtml.includes('<svg')) {
  throw new Error('Expected SubjectPortrait to render an SVG on its own.')
}

// MatrixAvatar must be SSR-safe: a canvas shell server-side, all drawing in effects.
const avatarHtml = renderToStaticMarkup(createElement(MatrixAvatar))
if (!avatarHtml.includes('<canvas')) {
  throw new Error('Expected MatrixAvatar SSR output to render its canvas shell.')
}

// Scene picks a renderer via browser feature detection (window/canvas), which does
// not exist under plain Node — it must not throw even without a DOM.
const sceneHtml = renderToStaticMarkup(createElement(Scene, { scene: defaultScene }))
if (!sceneHtml.includes(defaultScene.title)) {
  throw new Error('Expected Scene SSR output to include the scene title.')
}

console.log(`React consumer passed: SceneFallback (${fallbackHtml.length} chars), SubjectPortrait (${portraitHtml.length} chars), MatrixAvatar (${avatarHtml.length} chars), Scene (${sceneHtml.length} chars).`)
