import { motion } from 'framer-motion'
import { REGION_LABELS, REGION_MAP_FOCUS, type RegionId } from '../lib/locale'

/** Equirectangular-ish projection into a soft world viewBox. */
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 1000
  const y = ((90 - lat) / 180) * 500
  return { x, y }
}

const MARKERS: { id: RegionId; label: string }[] = (
  [
    'hk',
    'mo',
    'cn',
    'tw',
    'jp',
    'kr',
    'sg',
    'my',
    'gb',
    'us',
  ] as RegionId[]
).map((id) => ({ id, label: REGION_LABELS[id] }))

type Props = {
  region: RegionId
  className?: string
}

/**
 * Soft stylized world silhouette — dots only, no flags, no disputed borders.
 * Pans/zooms so the selected region marker sits near the visual center.
 */
export function RegionFocusMap({ region, className = '' }: Props) {
  const focus = REGION_MAP_FOCUS[region]
  const { x, y } = project(focus.lat, focus.lng)
  const scale = focus.zoom
  const tx = 500 - x * scale
  const ty = 250 - y * scale

  return (
    <div className={`region-map ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 1000 500" className="region-map-svg">
        <defs>
          <radialGradient id="region-map-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(91,108,255,0.18)" />
            <stop offset="100%" stopColor="rgba(91,108,255,0)" />
          </radialGradient>
          <linearGradient id="land-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(140,160,200,0.35)" />
            <stop offset="100%" stopColor="rgba(120,150,190,0.22)" />
          </linearGradient>
        </defs>

        <rect width="1000" height="500" fill="url(#region-map-glow)" opacity="0.5" />

        <motion.g
          animate={{ x: tx, y: ty, scale }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          style={{ originX: 0, originY: 0 }}
        >
          <ellipse cx="200" cy="220" rx="120" ry="90" fill="url(#land-fill)" />
          <ellipse cx="320" cy="180" rx="70" ry="55" fill="url(#land-fill)" />
          <ellipse cx="480" cy="200" rx="55" ry="70" fill="url(#land-fill)" />
          <ellipse cx="720" cy="210" rx="160" ry="100" fill="url(#land-fill)" />
          <ellipse cx="780" cy="280" rx="70" ry="45" fill="url(#land-fill)" />
          <ellipse cx="820" cy="170" rx="45" ry="55" fill="url(#land-fill)" />
          <ellipse cx="860" cy="300" rx="35" ry="50" fill="url(#land-fill)" />
          <ellipse cx="250" cy="320" rx="40" ry="55" fill="url(#land-fill)" />
          <ellipse cx="150" cy="140" rx="50" ry="35" fill="url(#land-fill)" />

          {MARKERS.map((m) => {
            const f = REGION_MAP_FOCUS[m.id]
            const p = project(f.lat, f.lng)
            const active = m.id === region
            return (
              <g key={m.id} transform={`translate(${p.x}, ${p.y})`}>
                <circle
                  r={active ? 9 : 5}
                  fill={active ? 'var(--color-primary, #5B6CFF)' : 'rgba(90,110,160,0.45)'}
                  opacity={active ? 1 : 0.7}
                />
                {active ? (
                  <circle
                    r={16}
                    fill="none"
                    stroke="var(--color-primary, #5B6CFF)"
                    strokeWidth="1.5"
                    opacity="0.45"
                  />
                ) : null}
                {active ? (
                  <text
                    y={-16}
                    textAnchor="middle"
                    fill="var(--color-primary, #5B6CFF)"
                    fontSize="14"
                    fontWeight="700"
                  >
                    {m.label}
                  </text>
                ) : null}
              </g>
            )
          })}
        </motion.g>
      </svg>
    </div>
  )
}
