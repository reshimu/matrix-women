import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Scene } from './components/Scene'
import { defaultScene } from './scene'
import './styles.css'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <Scene scene={{ ...defaultScene, reducedMotion: reduceMotion }} />
    </main>
  </StrictMode>,
)
