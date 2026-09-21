import { useId, useMemo } from 'react'
import { dayPartFromHours, type DayPart } from '../lib/sleep'

type Props = {
  dayPart?: DayPart
  /** Fractional hours 0–24 for continuous sky / celestial motion. */
  hours?: number
  className?: string
}

type SkyKey = { top: string; bot: string; sun: string; sunOp: number; moonOp: number; stars: number }

const SKY_KEYS: { h: number; sky: SkyKey }[] = [
  { h: 0, sky: { top: '#0D1117', bot: '#1A1A2E', sun: '#FFE082', sunOp: 0, moonOp: 0.5, stars: 28 } },
  { h: 4.5, sky: { top: '#0D1117', bot: '#2A1A3A', sun: '#FFE082', sunOp: 0, moonOp: 0.4, stars: 22 } },
  { h: 5.5, sky: { top: '#F8A0A8', bot: '#FFD4A8', sun: '#FFB74D', sunOp: 0.85, moonOp: 0.1, stars: 2 } },
  { h: 7.5, sky: { top: '#87CEEB', bot: '#E3F2FD', sun: '#FFE082', sunOp: 0.95, moonOp: 0, stars: 0 } },
  { h: 10, sky: { top: '#64B5F6', bot: '#BBDEFB', sun: '#FFE082', sunOp: 1, moonOp: 0, stars: 0 } },
  { h: 12, sky: { top: '#4FC3F7', bot: '#B3E5FC', sun: '#FFF59D', sunOp: 1, moonOp: 0, stars: 0 } },
  { h: 15, sky: { top: '#64B5F6', bot: '#FFE0B2', sun: '#FFCC80', sunOp: 0.9, moonOp: 0, stars: 0 } },
  { h: 17.5, sky: { top: '#5C6BC0', bot: '#FF8A65', sun: '#FF7043', sunOp: 0.55, moonOp: 0.25, stars: 4 } },
  { h: 19.5, sky: { top: '#1A237E', bot: '#283593', sun: '#FFE082', sunOp: 0, moonOp: 0.85, stars: 16 } },
  { h: 22.5, sky: { top: '#12182E', bot: '#1E2748', sun: '#FFE082', sunOp: 0, moonOp: 0.7, stars: 24 } },
  { h: 24, sky: { top: '#0D1117', bot: '#1A1A2E', sun: '#FFE082', sunOp: 0, moonOp: 0.5, stars: 28 } },
]

function parseRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseRgb(a)
  const [br, bg, bb] = parseRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bch = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bch})`
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function skyAtHours(hours: number): SkyKey {
  const h = ((hours % 24) + 24) % 24
  let i = 0
  while (i < SKY_KEYS.length - 1 && SKY_KEYS[i + 1].h < h) i++
  const a = SKY_KEYS[i]
  const b = SKY_KEYS[Math.min(i + 1, SKY_KEYS.length - 1)]
  const span = b.h - a.h || 1
  const t = Math.min(1, Math.max(0, (h - a.h) / span))
  return {
    top: mixHex(a.sky.top, b.sky.top, t),
    bot: mixHex(a.sky.bot, b.sky.bot, t),
    sun: mixHex(a.sky.sun, b.sky.sun, t),
    sunOp: lerp(a.sky.sunOp, b.sky.sunOp, t),
    moonOp: lerp(a.sky.moonOp, b.sky.moonOp, t),
    stars: Math.round(lerp(a.sky.stars, b.sky.stars, t)),
  }
}

/** Midpoint hours for each discrete dayPart (fallback when hours omitted). */
const PART_HOURS: Record<DayPart, number> = {
  dawn: 6,
  morning: 9,
  noon: 12,
  afternoon: 15,
  evening: 18,
  night: 21,
  midnight: 1.5,
}

export function ForestLodgeScene({ dayPart, hours, className = '' }: Props) {
  const uid = useId().replace(/:/g, '')
  const h = hours ?? (dayPart ? PART_HOURS[dayPart] : 12)
  const part = dayPart ?? dayPartFromHours(h)
  const sky = useMemo(() => skyAtHours(h), [h])

  const showBikeWindow = part === 'dawn' || part === 'evening'
  const showBikeWell = part === 'noon'
  const doorOpen = part === 'noon'
  const clothesOnWell = part === 'noon' || part === 'afternoon'
  const cabinLights = part === 'evening' || part === 'night'
  const windowLights = part === 'evening' || part === 'night'
  const chimneySmoke = part === 'evening'

  // Sun arc: dawn left-low → noon high-right → evening left-low again
  const sunAngle = ((h - 5) / 14) * Math.PI // ~5–19
  const sunX = 40 + Math.sin(Math.min(Math.PI, Math.max(0, sunAngle))) * 220
  const sunY = 78 - Math.sin(Math.min(Math.PI, Math.max(0, sunAngle))) * 48
  const moonX = 250
  const moonY = 36

  const skyId = `lodge-sky-${uid}`
  const mtFarId = `lodge-mt-far-${uid}`
  const mtNearId = `lodge-mt-near-${uid}`
  const groundId = `lodge-ground-${uid}`
  const cabinGradId = `lodge-cabin-${uid}`
  const roofId = `lodge-roof-${uid}`

  return (
    <div className={`lodge-scene ${className}`.trim()} aria-hidden>
      {/*
        Composition shifted UP: focal cabin/well/trees sit in upper~65%.
        Lower band is soft empty ground so the date bar / 「确定日期」 won't clip them.
      */}
      <svg viewBox="0 0 320 240" className="lodge-svg" preserveAspectRatio="xMidYMin slice">
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.top} style={{ transition: 'stop-color 0.35s ease' }} />
            <stop offset="100%" stopColor={sky.bot} style={{ transition: 'stop-color 0.35s ease' }} />
          </linearGradient>
          <linearGradient id={mtFarId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8EEF5" />
            <stop offset="55%" stopColor="#A8B8C8" />
            <stop offset="100%" stopColor="#6B7C8E" />
          </linearGradient>
          <linearGradient id={mtNearId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C5D0BC" />
            <stop offset="100%" stopColor="#5A7A5E" />
          </linearGradient>
          <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B8A64" />
            <stop offset="100%" stopColor="#3D6B4F" />
          </linearGradient>
          <linearGradient id={cabinGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A1887F" />
            <stop offset="100%" stopColor="#6D4C41" />
          </linearGradient>
          <linearGradient id={roofId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5D4037" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>
        </defs>

        <rect width="320" height="240" fill={`url(#${skyId})`} className="lodge-sky-rect" />

        {/* Stars */}
        {sky.stars > 0
          ? Array.from({ length: sky.stars }).map((_, i) => {
              const x = ((i * 53) % 300) + 10
              const y = ((i * 37) % 58) + 6
              const r = 0.55 + (i % 3) * 0.3
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={r}
                  fill="#fff"
                  opacity={0.45 + (i % 5) * 0.08}
                  className="lodge-star"
                />
              )
            })
          : null}

        {/* Soft dawn/dusk haze */}
        <ellipse cx="160" cy="95" rx="160" ry="36" fill={sky.bot} opacity="0.22" />

        {/* Sun */}
        {sky.sunOp > 0.04 ? (
          <g opacity={sky.sunOp} className="lodge-celestial lodge-sun" style={{ transition: 'opacity 0.3s ease' }}>
            <circle cx={sunX} cy={sunY} r="26" fill={sky.sun} opacity="0.22" />
            <circle cx={sunX} cy={sunY} r="16" fill={sky.sun} opacity="0.45" />
            <circle cx={sunX} cy={sunY} r="10" fill={sky.sun} />
          </g>
        ) : null}

        {/* Moon */}
        {sky.moonOp > 0.04 ? (
          <g opacity={sky.moonOp} style={{ transition: 'opacity 0.3s ease' }}>
            <circle cx={moonX} cy={moonY} r="13" fill="#FFF8E1" />
            <circle cx={moonX + 5} cy={moonY - 4} r="11" fill={sky.top} opacity="0.78" />
          </g>
        ) : null}

        {/* Distant mountains */}
        <path
          d="M0 108 L28 78 L52 94 L78 58 L108 88 L138 52 L168 86 L198 62 L230 90 L258 56 L290 84 L320 68 L320 128 L0 128 Z"
          fill={`url(#${mtFarId})`}
          opacity="0.78"
        />
        <path d="M138 52 L150 70 L126 70 Z" fill="#fff" opacity="0.75" />
        <path d="M258 56 L268 72 L248 72 Z" fill="#fff" opacity="0.7" />

        {/* Mid foothills / forest haze */}
        <path
          d="M0 118 Q50 104 95 114 T180 110 T280 116 L320 120 L320 148 L0 148 Z"
          fill={`url(#${mtNearId})`}
          opacity="0.85"
        />
        {/* Tiny ridge pines */}
        {[42, 72, 102, 155, 195, 235, 268, 298].map((x, i) => (
          <polygon
            key={i}
            points={`${x},${98 - (i % 3) * 5} ${x - 4.5},${112} ${x + 4.5},${112}`}
            fill="#3E5C45"
            opacity="0.65"
          />
        ))}

        {/* Ground — generous lower safe zone for overlays */}
        <rect y="138" width="320" height="102" fill={`url(#${groundId})`} />
        <ellipse cx="160" cy="168" rx="150" ry="22" fill="#2E5A3C" opacity="0.28" />
        <ellipse cx="80" cy="200" rx="90" ry="28" fill="#4A7C59" opacity="0.35" />
        <ellipse cx="240" cy="210" rx="100" ry="24" fill="#3D6B4F" opacity="0.3" />

        {/* Soft path toward cabin */}
        <path
          d="M210 148 Q200 165 195 200 Q192 220 200 240"
          fill="none"
          stroke="#C8B89A"
          strokeWidth="18"
          opacity="0.28"
          strokeLinecap="round"
        />

        {/* —— LEFT: dense forest —— */}
        <g className="lodge-forest-left">
          <SoftTree x={8} y={148} scale={1.35} shade="#1B5E20" />
          <SoftTree x={32} y={152} scale={1.15} shade="#2E7D32" />
          <SoftTree x={54} y={150} scale={1.4} shade="#1B5E20" />
          <SoftTree x={22} y={156} scale={0.85} shade="#388E3C" />
          <SoftTree x={68} y={154} scale={0.95} shade="#43A047" />
          <SoftTree x={44} y={158} scale={0.7} shade="#2E7D32" />
          <RoundBush x={78} y={158} scale={1.1} />
          <RoundBush x={12} y={162} scale={0.85} />
        </g>

        {/* Far-right trees (behind cabin) */}
        <g opacity="0.9">
          <SoftTree x={302} y={146} scale={1.2} shade="#1B5E20" />
          <SoftTree x={280} y={150} scale={0.95} shade="#2E7D32" />
        </g>

        {/* —— RIGHT: cabin —— */}
        <g transform="translate(188,88)" className="lodge-cabin">
          {/* Soft shadow */}
          <ellipse cx="48" cy="78" rx="52" ry="10" fill="#000" opacity="0.14" />

          {/* Chimney behind roof peak */}
          <rect x="68" y="2" width="14" height="28" rx="1.5" fill="#6D4C41" />
          <rect x="66" y="0" width="18" height="5" rx="1" fill="#5D4037" />
          {chimneySmoke ? (
            <g className="lodge-smoke">
              <ellipse cx="75" cy="-6" rx="6" ry="4.5" fill="#CFD8DC" opacity="0.55" />
              <ellipse cx="79" cy="-18" rx="7" ry="5.5" fill="#ECEFF1" opacity="0.4" />
              <ellipse cx="72" cy="-30" rx="8" ry="6" fill="#F5F5F5" opacity="0.28" />
            </g>
          ) : null}

          {/* Roof */}
          <path d="M-10 30 L48 -6 L106 30 Z" fill={`url(#${roofId})`} />
          <path d="M-4 30 L48 2 L100 30 Z" fill="#795548" opacity="0.35" />
          {/* Roof edge highlight */}
          <path d="M-10 30 L48 -6 L106 30" fill="none" stroke="#4E342E" strokeWidth="1.5" opacity="0.4" />

          {/* Body */}
          <rect x="2" y="30" width="92" height="50" rx="3" fill={`url(#${cabinGradId})`} />
          <rect x="2" y="30" width="92" height="7" fill="#5D4037" opacity="0.28" />
          {/* Log lines */}
          {[40, 48, 56, 64, 72].map((y) => (
            <line key={y} x1="4" y1={y} x2="92" y2={y} stroke="#5D4037" strokeWidth="0.6" opacity="0.22" />
          ))}

          {/* Door */}
          {doorOpen ? (
            <g>
              <rect x="38" y="42" width="20" height="38" fill="#2C1810" />
              <path d="M58 42 L76 46 L76 78 L58 80 Z" fill="#6D4C41" />
              <path d="M58 42 L76 46 L76 78 L58 80 Z" fill="#8D6E63" opacity="0.35" />
              <circle cx="72" cy="62" r="1.6" fill="#FFD54F" opacity="0.75" />
            </g>
          ) : (
            <g>
              <rect x="38" y="42" width="20" height="38" rx="1.5" fill="#4E342E" />
              <rect x="40" y="44" width="16" height="34" rx="1" fill="#5D4037" opacity="0.45" />
              <circle cx="54" cy="62" r="1.7" fill="#FFD54F" opacity="0.8" />
            </g>
          )}

          {/* Windows */}
          <Window x={10} y={44} lit={windowLights} />
          <Window x={70} y={44} lit={windowLights} />
          {cabinLights ? (
            <g opacity="0.32">
              <ellipse cx="18" cy="51" rx="16" ry="12" fill="#FFE082" />
              <ellipse cx="78" cy="51" rx="16" ry="12" fill="#FFE082" />
            </g>
          ) : null}

          {/* Porch step */}
          <rect x="34" y="78" width="28" height="4" rx="1" fill="#5D4037" opacity="0.7" />
        </g>

        {/* —— CENTER: well —— */}
        <g transform="translate(118,132)" className="lodge-well">
          <ellipse cx="22" cy="28" rx="26" ry="8" fill="#000" opacity="0.12" />
          {/* Stone base */}
          <ellipse cx="22" cy="20" rx="24" ry="10" fill="#90A4AE" />
          <ellipse cx="22" cy="18" rx="22" ry="9" fill="#78909C" />
          <ellipse cx="22" cy="14" rx="15" ry="6" fill="#37474F" />
          <ellipse cx="22" cy="13" rx="11" ry="4" fill="#263238" opacity="0.85" />
          {/* Stone rings */}
          <ellipse cx="22" cy="20" rx="24" ry="10" fill="none" stroke="#607D8B" strokeWidth="1.2" opacity="0.5" />
          {/* Posts + beam */}
          <rect x="2" y="-8" width="4" height="22" rx="1" fill="#6D4C41" />
          <rect x="38" y="-8" width="4" height="22" rx="1" fill="#6D4C41" />
          <rect x="0" y="-12" width="44" height="5" rx="1.5" fill="#5D4037" />
          <rect x="0" y="-12" width="44" height="2" fill="#8D6E63" opacity="0.4" />
          {/* Rope + bucket */}
          <line x1="22" y1="-8" x2="22" y2="10" stroke="#8D6E63" strokeWidth="1.4" />
          <path d="M18 10 L26 10 L25 16 L19 16 Z" fill="#6D4C41" opacity="0.85" />

          {clothesOnWell ? (
            <g className="lodge-clothes">
              <path d="M4 -2 Q8 8 6 16" fill="none" stroke="#42A5F5" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
              <path d="M28 -4 Q34 6 32 18" fill="none" stroke="#EF5350" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
              <path d="M16 0 Q20 8 18 14" fill="none" stroke="#66BB6A" strokeWidth="5.5" strokeLinecap="round" opacity="0.88" />
            </g>
          ) : null}
        </g>

        {/* Front-right bushes framing cabin */}
        <RoundBush x={268} y={156} scale={1} />
        <RoundBush x={248} y={160} scale={0.75} />

        {/* Bicycles */}
        {showBikeWindow ? <Bicycle x={168} y={148} /> : null}
        {showBikeWell ? <Bicycle x={168} y={155} /> : null}

        {/* Subtle leaf drift when daytime */}
        {sky.sunOp > 0.4 ? (
          <g className="lodge-leaves" opacity="0.35">
            <ellipse cx="90" cy="70" rx="2" ry="1.2" fill="#81C784" className="lodge-leaf" />
            <ellipse cx="140" cy="55" rx="1.8" ry="1" fill="#A5D6A7" className="lodge-leaf" style={{ animationDelay: '0.8s' }} />
            <ellipse cx="210" cy="62" rx="2.2" ry="1.1" fill="#66BB6A" className="lodge-leaf" style={{ animationDelay: '1.4s' }} />
          </g>
        ) : null}
      </svg>
    </div>
  )
}

