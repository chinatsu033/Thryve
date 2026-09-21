import { useMemo } from 'react'

type Props = {
  /** Mood 1–100; numeric value must not be shown in UI. */
  mood: number
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function LakeMoodScene({ mood }: Props) {
  const t = clamp01((mood - 1) / 99) // 0 = 低谷, 1 = 盛放
  const storm = clamp01(1 - t * 2) // strong when mood low
  const bright = clamp01((t - 0.45) / 0.55)
  const ducks = t > 0.82

  const skyTop = useMemo(() => {
    // storm gray → mild blue → bright azure
    const r = Math.round(90 + (135 - 90) * t + (175 - 135) * bright)
    const g = Math.round(100 + (175 - 100) * t + (220 - 175) * bright)
    const b = Math.round(120 + (220 - 120) * t + (255 - 220) * bright)
    return `rgb(${r},${g},${b})`
  }, [t, bright])

  const skyBot = useMemo(() => {
    const r = Math.round(140 + (190 - 140) * t)
    const g = Math.round(150 + (210 - 150) * t)
    const b = Math.round(165 + (235 - 165) * t)
    return `rgb(${r},${g},${b})`
  }, [t])

  const lakeA = useMemo(() => {
    const r = Math.round(70 + (90 - 70) * t)
    const g = Math.round(110 + (170 - 110) * t)
    const b = Math.round(140 + (200 - 140) * t)
    return `rgb(${r},${g},${b})`
  }, [t])

  const lakeB = useMemo(() => {
    const r = Math.round(50 + (70 - 50) * t)
    const g = Math.round(90 + (140 - 90) * t)
    const b = Math.round(120 + (180 - 120) * t)
    return `rgb(${r},${g},${b})`
  }, [t])

  const rainCount = Math.round(storm * 28)
  const wind = storm > 0.55
  const waveAmp = 2 + storm * 10
  const sunOpacity = bright * 0.95
  const cloudOpacity = 0.25 + storm * 0.65 + (1 - bright) * 0.15

  const wavePath = (y: number, phase: number) => {
    const pts: string[] = []
    for (let x = 0; x <= 320; x += 16) {
      const yy = y + Math.sin((x + phase) * 0.04) * waveAmp + Math.sin((x + phase) * 0.09) * (waveAmp * 0.35)
      pts.push(`${x},${yy.toFixed(1)}`)
    }
    return `M0,${y} L${pts.map((p) => p).join(' L')} L320,200 L0,200 Z`
  }

  return (
    <div className="lake-scene" aria-hidden>
      <svg viewBox="0 0 320 200" className="lake-svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lakeA} />
            <stop offset="100%" stopColor={lakeB} />
          </linearGradient>
          <linearGradient id="mtFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8eef5" />
            <stop offset="55%" stopColor="#b7c4d6" />
            <stop offset="100%" stopColor="#8fa0b8" />
          </linearGradient>
          <linearGradient id="mtNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4f7fb" />
            <stop offset="40%" stopColor="#c5d0e0" />
            <stop offset="100%" stopColor="#7d8fa8" />
          </linearGradient>
        </defs>

        <rect width="320" height="200" fill="url(#skyGrad)" />

        {/* Sun */}
        <g opacity={sunOpacity} className={bright > 0.3 ? 'lake-sun' : undefined}>
          <circle cx="255" cy="42" r="18" fill="#FFE082" />
          <circle cx="255" cy="42" r="28" fill="#FFE082" opacity="0.25" />
        </g>

        {/* Clouds */}
        <g opacity={cloudOpacity} className={wind ? 'lake-clouds wind' : 'lake-clouds'}>
          <ellipse cx="70" cy="38" rx="36" ry="14" fill="#fff" />
          <ellipse cx="95" cy="34" rx="22" ry="12" fill="#fff" />
          <ellipse cx="50" cy="36" rx="18" ry="10" fill="#f0f3f7" />
          <ellipse cx="160" cy="28" rx="30" ry="11" fill="#fff" opacity="0.85" />
          <ellipse cx="180" cy="26" rx="16" ry="9" fill="#eef2f6" />
        </g>

        {/* Far mountains */}
        <path
          d="M0 118 L35 78 L55 95 L85 58 L115 88 L145 48 L175 82 L200 62 L230 92 L260 55 L290 85 L320 70 L320 130 L0 130 Z"
          fill="url(#mtFar)"
          opacity="0.85"
        />
        {/* Snow caps */}
        <path d="M145 48 L158 68 L132 68 Z" fill="#fff" opacity="0.9" />
        <path d="M260 55 L272 72 L248 72 Z" fill="#fff" opacity="0.9" />
        <path d="M85 58 L96 74 L74 74 Z" fill="#fff" opacity="0.85" />

        {/* Near foothills */}
        <path
          d="M0 128 L40 110 L90 122 L140 105 L200 120 L260 108 L320 118 L320 145 L0 145 Z"
          fill="url(#mtNear)"
          opacity="0.95"
        />

        {/* Lake */}
        <path d={wavePath(128, 0)} fill="url(#lakeGrad)" className="lake-water" />
        <path
          d={wavePath(138, 40)}
          fill={lakeB}
          opacity="0.35"
          className={storm > 0.4 ? 'lake-wave turb' : 'lake-wave'}
        />
        <path
          d={wavePath(148, 80)}
          fill="#ffffff"
          opacity={0.12 + storm * 0.12}
          className={storm > 0.4 ? 'lake-wave turb' : 'lake-wave'}
        />

        {/* Shore reflection hint */}
        <ellipse cx="160" cy="175" rx="140" ry="18" fill="#000" opacity={0.06 + storm * 0.06} />

        {/* Ducks (near max) */}
        {ducks ? (
          <g className="lake-ducks">
            <g transform="translate(110,148)">
              <ellipse cx="0" cy="0" rx="7" ry="3.5" fill="#5D4037" />
              <circle cx="6" cy="-2" r="2.8" fill="#5D4037" />
              <path d="M8 -2 L12 -1" stroke="#FFB300" strokeWidth="1.4" strokeLinecap="round" />
            </g>
            <g transform="translate(145,155)">
              <ellipse cx="0" cy="0" rx="6" ry="3" fill="#6D4C41" />
              <circle cx="5.5" cy="-1.5" r="2.4" fill="#6D4C41" />
              <path d="M7.5 -1.5 L11 -0.5" stroke="#FFB300" strokeWidth="1.2" strokeLinecap="round" />
            </g>
            <g transform="translate(175,150)">
              <ellipse cx="0" cy="0" rx="5.5" ry="2.8" fill="#4E342E" />
              <circle cx="5" cy="-1.8" r="2.2" fill="#4E342E" />
              <path d="M7 -1.8 L10.5 -1" stroke="#FFB300" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </g>
        ) : null}

        {/* Rain */}
        {rainCount > 0 ? (
          <g className={`lake-rain ${storm > 0.7 ? 'heavy' : ''}`} opacity={0.35 + storm * 0.5}>
            {Array.from({ length: rainCount }).map((_, i) => {
              const x = ((i * 47) % 300) + 10
              const y = ((i * 31) % 90) + 8
              const len = 6 + (i % 4) * 2 + storm * 4
              return (
                <line
                  key={i}
                  x1={x}
                  y1={y}
                  x2={x - (wind ? 5 : 1)}
                  y2={y + len}
                  stroke="#dce6f0"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  style={{ animationDelay: `${(i % 8) * 0.08}s` }}
                />
              )
            })}
          </g>
        ) : null}

        {/* Wind streaks when stormy */}
        {wind ? (
          <g className="lake-wind" opacity={storm * 0.45}>
            <path d="M20 70 Q60 66 100 72" fill="none" stroke="#fff" strokeWidth="1.5" />
            <path d="M40 95 Q90 88 140 96" fill="none" stroke="#fff" strokeWidth="1.2" />
            <path d="M180 55 Q230 50 280 58" fill="none" stroke="#fff" strokeWidth="1.3" />
          </g>
        ) : null}
      </svg>
    </div>
  )
}
