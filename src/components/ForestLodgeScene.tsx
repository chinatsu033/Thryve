import { useId, useMemo } from 'react'
import type { DayPart } from '../lib/sleep'

type Props = {
  dayPart: DayPart
  className?: string
}

type Sky = { top: string; bot: string; sun: string; sunOp: number; moonOp: number; stars: number }

function skyFor(part: DayPart): Sky {
  switch (part) {
    case 'dawn':
      return { top: '#F8A0A8', bot: '#FFD4A8', sun: '#FFB74D', sunOp: 0.85, moonOp: 0, stars: 0 }
    case 'morning':
      return { top: '#87CEEB', bot: '#E3F2FD', sun: '#FFE082', sunOp: 0.95, moonOp: 0, stars: 0 }
    case 'noon':
      return { top: '#4FC3F7', bot: '#B3E5FC', sun: '#FFF59D', sunOp: 1, moonOp: 0, stars: 0 }
    case 'afternoon':
      return { top: '#64B5F6', bot: '#FFE0B2', sun: '#FFCC80', sunOp: 0.9, moonOp: 0, stars: 0 }
    case 'evening':
      return { top: '#5C6BC0', bot: '#FF8A65', sun: '#FF7043', sunOp: 0.55, moonOp: 0.35, stars: 4 }
    case 'night':
      return { top: '#1A237E', bot: '#283593', sun: '#FFE082', sunOp: 0, moonOp: 0.9, stars: 18 }
    case 'midnight':
      return { top: '#0D1117', bot: '#1A1A2E', sun: '#FFE082', sunOp: 0, moonOp: 0.55, stars: 28 }
  }
}

