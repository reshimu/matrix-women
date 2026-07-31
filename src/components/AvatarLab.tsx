import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { MatrixAvatar } from './MatrixAvatar'

type AvatarLabProps = { reducedMotion: boolean }

type LoadedSource = {
  media: CanvasImageSource
  objectUrl: string
  video: HTMLVideoElement | null
  label: string
}

/**
 * Demo-only surface for the glyph-hologram avatar: shows the default subject and
 * accepts a local image or video (dropped or browsed) as the luminance source.
 * Files never leave the browser — object URL in, revoked on replace/unmount.
 */
export function AvatarLab({ reducedMotion }: AvatarLabProps) {
  const [loaded, setLoaded] = useState<LoadedSource | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const loadedRef = useRef<LoadedSource | null>(null)

  const releaseLoaded = useCallback(() => {
    const current = loadedRef.current
    if (!current) return
    current.video?.pause()
    if (current.video) current.video.src = ''
    URL.revokeObjectURL(current.objectUrl)
    loadedRef.current = null
  }, [])

  useEffect(() => () => releaseLoaded(), [releaseLoaded])

  const acceptFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError(`"${file.name}" is not an image or a video.`)
        return
      }
      const objectUrl = URL.createObjectURL(file)

      if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.muted = true
        video.loop = true
        video.playsInline = true
        video.src = objectUrl
        video.addEventListener('loadeddata', () => {
          releaseLoaded()
          const next = { media: video, objectUrl, video, label: file.name }
          loadedRef.current = next
          setLoaded(next)
          void video.play()
        })
        video.addEventListener('error', () => {
          URL.revokeObjectURL(objectUrl)
          setError(`Could not decode "${file.name}" as a video.`)
        })
        return
      }

      const image = new Image()
      image.onload = () => {
        releaseLoaded()
        const next = { media: image, objectUrl, video: null, label: file.name }
        loadedRef.current = next
        setLoaded(next)
      }
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        setError(`Could not decode "${file.name}" as an image.`)
      }
      image.src = objectUrl
    },
    [releaseLoaded],
  )

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragOver(false)
      const file = event.dataTransfer.files.item(0)
      if (file) acceptFile(file)
    },
    [acceptFile],
  )

  const onBrowse = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0)
      if (file) acceptFile(file)
      event.target.value = ''
    },
    [acceptFile],
  )

  const resetToDefault = useCallback(() => {
    releaseLoaded()
    setLoaded(null)
    setError(null)
  }, [releaseLoaded])

  return (
    <section className="avatar-lab" aria-label="Avatar lab">
      <p className="demo-format__label">Avatar lab — glyph hologram</p>
      <div
        className={`avatar-lab__stage${isDragOver ? ' avatar-lab__stage--drag' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
      >
        <MatrixAvatar source={loaded?.media ?? null} reducedMotion={reducedMotion} />
      </div>
      <div className="avatar-lab__controls">
        <label className="avatar-lab__file">
          Use my image or video
          <input type="file" accept="image/*,video/*" onChange={onBrowse} />
        </label>
        <button type="button" onClick={resetToDefault} disabled={!loaded}>
          Back to default subject
        </button>
        <p className="avatar-lab__hint">
          {loaded ? `Source: ${loaded.label}` : 'Drop any portrait image or video onto the stage — it stays on this machine.'}
        </p>
      </div>
      {error && (
        <p className="avatar-lab__error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