function SoftTree({ x, y, scale, shade }: { x: number; y: number; scale: number; shade: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="10" ry="3" fill="#000" opacity="0.1" />
      <rect x="-2.5" y="-10" width="5" height="16" rx="1.5" fill="#5D4037" />
      <ellipse cx="0" cy="-28" rx="16" ry="18" fill={shade} />
      <ellipse cx="-6" cy="-22" rx="11" ry="12" fill={shade} opacity="0.85" />
      <ellipse cx="7" cy="-24" rx="10" ry="11" fill={shade} opacity="0.9" />
      <ellipse cx="0" cy="-36" rx="9" ry="10" fill={shade} opacity="0.95" />
      {/* Highlight */}
      <ellipse cx="-3" cy="-32" rx="4" ry="5" fill="#fff" opacity="0.1" />
    </g>
  )
}

function RoundBush({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity="0.92">
      <ellipse cx="0" cy="4" rx="14" ry="5" fill="#000" opacity="0.1" />
      <ellipse cx="0" cy="0" rx="14" ry="9" fill="#2E7D32" />
      <ellipse cx="-7" cy="-2" rx="8" ry="7" fill="#388E3C" />
      <ellipse cx="7" cy="-1" rx="7" ry="6" fill="#43A047" />
    </g>
  )
}