export function ForestLodgeScene({ dayPart, className = '' }: Props) {
  const uid = useId().replace(/:/g, '')
  const sky = useMemo(() => skyFor(dayPart), [dayPart])

  const showBikeWindow = dayPart === 'dawn' || dayPart === 'evening'
  const showBikeWell = dayPart === 'noon'
  const doorOpen = dayPart === 'noon'
  const clothesOnWell = dayPart === 'noon' || dayPart === 'afternoon'
  const cabinLights = dayPart === 'evening' || dayPart === 'night'
  const windowLights = dayPart === 'evening' || dayPart === 'night'
  const chimneySmoke = dayPart === 'evening'

  const skyId = `lodge-sky-${uid}`
  const mtId = `lodge-mt-${uid}`

  return (
    <div className={`lodge-scene ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 320 220" className="lodge-svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.top} />
            <stop offset="100%" stopColor={sky.bot} />
          </linearGradient>
          <linearGradient id={mtId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8B8C8" />
            <stop offset="100%" stopColor="#5D6B7A" />
          </linearGradient>
        </defs>

        <rect width="320" height="220" fill={`url(#${skyId})`} />

        {/* Stars */}
        {sky.stars > 0
          ? Array.from({ length: sky.stars }).map((_, i) => {
              const x = ((i * 53) % 300) + 10
              const y = ((i * 37) % 70) + 8
              const r = 0.6 + (i % 3) * 0.35
              return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.55 + (i % 5) * 0.08} />
            })
          : null}

        {/* Sun */}
        {sky.sunOp > 0.05 ? (
          <g opacity={sky.sunOp} className="lodge-celestial">
            <circle cx={dayPart === 'dawn' || dayPart === 'evening' ? 60 : 250} cy={dayPart === 'noon' ? 42 : 55} r="18" fill={sky.sun} opacity="0.35" />
            <circle cx={dayPart === 'dawn' || dayPart === 'evening' ? 60 : 250} cy={dayPart === 'noon' ? 42 : 55} r="11" fill={sky.sun} />
          </g>
        ) : null}

        {/* Moon */}
        {sky.moonOp > 0.05 ? (
          <g opacity={sky.moonOp}>
            <circle cx="255" cy="40" r="12" fill="#FFF8E1" />
            <circle cx="260" cy="36" r="10" fill={sky.top} opacity="0.85" />
          </g>
        ) : null}

        {/* Distant mountains with trees */}
        <path
          d="M0 115 L40 70 L70 95 L100 55 L140 90 L175 48 L210 88 L250 60 L290 95 L320 75 L320 140 L0 140 Z"
          fill={`url(#${mtId})`}
          opacity="0.9"
        />
        {/* Tiny distant pines on ridges */}
        {[45, 95, 130, 170, 205, 245, 275].map((x, i) => (
          <g key={i} opacity="0.75">
            <polygon points={`${x},${88 - (i % 3) * 6} ${x - 5},${100} ${x + 5},${100}`} fill="#3E5C45" />
          </g>
        ))}

        {/* Mid forest band */}
        <path d="M0 130 Q80 118 160 128 T320 125 L320 175 L0 175 Z" fill="#2E5A3C" opacity="0.55" />

        {/* Ground */}
        <rect y="155" width="320" height="65" fill="#4A7C59" />
        <ellipse cx="160" cy="195" rx="150" ry="28" fill="#3D6B4F" opacity="0.45" />

        {/* Trees left cluster */}
        <Tree x={28} y={168} scale={1.15} />
        <Tree x={52} y={172} scale={0.9} />
        <Tree x={78} y={170} scale={1.05} />
        <Tree x={18} y={175} scale={0.75} />

        {/* Trees right */}
        <Tree x={275} y={168} scale={1.1} />
        <Tree x={300} y={172} scale={0.95} />
        <Tree x={250} y={174} scale={0.8} />
        <Tree x={288} y={178} scale={0.7} />

        {/* Cabin */}
        <g transform="translate(118,118)">
          {/* Body */}
          <rect x="0" y="22" width="84" height="52" rx="2" fill="#8D6E63" />
          <rect x="0" y="22" width="84" height="8" fill="#6D4C41" opacity="0.35" />
          {/* Roof */}
          <polygon points="-8,22 42,-8 92,22" fill="#5D4037" />
          <polygon points="-4,22 42,-2 88,22" fill="#795548" opacity="0.5" />
          {/* Chimney */}
          <rect x="62" y="0" width="12" height="22" fill="#6D4C41" />
          {chimneySmoke ? (
            <g className="lodge-smoke">
              <ellipse cx="68" cy="-8" rx="5" ry="4" fill="#CFD8DC" opacity="0.55" />
              <ellipse cx="72" cy="-18" rx="6" ry="5" fill="#ECEFF1" opacity="0.4" />
              <ellipse cx="66" cy="-28" rx="7" ry="5" fill="#F5F5F5" opacity="0.28" />
            </g>
          ) : null}
          {/* Door */}
          {doorOpen ? (
            <g>
              <rect x="34" y="38" width="18" height="36" fill="#3E2723" />
              <path d="M52 38 L68 42 L68 72 L52 74 Z" fill="#5D4037" />
            </g>
          ) : (
            <rect x="34" y="38" width="18" height="36" rx="1" fill="#4E342E" />
          )}
          {!doorOpen ? <circle cx="48" cy="56" r="1.5" fill="#FFD54F" opacity="0.7" /> : null}
          {/* Windows */}
          <rect x="8" y="40" width="16" height="14" rx="1" fill={windowLights ? '#FFE082' : '#263238'} opacity={windowLights ? 0.95 : 0.85} />
          <rect x="60" y="40" width="16" height="14" rx="1" fill={windowLights ? '#FFE082' : '#263238'} opacity={windowLights ? 0.95 : 0.85} />
          {cabinLights ? (
            <g opacity="0.35">
              <ellipse cx="16" cy="47" rx="14" ry="10" fill="#FFE082" />
              <ellipse cx="68" cy="47" rx="14" ry="10" fill="#FFE082" />
            </g>
          ) : null}
          {/* Window crosses */}
          <line x1="16" y1="40" x2="16" y2="54" stroke="#5D4037" strokeWidth="1" />
          <line x1="8" y1="47" x2="24" y2="47" stroke="#5D4037" strokeWidth="1" />
          <line x1="68" y1="40" x2="68" y2="54" stroke="#5D4037" strokeWidth="1" />
          <line x1="60" y1="47" x2="76" y2="47" stroke="#5D4037" strokeWidth="1" />
        </g>

        {/* Well in front of door */}
        <g transform="translate(148,178)">
          <ellipse cx="12" cy="14" rx="18" ry="6" fill="#5D4037" opacity="0.35" />
          <ellipse cx="12" cy="8" rx="16" ry="7" fill="#78909C" />
          <ellipse cx="12" cy="6" rx="11" ry="4.5" fill="#37474F" />
          {/* Well posts + beam */}
          <rect x="-2" y="-10" width="3" height="16" fill="#6D4C41" />
          <rect x="23" y="-10" width="3" height="16" fill="#6D4C41" />
          <rect x="-4" y="-12" width="32" height="3" fill="#5D4037" />
          {/* Rope */}
          <line x1="12" y1="-10" x2="12" y2="4" stroke="#8D6E63" strokeWidth="1.2" />
          {clothesOnWell ? (
            <g>
              <rect x="-6" y="-6" width="10" height="14" rx="1" fill="#42A5F5" />
              <rect x="16" y="-8" width="12" height="16" rx="1" fill="#EF5350" />
              <rect x="6" y="-4" width="8" height="12" rx="1" fill="#66BB6A" />
            </g>
          ) : null}
        </g>

        {/* Bicycle under window */}
        {showBikeWindow ? <Bicycle x={105} y={178} /> : null}
        {/* Bicycle by well */}
        {showBikeWell ? <Bicycle x={185} y={182} /> : null}
      </svg>
    </div>
  )
}

function Tree({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x="-2.5" y="-8" width="5" height="14" fill="#5D4037" />
      <polygon points="0,-36 -14,-8 14,-8" fill="#2E7D32" />
      <polygon points="0,-46 -11,-22 11,-22" fill="#388E3C" />
      <polygon points="0,-54 -8,-34 8,-34" fill="#43A047" />
    </g>
  )
}

function Bicycle({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} opacity="0.92">
      <circle cx="0" cy="0" r="6" fill="none" stroke="#37474F" strokeWidth="1.6" />
      <circle cx="18" cy="0" r="6" fill="none" stroke="#37474F" strokeWidth="1.6" />
      <path d="M0 0 L8 -10 L16 -10 L18 0 M8 -10 L6 0 M8 -10 L12 -16" fill="none" stroke="#455A64" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="-16" r="1.6" fill="#78909C" />
    </g>
  )
}
