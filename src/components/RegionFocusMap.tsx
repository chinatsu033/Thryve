import { motion } from 'framer-motion'
import { WORLD_LAND_PATH } from '../assets/worldLandPath'
import { REGION_LABELS, REGION_MAP_FOCUS, type RegionId } from '../lib/locale'

/** Equirectangular projection into a 1000×500 world viewBox (matches Natural Earth land asset). */
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
 * Outlined world land map (Natural Earth 110m coastlines, public domain).
 * Soft wellness fill + stroke contours; pans/zooms to the selected region marker.
 * No flags; Taiwan marker uses 「台湾地区」 via REGION_LABELS.
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
            <stop offset="0%" stopColor="rgba(91,108,255,0.14)" />
            <stop offset="100%" stopColor="rgba(91,108,255,0)" />
          </radialGradient>
          <linearGradient id="land-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(150,168,205,0.42)" />
            <stop offset="100%" stopColor="rgba(125,150,190,0.28)" />
          </linearGradient>
        </defs>

        <rect width="1000" height="500" fill="url(#region-map-glow)" opacity="0.55" />

        <motion.g
          animate={{ x: tx, y: ty, scale }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          style={{ originX: 0, originY: 0 }}
        >
          <path
            className="region-map-land"
            d={WORLD_LAND_PATH}
            fill="url(#land-fill)"
            stroke="rgba(90,110,150,0.55)"
            strokeWidth={1.1}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

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