function Window({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width="18" height="15" rx="2" fill={lit ? '#FFE082' : '#1A237E'} opacity={lit ? 0.95 : 0.8} />
      <rect width="18" height="15" rx="2" fill="none" stroke="#5D4037" strokeWidth="1.4" />
      <line x1="9" y1="0" x2="9" y2="15" stroke="#5D4037" strokeWidth="1" />
      <line x1="0" y1="7.5" x2="18" y2="7.5" stroke="#5D4037" strokeWidth="1" />
      {lit ? <rect x="1" y="1" width="7" height="5" rx="0.5" fill="#FFF8E1" opacity="0.35" /> : null}
    </g>
  )
}

function Bicycle({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} opacity="0.9" className="lodge-bike">
      <ellipse cx="9" cy="8" rx="14" ry="3" fill="#000" opacity="0.1" />
      <circle cx="0" cy="4" r="6.5" fill="none" stroke="#37474F" strokeWidth="1.7" />
      <circle cx="0" cy="4" r="1.4" fill="#546E7A" />
      <circle cx="20" cy="4" r="6.5" fill="none" stroke="#37474F" strokeWidth="1.7" />
      <circle cx="20" cy="4" r="1.4" fill="#546E7A" />
      <path
        d="M0 4 L9 -8 L18 -8 L20 4 M9 -8 L7 4 M9 -8 L13 -15"
        fill="none"
        stroke="#455A64"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="13" cy="-15" r="1.8" fill="#78909C" />
      <path d="M18 -8 L24 -10" stroke="#455A64" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  )
}
