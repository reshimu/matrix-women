import {
  FIGURE_GRADIENT_STOPS,
  FIGURE_PATH,
  HAIR_GRADIENT_STOPS,
  HAIR_PATH,
  HALO_GLOW,
  HALO_GLOW_STOPS,
  HALO_RING,
  HIGHLIGHT_PATH,
  HIGHLIGHT_STROKE,
  STRAND_GRADIENT_STOPS,
  STRAND_PATHS,
} from '../scene/portraitArt'

const MIRROR_TRANSFORM = 'translate(400,0) scale(-1,1)'

export function SubjectPortrait() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax meet" role="presentation">
      <defs>
        <radialGradient id="figure-halo" cx="50%" cy="34%" r="50%">
          {HALO_GLOW_STOPS.map((stop) => (
            <stop key={stop.offset} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />
          ))}
        </radialGradient>
        <linearGradient id="figure-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          {FIGURE_GRADIENT_STOPS.map((stop) => (
            <stop key={stop.offset} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />
          ))}
        </linearGradient>
        <linearGradient id="hair-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          {HAIR_GRADIENT_STOPS.map((stop) => (
            <stop key={stop.offset} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />
          ))}
        </linearGradient>
        <linearGradient id="strand-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          {STRAND_GRADIENT_STOPS.map((stop) => (
            <stop key={stop.offset} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />
          ))}
        </linearGradient>
      </defs>

      <circle className="subject__halo-glow" cx={HALO_GLOW.cx} cy={HALO_GLOW.cy} r={HALO_GLOW.r} fill="url(#figure-halo)" />
      <ellipse
        className="subject__halo-ring"
        cx={HALO_RING.cx}
        cy={HALO_RING.cy}
        rx={HALO_RING.rx}
        ry={HALO_RING.ry}
        fill="none"
        stroke={HALO_RING.stroke}
        strokeOpacity={HALO_RING.strokeOpacity}
        strokeWidth={HALO_RING.strokeWidth}
      />

      <path className="subject__hair" fill="url(#hair-fill)" d={HAIR_PATH} />
      <path className="subject__hair" fill="url(#hair-fill)" d={HAIR_PATH} transform={MIRROR_TRANSFORM} />

      <path className="subject__figure" fill="url(#figure-fill)" d={FIGURE_PATH} />
      <path className="subject__figure" fill="url(#figure-fill)" d={FIGURE_PATH} transform={MIRROR_TRANSFORM} />

      {STRAND_PATHS.map((strand) => (
        <path
          key={strand.d}
          d={strand.d}
          fill="none"
          stroke="url(#strand-fill)"
          strokeWidth={strand.width}
          strokeLinecap="round"
          opacity={strand.opacity}
        />
      ))}
      {STRAND_PATHS.map((strand) => (
        <path
          key={`${strand.d}-mirror`}
          d={strand.d}
          fill="none"
          stroke="url(#strand-fill)"
          strokeWidth={strand.width}
          strokeLinecap="round"
          opacity={strand.opacity}
          transform={MIRROR_TRANSFORM}
        />
      ))}

      <path
        className="subject__highlight"
        d={HIGHLIGHT_PATH}
        fill="none"
        stroke={HIGHLIGHT_STROKE.color}
        strokeOpacity={HIGHLIGHT_STROKE.opacity}
        strokeWidth={HIGHLIGHT_STROKE.width}
        strokeLinecap="round"
      />
    </svg>
  )
}
