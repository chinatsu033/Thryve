import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type Mode = 'hour' | 'minute'

type Props = {
  /** 0–23 */
  hour: number
  /** 0–59 */
  minute: number
  mode: Mode
  onHourChange: (h: number) => void
  onMinuteChange: (m: number) => void
  onHourCommit: () => void
  onMinuteCommit: () => void
  /**
   * Continuous fractional hours (0–24) while dragging — every pointer move.
   * Use for live sky/scene updates; snapped hour/minute still go through onHour/MinuteChange.
   */
  onLiveHoursChange?: (hours: number) => void
  chip?: string
}

const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 118
const INNER_R = 72
const MINUTE_R = 100

function angleToHour24(angleRad: number, radius: number): number {
  let deg = ((angleRad * 180) / Math.PI + 90 + 360) % 360
  const outer = radius >= (OUTER_R + INNER_R) / 2
  const idx = Math.round(deg / 30) % 12
  if (outer) return idx
  return idx === 0 ? 12 : idx + 12
}

/** Continuous 0–24h from angle (no snap) for live background. */
function angleToHour24Continuous(angleRad: number, radius: number): number {
  let deg = ((angleRad * 180) / Math.PI + 90 + 360) % 360
  const outer = radius >= (OUTER_R + INNER_R) / 2
  const pos = deg / 30 // 0..12
  if (outer) return pos % 12
  return pos === 0 ? 12 : pos + 12
}

function angleToMinute(angleRad: number): number {
  let deg = ((angleRad * 180) / Math.PI + 90 + 360) % 360
  return Math.round(deg / 6) % 60
}

function angleToMinuteContinuous(angleRad: number): number {
  let deg = ((angleRad * 180) / Math.PI + 90 + 360) % 360
  return (deg / 6) % 60
}

function hourPos(h: number): { x: number; y: number; r: number } {
  const isInner = h >= 12
  const r = isInner ? INNER_R : OUTER_R
  const display = h % 12
  const rad = ((display * 30 - 90) * Math.PI) / 180
  return { x: CX + Math.cos(rad) * r, y: CY + Math.sin(rad) * r, r }
}

function minutePos(m: number): { x: number; y: number } {
  const rad = ((m * 6 - 90) * Math.PI) / 180
  return { x: CX + Math.cos(rad) * MINUTE_R, y: CY + Math.sin(rad) * MINUTE_R }
}

export function AnalogClockPicker({
  hour,
  minute,
  mode,
  onHourChange,
  onMinuteChange,
  onHourCommit,
  onMinuteCommit,
  onLiveHoursChange,
  chip,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const hourRef = useRef(hour)
  const minuteRef = useRef(minute)
  const [liveHour, setLiveHour] = useState(hour)
  const [liveMinute, setLiveMinute] = useState(minute)

  useEffect(() => {
    hourRef.current = hour
    if (!dragging.current) setLiveHour(hour)
  }, [hour])
  useEffect(() => {
    minuteRef.current = minute
    if (!dragging.current) setLiveMinute(minute)
  }, [minute])

  const pointerToLocal = useCallback((clientX: number, clientY: number) => {
    const el = svgRef.current
    if (!el) return { angle: 0, radius: OUTER_R }
    const rect = el.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * SIZE - CX
    const y = ((clientY - rect.top) / rect.height) * SIZE - CY
    return { angle: Math.atan2(y, x), radius: Math.hypot(x, y) }
  }, [])

  const applyPointer = useCallback(
    (clientX: number, clientY: number) => {
      const { angle, radius } = pointerToLocal(clientX, clientY)
      if (mode === 'hour') {
        const hSnap = angleToHour24(angle, radius)
        const hCont = angleToHour24Continuous(angle, radius)
        setLiveHour(hSnap)
        hourRef.current = hSnap
        onHourChange(hSnap)
        onLiveHoursChange?.(hCont + minuteRef.current / 60)
      } else {
        const mSnap = angleToMinute(angle)
        const mCont = angleToMinuteContinuous(angle)
        setLiveMinute(mSnap)
        minuteRef.current = mSnap
        onMinuteChange(mSnap)
        onLiveHoursChange?.(hourRef.current + mCont / 60)
      }
    },
    [mode, onHourChange, onMinuteChange, onLiveHoursChange, pointerToLocal],
  )

  const onPointerDown = (e: ReactPointerEvent) => {
    e.preventDefault()
    dragging.current = true
    svgRef.current?.setPointerCapture?.(e.pointerId)
    applyPointer(e.clientX, e.clientY)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return
    applyPointer(e.clientX, e.clientY)
  }

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    applyPointer(e.clientX, e.clientY)
    if (mode === 'hour') onHourCommit()
    else onMinuteCommit()
  }

  const hand =
    mode === 'hour'
      ? hourPos(liveHour)
      : { ...minutePos(liveMinute), r: MINUTE_R }

  const display =
    mode === 'hour'
      ? `${String(liveHour).padStart(2, '0')}`
      : `${String(liveMinute).padStart(2, '0')}`

  return (
    <div className="clock-picker">
      {chip ? <span className="clock-chip">{chip}</span> : null}
      <div className="clock-digital" aria-live="polite">
        {mode === 'hour' ? (
          <>
            <span className="clock-digital-active">{display}</span>
            <span className="clock-digital-sep">:</span>
            <span>{String(liveMinute).padStart(2, '0')}</span>
          </>
        ) : (
          <>
            <span>{String(liveHour).padStart(2, '0')}</span>
            <span className="clock-digital-sep">:</span>
            <span className="clock-digital-active">{display}</span>
          </>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="clock-face"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label={mode === 'hour' ? '选择小时' : '选择分钟'}
        aria-valuemin={mode === 'hour' ? 0 : 0}
        aria-valuemax={mode === 'hour' ? 23 : 59}
        aria-valuenow={mode === 'hour' ? liveHour : liveMinute}
      >
        <circle cx={CX} cy={CY} r={OUTER_R + 14} fill="rgba(255,255,255,0.18)" />
        <circle cx={CX} cy={CY} r={OUTER_R + 14} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

        <line
          x1={CX}
          y1={CY}
          x2={hand.x}
          y2={hand.y}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="5" fill="#fff" />
        <circle cx={hand.x} cy={hand.y} r="18" fill="var(--color-primary, #FF8A65)" opacity="0.95" />

        {mode === 'hour'
          ? Array.from({ length: 24 }).map((_, h) => {
              const p = hourPos(h)
              const selected = h === liveHour
              return (
                <text
                  key={h}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={selected ? 'clock-num selected' : 'clock-num'}
                  fontSize={h >= 12 ? 11 : 13}
                  fill={selected ? '#fff' : 'rgba(255,255,255,0.88)'}
                  fontWeight={selected ? 700 : 500}
                  style={{ pointerEvents: 'none' }}
                >
                  {h}
                </text>
              )
            })
          : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
              const p = minutePos(m)
              const selected = liveMinute === m
              return (
                <text
                  key={m}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={selected ? 'clock-num selected' : 'clock-num'}
                  fontSize="13"
                  fill={selected ? '#fff' : 'rgba(255,255,255,0.88)'}
                  fontWeight={selected ? 700 : 500}
                  style={{ pointerEvents: 'none' }}
                >
                  {String(m).padStart(2, '0')}
                </text>
              )
            })}
      </svg>
    </div>
  )
}
