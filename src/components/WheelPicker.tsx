import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

type Props = {
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  formatLabel?: (v: number) => string
  visibleCount?: number
  itemHeight?: number
  className?: string
  'aria-label'?: string
}

function wrapIndex(i: number, span: number) {
  return ((i % span) + span) % span
}

/**
 * Apple Alarm-style looping drum picker (1…N wraps).
 * Drag vertically; snaps on release. Past max → min, before min → max.
 */
export function WheelPicker({
  min,
  max,
  value,
  onChange,
  formatLabel = (v) => String(v),
  visibleCount = 5,
  itemHeight = 40,
  className = '',
  'aria-label': ariaLabel = '选择',
}: Props) {
  const span = Math.max(1, max - min + 1)
  const mid = Math.floor(visibleCount / 2)
  const height = itemHeight * visibleCount

  /** Continuous index: 0 = min, span-1 = max, and beyond for looping. */
  const [index, setIndex] = useState(() => wrapIndex(value - min, span))
  const indexRef = useRef(index)
  const dragging = useRef(false)
  const lastY = useRef(0)
  const vel = useRef(0)
  const lastT = useRef(0)
  const raf = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const selected = min + wrapIndex(Math.round(index), span)

  useEffect(() => {
    if (dragging.current) return
    const next = wrapIndex(value - min, span)
    // Pick nearest equivalent to current index to avoid jumps
    const cur = indexRef.current
    const base = Math.round(cur / span) * span + next
    const candidates = [base - span, base, base + span]
    let best = candidates[0]
    for (const c of candidates) {
      if (Math.abs(c - cur) < Math.abs(best - cur)) best = c
    }
    indexRef.current = best
    setIndex(best)
  }, [value, min, span])

  const emit = useCallback(
    (raw: number) => {
      const snapped = Math.round(raw)
      const norm = wrapIndex(snapped, span)
      // Keep index near 0..span for stability
      indexRef.current = norm
      setIndex(norm)
      onChangeRef.current(min + norm)
    },
    [min, span],
  )

  const stopRaf = () => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
  }

  useEffect(() => () => stopRaf(), [])

  const coast = useCallback(
    (v0: number) => {
      stopRaf()
      let v = v0
      let i = indexRef.current
      const step = () => {
        v *= 0.91
        if (Math.abs(v) < 0.015) {
          emit(i)
          return
        }
        i += v
        indexRef.current = i
        setIndex(i)
        raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    },
    [emit],
  )

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    stopRaf()
    dragging.current = true
    lastY.current = e.clientY
    lastT.current = performance.now()
    vel.current = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const now = performance.now()
    const dy = e.clientY - lastY.current
    const dt = Math.max(8, now - lastT.current)
    // Finger moves down → content follows → index decreases
    const d = -dy / itemHeight
    const next = indexRef.current + d
    indexRef.current = next
    setIndex(next)
    vel.current = d / (dt / 16)
    lastY.current = e.clientY
    lastT.current = now
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (Math.abs(vel.current) > 0.04) coast(vel.current)
    else emit(indexRef.current)
  }

  const items = useMemo(() => {
    const out: { key: string; value: number; top: number; active: boolean }[] = []
    const center = index
    const sel = wrapIndex(Math.round(center), span)
    for (let i = -visibleCount - 2; i <= visibleCount + 2; i++) {
      const absIdx = Math.round(center) + i
      const norm = wrapIndex(absIdx, span)
      const val = min + norm
      const top = (absIdx - center) * itemHeight + mid * itemHeight
      out.push({
        key: `${absIdx}`,
        value: val,
        top,
        active: norm === sel,
      })
    }
    return out
  }, [index, min, span, itemHeight, mid, visibleCount])

  const stepBy = (dir: -1 | 1) => {
    const cur = wrapIndex(Math.round(indexRef.current), span)
    const next = wrapIndex(cur + dir, span)
    emit(next)
  }

  return (
    <div
      className={`wheel-picker ${className}`.trim()}
      style={{ height }}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={`wheel-opt-${selected}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault()
          stepBy(-1)
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault()
          stepBy(1)
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="wheel-picker-fade wheel-picker-fade-top" aria-hidden />
      <div className="wheel-picker-fade wheel-picker-fade-bottom" aria-hidden />
      <div
        className="wheel-picker-highlight"
        aria-hidden
        style={{ height: itemHeight, top: mid * itemHeight }}
      />
      <div className="wheel-picker-track">
        {items.map((it) => (
          <div
            key={it.key}
            id={it.active ? `wheel-opt-${it.value}` : undefined}
            className={`wheel-picker-item${it.active ? ' is-selected' : ''}`}
            style={{
              height: itemHeight,
              lineHeight: `${itemHeight}px`,
              transform: `translateY(${it.top}px)`,
            }}
            role="option"
            aria-selected={it.active}
          >
            {formatLabel(it.value)}
          </div>
        ))}
      </div>
    </div>
  )
}
