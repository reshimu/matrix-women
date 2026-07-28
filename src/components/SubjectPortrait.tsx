const HAIR_PATH = `M200,58
  C246,60 280,92 288,145
  C292,178 288,208 284,238
  C290,268 302,296 308,326
  C314,356 316,388 308,418
  C300,448 286,472 268,494
  L200,494
  Z`

const FIGURE_PATH = `M200,50
  C235,50 258,80 262,125
  C266,155 258,180 248,190
  C242,198 232,208 225,215
  C220,222 224,238 228,250
  C234,270 260,290 290,310
  C320,330 335,355 340,380
  C345,420 348,460 350,500
  L200,500
  Z`

const STRAND_PATHS = [
  { d: 'M272,110 C280,150 274,195 278,235 C282,275 298,305 300,345', width: 1.6, opacity: 0.4 },
  { d: 'M284,135 C290,170 286,205 289,240 C292,275 303,300 304,330', width: 1.1, opacity: 0.3 },
]

const MIRROR_TRANSFORM = 'translate(400,0) scale(-1,1)'

export function SubjectPortrait() {
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax meet" role="presentation">
      <defs>
        <radialGradient id="figure-halo" cx="50%" cy="34%" r="50%">
          <stop offset="0%" stopColor="#bffef0" stopOpacity="0.32" />
          <stop offset="70%" stopColor="#8cf9d3" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#8cf9d3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="figure-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d9fff5" />
          <stop offset="30%" stopColor="#7fd6bd" />
          <stop offset="65%" stopColor="#2f7a6d" />
          <stop offset="100%" stopColor="#0c2a29" />
        </linearGradient>
        <linearGradient id="hair-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f3d3a" />
          <stop offset="55%" stopColor="#0b2f2d" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0b2f2d" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="strand-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a7f9e2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a7f9e2" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle className="subject__halo-glow" cx="200" cy="170" r="215" fill="url(#figure-halo)" />
      <ellipse
        className="subject__halo-ring"
        cx="200"
        cy="130"
        rx="105"
        ry="118"
        fill="none"
        stroke="#a7f9e245"
        strokeWidth="1.5"
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
        d="M200,72 C188,110 188,155 200,192"
        fill="none"
        stroke="#eafffb"
        strokeOpacity="0.26"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
