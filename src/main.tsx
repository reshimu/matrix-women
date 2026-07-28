import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DemoFormats } from './components/DemoFormats'
import './styles.css'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <DemoFormats reducedMotion={reduceMotion} />
    </main>
  </StrictMode>,
)
