import { Scene } from './Scene'
import { defaultScene } from '../scene'
import type { SceneFormat } from '../scene'

const DEMO_FORMATS: readonly SceneFormat[] = ['hero', 'portrait', 'square']

type DemoFormatsProps = { reducedMotion: boolean }

export function DemoFormats({ reducedMotion }: DemoFormatsProps) {
  return (
    <>
      {DEMO_FORMATS.map((format) => (
        <div key={format} className="demo-format">
          <p className="demo-format__label">Format: {format}</p>
          <Scene scene={{ ...defaultScene, format, reducedMotion }} />
        </div>
      ))}
    </>
  )
}
