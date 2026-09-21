import { useId, useMemo } from 'react'

type Props = {
  /** Continuous sleep feel 1–7 (永夜→日光). */
  quality: number
  className?: string
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function SeaBoatScene({ quality, className = '' }: Props) {
  const uid = useId().replace(/:/g, '')
  const t = clamp01((quality - 1) / 6) // 0 = 永夜, 1 = 日光
  const storm = clamp01(1 - t * 1.35)
  const calm = clamp01((t - 0.45) / 0.55)
  const mid = clamp01(1 - Math.abs(t - 0.5) * 2)

  const skyTop = useMemo(() => {
    const r = Math.round(25 + (120 - 25) * t + (90 - 120) * calm * 0.3)
    const g = Math.round(30 + (170 - 30) * t)
    const b = Math.round(55 + (230 - 55) * t)
    return `rgb(${r},${g},${b})`
  }, [t, calm])

  const skyBot = useMemo(() => {
    const r = Math.round(40 + (180 - 40) * t)
    const g = Math.round(50 + (200 - 50) * t)
    const b = Math.round(70 + (235 - 70) * t)
    return `rgb(${r},${g},${b})`
  }, [t])

  const seaA = useMemo(() => {
    const r = Math.round(20 + (70 - 20) * t)
    const g = Math.round(40 + (140 - 40) * t)
    const b = Math.round(70 + (190 - 70) * t)
    return `rgb(${r},${g},${b})`
  }, [t])

  const seaB = useMemo(() => {
    const r = Math.round(10 + (40 - 10) * t)
    const g = Math.round(30 + (100 - 30) * t)
    const b = Math.round(55 + (150 - 55) * t)
    return `rgb(${r},${g},${b})`
  }, [t])

  const waveAmp = 2 + storm * 14
  const sunOp = calm * 0.95
  const moonOp = mid * 0.75 + storm * 0.15
  const rainCount = Math.round(storm * 32)
  const showBirds = calm > 0.55
  const showLightning = storm > 0.7
  const boatSway = storm > 0.35 ? 'sea-boat turb' : 'sea-boat'

  const skyId = `sea-sky-${uid}`
  const seaId = `sea-grad-${uid}`

  const wavePath = (y: number, phase: number) => {
    const pts: string[] = []
    for (let x = 0; x <= 320; x += 14) {
      const yy =
        y +
        Math.sin((x + phase) * 0.045) * waveAmp +
        Math.sin((x + phase) * 0.1) * (waveAmp * 0.4)
      pts.push(`${x},${yy.toFixed(1)}`)
    }
    return `M0,${y} L${pts.join(' L')} L320,220 L0,220 Z`
  }

  return (
    <div className={`sea-scene ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 320 220" className="sea-svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>
          <linearGradient id={seaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={seaA} />
            <stop offset="100%" stopColor={seaB} />
          </linearGradient>
        </defs>

        <rect width="320" height="220" fill={`url(#${skyId})`} />

        {/* Clouds */}
        <g opacity={0.2 + storm * 0.55 + mid * 0.2} className={storm > 0.5 ? 'sea-clouds wind' : 'sea-clouds'}>
          <ellipse cx="70" cy="40" rx="40" ry="14" fill="#ECEFF1" />
          <ellipse cx="100" cy="36" rx="24" ry="12" fill="#CFD8DC" />
          <ellipse cx="200" cy="30" rx="36" ry="12" fill="#ECEFF1" opacity="0.85" />
          <ellipse cx="230" cy="28" rx="20" ry="10" fill="#B0BEC5" />
        </g>

        {/* Moon toward right (mid) */}
        <g opacity={moonOp * (1 - sunOp * 0.7)}>
          <circle cx="250" cy="48" r="14" fill="#FFF8E1" />
          <circle cx="256" cy="44" r="11" fill={skyTop} opacity="0.7" />
        </g>

        {/* Sun */}
        <g opacity={sunOp} className="sea-sun">
          <circle cx="240" cy="52" r="26" fill="#FFE082" opacity="0.3" />
          <circle cx="240" cy="52" r="16" fill="#FFECB3" />
          <circle cx="240" cy="52" r="11" fill="#FFE082" />
        </g>

        {/* Lightning */}
        {showLightning ? (
          <g className="sea-lightning" opacity={0.75}>
            <path d="M150 10 L135 55 L148 55 L130 100" fill="none" stroke="#E3F2FD" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M210 5 L200 40 L212 40 L198 78" fill="none" stroke="#BBDEFB" strokeWidth="1.8" opacity="0.7" />
          </g>
        ) : null}

        {/* Sea layers */}
        <path d={wavePath(118, 0)} fill={`url(#${seaId})`} />
        <path
          d={wavePath(132, 35)}
          fill={seaB}
          opacity="0.4"
          className={storm > 0.4 ? 'sea-wave turb' : 'sea-wave'}
        />
        <path
          d={wavePath(145, 70)}
          fill="#ffffff"
          opacity={0.1 + storm * 0.15}
          className={storm > 0.4 ? 'sea-wave turb' : 'sea-wave'}
        />

        {/* Boat */}
        <g transform="translate(150,138)">
          <g className={boatSway}>
            <ellipse cx="0" cy="10" rx="28" ry="5" fill="#000" opacity="0.12" />
            <path d="M-26 4 Q0 14 26 4 L20 -2 L-20 -2 Z" fill="#6D4C41" />
            <path d="M-18 -2 L-8 -28 L0 -2 Z" fill="#ECEFF1" opacity="0.9" />
            <line x1="-8" y1="-2" x2="-8" y2="-28" stroke="#5D4037" strokeWidth="1.5" />
            <circle cx="-4" cy="0" r="2.2" fill="#FFCC80" />
          </g>
        </g>

        {/* Seagulls */}
        {showBirds ? (
          <g className="sea-birds" opacity={0.55 + calm * 0.4}>
            <path d="M40 55 Q48 48 56 55" fill="none" stroke="#37474F" strokeWidth="1.4" />
            <path d="M70 42 Q76 36 82 42" fill="none" stroke="#455A64" strokeWidth="1.2" />
            <path d="M100 50 Q108 44 116 50" fill="none" stroke="#37474F" strokeWidth="1.3" />
          </g>
        ) : null}

        {/* Rain / spray */}
        {rainCount > 0 ? (
          <g className={`sea-rain ${storm > 0.75 ? 'heavy' : ''}`} opacity={0.3 + storm * 0.5}>
            {Array.from({ length: rainCount }).map((_, i) => {
              const x = ((i * 47) % 300) + 10
              const y = ((i * 31) % 95) + 6
              const len = 6 + (i % 4) * 2 + storm * 5
              return (
                <line
                  key={i}
                  x1={x}
                  y1={y}
                  x2={x - (storm > 0.5 ? 6 : 1)}
                  y2={y + len}
                  stroke="#E3F2FD"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  style={{ animationDelay: `${(i % 8) * 0.07}s` }}
                />
              )
            })}
          </g>
        ) : null}
      </svg>
    </div>
  )
}
