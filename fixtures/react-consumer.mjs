import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultScene } from '@reshimu/matrix-ai-ui'
import { Scene, SceneFallback, SubjectPortrait } from '@reshimu/matrix-ai-ui/react'

const fallbackHtml = renderToStaticMarkup(createElement(SceneFallback, { scene: defaultScene }))
if (!fallbackHtml.includes(defaultScene.title)) {
  throw new Error('Expected SceneFallback SSR output to include the scene title.')
}
if (!fallbackHtml.includes('<svg')) {
  throw new Error('Expected SceneFallback SSR output to include the portrait SVG illustration.')
}

const portraitHtml = renderToStaticMarkup(createElement(SubjectPortrait))
if (!portraitHtml.includes('<svg')) {
  throw new Error('Expected SubjectPortrait to render an SVG on its own.')
}

// Scene picks a renderer via browser feature detection (window/canvas), which does
// not exist under plain Node — it must not throw even without a DOM.
const sceneHtml = renderToStaticMarkup(createElement(Scene, { scene: defaultScene }))
if (!sceneHtml.includes(defaultScene.title)) {
  throw new Error('Expected Scene SSR output to include the scene title.')
}

console.log(`React consumer passed: SceneFallback (${fallbackHtml.length} chars), SubjectPortrait (${portraitHtml.length} chars), Scene (${sceneHtml.length} chars).`)
