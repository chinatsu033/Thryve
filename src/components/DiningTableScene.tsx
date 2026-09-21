import { useId, useMemo } from 'react'
import { normalizeAppetite } from '../lib/eating'

type Props = {
  /** Appetite 1–5 (闭塞→饱满); continuous values ok. */
  appetite: number
  className?: string
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/** Soft warm wall tint shifts slightly with appetite fullness. */
function wallColors(t: number) {
  const r = Math.round(232 + (245 - 232) * t)
  const g = Math.round(210 + (228 - 210) * t)
  const b = Math.round(180 + (200 - 180) * t)
  return { top: `rgb(${r},${g},${b})`, bot: `rgb(${r - 18},${g - 22},${b - 28})` }
}

export function DiningTableScene({ appetite, className = '' }: Props) {
  const uid = useId().replace(/:/g, '')
  const level = normalizeAppetite(appetite)
  const t = clamp01((appetite - 1) / 4)
  const walls = useMemo(() => wallColors(t), [t])

  const wallId = `dine-wall-${uid}`
  const woodId = `dine-wood-${uid}`
  const clothId = `dine-cloth-${uid}`

  // Progressive dish visibility by level (1 sparse → 5 abundant)
  const dishOp = (minLevel: number) => {
    if (level < minLevel) return 0
    // Gentle fade when just crossing the threshold (continuous slider)
    const raw = appetite - (minLevel - 0.55)
    return clamp01(raw / 0.7)
  }

  return (
    <div className={`dining-scene ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 320 220" className="dining-svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={walls.top} />
            <stop offset="100%" stopColor={walls.bot} />
          </linearGradient>
          <linearGradient id={woodId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C48A52" />
            <stop offset="45%" stopColor="#A66B3C" />
            <stop offset="100%" stopColor="#7A4A28" />
          </linearGradient>
          <linearGradient id={clothId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFF3E0" />
            <stop offset="50%" stopColor="#FFE0B2" />
            <stop offset="100%" stopColor="#FFECB3" />
          </linearGradient>
        </defs>

        {/* Warm room wall */}
        <rect width="320" height="220" fill={`url(#${wallId})`} />

        {/* Soft window light */}
        <ellipse cx="260" cy="48" rx="52" ry="36" fill="#FFF8E1" opacity={0.35 + t * 0.25} />
        <rect x="220" y="18" width="70" height="58" rx="4" fill="#FFE082" opacity={0.22 + t * 0.18} />
        <line x1="255" y1="18" x2="255" y2="76" stroke="#FFECB3" strokeWidth="2" opacity="0.45" />
        <line x1="220" y1="47" x2="290" y2="47" stroke="#FFECB3" strokeWidth="2" opacity="0.45" />

        {/* Shelf / picture hints */}
        <rect x="28" y="36" width="48" height="34" rx="3" fill="#EFEBE9" opacity="0.7" />
        <circle cx="52" cy="53" r="10" fill="#FFCC80" opacity="0.55" />
        <rect x="36" y="78" width="36" height="4" rx="1" fill="#8D6E63" opacity="0.5" />

        {/* Floor */}
        <path d="M0 168 L320 168 L320 220 L0 220 Z" fill="#D7CCC8" />
        <path d="M0 168 L320 168 L320 176 L0 176 Z" fill="#BCAAA4" opacity="0.55" />

        {/* Table shadow */}
        <ellipse cx="160" cy="198" rx="118" ry="14" fill="#5D4037" opacity="0.18" />

        {/* Wooden table top (perspective ellipse + apron) */}
        <ellipse cx="160" cy="158" rx="128" ry="28" fill={`url(#${woodId})`} />
        <ellipse cx="160" cy="154" rx="122" ry="24" fill="#D4A574" opacity="0.35" />
        {/* Wood grain */}
        <path
          d="M50 152 Q100 146 160 150 Q220 154 270 148"
          fill="none"
          stroke="#8D5A2B"
          strokeWidth="1.2"
          opacity="0.35"
        />
        <path
          d="M60 160 Q120 166 160 162 Q210 158 265 163"
          fill="none"
          stroke="#6D4C41"
          strokeWidth="1"
          opacity="0.28"
        />
        {/* Table apron / legs hint */}
        <path d="M48 168 L52 198 L68 198 L72 172 Z" fill="#6D4C41" opacity="0.85" />
        <path d="M248 172 L252 198 L268 198 L272 168 Z" fill="#5D4037" opacity="0.85" />
        <rect x="70" y="166" width="180" height="8" rx="2" fill="#8D6E63" opacity="0.7" />

        {/* Soft runner cloth (appears from mild onward) */}
        <g className="dining-dish" style={{ opacity: dishOp(3) * 0.85, transition: 'opacity 0.45s ease' }}>
          <ellipse cx="160" cy="156" rx="70" ry="12" fill={`url(#${clothId})`} opacity="0.9" />
        </g>

        {/* —— Dishes (layered; opacity animates via CSS transition on fill groups) —— */}

        {/* Level 1: lonely empty plate + cup */}
        <g className="dining-dish" style={{ opacity: Math.max(0, 0.9 - dishOp(3) * 0.95), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="150" cy="152" rx="28" ry="10" fill="#ECEFF1" />
          <ellipse cx="150" cy="150" rx="22" ry="7" fill="#CFD8DC" opacity="0.55" />
          <ellipse cx="150" cy="149" rx="10" ry="3" fill="#B0BEC5" opacity="0.35" />
        </g>

        <g className="dining-dish" style={{ opacity: 0.55 + t * 0.45, transition: 'opacity 0.45s ease' }}>
          <ellipse cx="210" cy="148" rx="9" ry="4" fill="#FFF8E1" />
          <path d="M201 148 L203 138 Q210 134 217 138 L219 148 Z" fill="#FFE0B2" />
          <path d="M219 142 Q226 142 226 147 Q226 151 219 150" fill="none" stroke="#FFCC80" strokeWidth="2" />
          <ellipse cx="210" cy="138" rx="7" ry="2.5" fill="#FFF3E0" />
          {/* Steam at higher levels */}
          <g style={{ opacity: dishOp(3), transition: 'opacity 0.45s ease' }}>
            <path d="M207 132 Q205 126 208 122" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.55" />
            <path d="M213 131 Q215 125 212 120" fill="none" stroke="#fff" strokeWidth="1.1" opacity="0.45" />
          </g>
        </g>

        {/* Level 2: soup bowl */}
        <g className="dining-dish" style={{ opacity: dishOp(2), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="105" cy="155" rx="22" ry="9" fill="#EFEBE9" />
          <ellipse cx="105" cy="152" rx="18" ry="7" fill="#FFCC80" />
          <ellipse cx="105" cy="150" rx="14" ry="5" fill="#FFB74D" />
          <circle cx="100" cy="149" r="2.2" fill="#FF8A65" opacity="0.8" />
          <circle cx="110" cy="150" r="1.8" fill="#A5D6A7" opacity="0.85" />
          <path d="M98 146 Q105 142 112 146" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4" />
        </g>

        {/* Level 3: rice bowl + veggies */}
        <g className="dining-dish" style={{ opacity: dishOp(3), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="160" cy="148" rx="20" ry="8" fill="#EFEBE9" />
          <path d="M142 148 Q160 162 178 148" fill="#ECEFF1" />
          <ellipse cx="160" cy="144" rx="16" ry="7" fill="#FFF8E1" />
          <ellipse cx="160" cy="142" rx="13" ry="5.5" fill="#FFFFFF" />
          {/* Rice grains hint */}
          <circle cx="154" cy="141" r="1.1" fill="#FFFDE7" />
          <circle cx="162" cy="140" r="1" fill="#FFF9C4" />
          <circle cx="168" cy="142" r="0.9" fill="#FFFDE7" />
          <circle cx="157" cy="144" r="0.8" fill="#FFF9C4" />
        </g>

        <g className="dining-dish" style={{ opacity: dishOp(3), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="210" cy="160" rx="24" ry="9" fill="#E8F5E9" />
          <ellipse cx="210" cy="157" rx="20" ry="7" fill="#C8E6C9" />
          {/* Veggie bits */}
          <ellipse cx="202" cy="156" rx="5" ry="3" fill="#66BB6A" transform="rotate(-20 202 156)" />
          <ellipse cx="214" cy="155" rx="4.5" ry="2.8" fill="#81C784" transform="rotate(15 214 155)" />
          <ellipse cx="220" cy="158" rx="4" ry="2.5" fill="#A5D6A7" />
          <circle cx="208" cy="159" r="2.5" fill="#FF7043" opacity="0.85" />
        </g>

        <g className="dining-dish" style={{ opacity: dishOp(3), transition: 'opacity 0.45s ease' }}>
          <line x1="118" y1="142" x2="148" y2="136" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="120" y1="145" x2="150" y2="138" stroke="#6D4C41" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Level 4: main dish + noodles */}
        <g className="dining-dish" style={{ opacity: dishOp(4), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="95" cy="142" rx="26" ry="10" fill="#EFEBE9" />
          <ellipse cx="95" cy="139" rx="22" ry="8" fill="#FFAB91" />
          <ellipse cx="95" cy="136" rx="16" ry="5.5" fill="#FF8A65" />
          <path d="M85 135 Q95 130 105 135" fill="#EF5350" opacity="0.7" />
          <ellipse cx="88" cy="138" rx="4" ry="2.5" fill="#FFCC80" />
          <ellipse cx="102" cy="137" rx="3.5" ry="2" fill="#A5D6A7" />
        </g>

        <g className="dining-dish" style={{ opacity: dishOp(4), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="230" cy="145" rx="22" ry="9" fill="#FFF3E0" />
          <ellipse cx="230" cy="142" rx="18" ry="7" fill="#FFE0B2" />
          {/* Noodle swirls */}
          <path
            d="M218 141 Q225 136 232 141 Q238 145 242 140"
            fill="none"
            stroke="#FFCC80"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M220 144 Q228 140 234 144 Q239 147 244 143"
            fill="none"
            stroke="#FFB74D"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="226" cy="140" r="2" fill="#66BB6A" />
          <circle cx="236" cy="142" r="1.6" fill="#EF5350" />
        </g>

        {/* Level 5: fruit plate, teapot, extra bowl — abundant */}
        <g className="dining-dish" style={{ opacity: dishOp(5), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="160" cy="168" rx="30" ry="8" fill="#EFEBE9" />
          <ellipse cx="160" cy="165" rx="26" ry="6.5" fill="#FFF8E1" />
          <circle cx="148" cy="163" r="6" fill="#EF5350" />
          <circle cx="160" cy="161" r="5.5" fill="#FFCA28" />
          <circle cx="172" cy="163" r="5" fill="#66BB6A" />
          <ellipse cx="155" cy="168" rx="4" ry="3" fill="#AB47BC" opacity="0.85" />
          <path d="M148 158 Q148 154 150 154" fill="none" stroke="#43A047" strokeWidth="1.2" />
        </g>

        <g className="dining-dish" style={{ opacity: dishOp(5), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="55" cy="148" rx="14" ry="6" fill="#BCAAA4" />
          <path d="M42 148 Q42 128 55 126 Q68 128 68 148 Z" fill="#A1887F" />
          <ellipse cx="55" cy="126" rx="10" ry="3.5" fill="#8D6E63" />
          <path d="M68 138 Q78 136 78 144 Q78 150 68 148" fill="none" stroke="#8D6E63" strokeWidth="2.5" />
          <rect x="52" y="118" width="6" height="10" rx="2" fill="#6D4C41" />
          <path d="M52 122 Q48 118 52 116" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
        </g>

        <g className="dining-dish" style={{ opacity: dishOp(5), transition: 'opacity 0.45s ease' }}>
          <ellipse cx="265" cy="158" rx="16" ry="6.5" fill="#E3F2FD" />
          <path d="M250 158 Q265 170 280 158" fill="#BBDEFB" />
          <ellipse cx="265" cy="155" rx="12" ry="5" fill="#90CAF9" opacity="0.7" />
          <ellipse cx="265" cy="153" rx="8" ry="3" fill="#64B5F6" opacity="0.5" />
        </g>

        {/* Ambient steam wisps when fuller */}
        <g className="dining-steam" style={{ opacity: t * 0.55, transition: 'opacity 0.45s ease' }}>
          <path d="M130 128 Q128 118 132 110" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.45" />
          <path d="M175 122 Q178 112 174 104" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
          <path d="M200 130 Q198 120 202 112" fill="none" stroke="#fff" strokeWidth="1.1" opacity="0.35" />
        </g>
      </svg>
    </div>
  )
}
