import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SceneFallback } from './components/SceneFallback'
import { defaultScene } from './scene'
import './styles.css'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <SceneFallback scene={{ ...defaultScene, reducedMotion: reduceMotion }} />
    </main>
  </StrictMode>,
)
