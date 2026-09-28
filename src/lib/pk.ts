/**
 * Plasma-concentration simulation (血药浓度模拟).
 *
 * One-compartment oral model with first-order absorption (ka) and first-order
 * elimination (ke) — the Bateman function — and linear superposition of doses.
 * All doses are treated as equal "unit" doses; the output is RELATIVE
 * concentration (100 = the steady-state peak of the planned regimen), never ng/mL,
 * because bioavailability (F) and volume of distribution (V) vary per person.
 *
 * Pure functions only (no React / Supabase), so they are unit-testable.
 */

export const HOUR_MS = 3_600_000
export const DAY_MS = 24 * HOUR_MS

export interface PkParams {
  /** Elimination half-life, hours. */
  halfLifeH: number
  /** Time to peak after a single oral dose, hours. */
  tmaxH: number
}

export interface PkRates {
  ka: number
  ke: number
}

/** ke = ln2 / t½ (per hour). */
export function keFromHalfLife(halfLifeH: number): number {
  if (!(halfLifeH > 0)) throw new Error('halfLifeH must be > 0')
  return Math.LN2 / halfLifeH
}

/** Tmax of the Bateman function for given ka, ke (per hour). */
export function tmaxFromRates(ka: number, ke: number): number {
  if (Math.abs(ka - ke) < 1e-12 * Math.max(ka, ke)) return 1 / ke
  return Math.log(ka / ke) / (ka - ke)
}

/**
 * Solve ka from Tmax and ke. Tmax(ka) is strictly decreasing in ka on (0, ∞),
 * equal to 1/ke at ka = ke. So a unique solution always exists:
 * ka > ke for Tmax < 1/ke (the usual case), ka < ke ("flip-flop") otherwise.
 */
export function kaFromTmax(tmaxH: number, ke: number): number {
  if (!(tmaxH > 0)) throw new Error('tmaxH must be > 0')
  if (!(ke > 0)) throw new Error('ke must be > 0')
  let lo = Math.log(ke * 1e-6)
  let hi = Math.log(Math.max(1e4, ke * 1e6))
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const t = tmaxFromRates(Math.exp(mid), ke)
    if (t > tmaxH) lo = mid
    else hi = mid
    if (hi - lo < 1e-12) break
  }
  return Math.exp((lo + hi) / 2)
}

export function ratesFromParams(p: PkParams): PkRates {
  const ke = keFromHalfLife(p.halfLifeH)
  return { ke, ka: kaFromTmax(p.tmaxH, ke) }
}

/**
 * Concentration at time t (hours after one unit dose), with F/V = 1.
 * C(t) = ka/(ka−ke) · (e^(−ke·t) − e^(−ka·t)); limit ka→ke: ke·t·e^(−ke·t).
 */
export function unitDoseConcentration(tH: number, r: PkRates): number {
  if (!(tH > 0)) return 0
  const { ka, ke } = r
  if (Math.abs(ka - ke) < 1e-9 * Math.max(ka, ke)) return ke * tH * Math.exp(-ke * tH)
  return (ka / (ka - ke)) * (Math.exp(-ke * tH) - Math.exp(-ka * tH))
}

/** Superposition of unit doses given as epoch-ms timestamps. */
export function concentrationAt(tMs: number, doseTimesMs: readonly number[], r: PkRates): number {
  let c = 0
  for (const d of doseTimesMs) {
    if (d >= tMs) continue
    c += unitDoseConcentration((tMs - d) / HOUR_MS, r)
  }
  return c
}

export interface CurvePoint {
  t: number
  c: number
}

export function sampleCurve(
  doseTimesMs: readonly number[],
  r: PkRates,
  fromMs: number,
  toMs: number,
  stepMs: number,
): CurvePoint[] {
  const out: CurvePoint[] = []
  const sorted = [...doseTimesMs].sort((a, b) => a - b)
  for (let t = fromMs; t <= toMs + 1e-6; t += stepMs) {
    out.push({ t, c: concentrationAt(t, sorted, r) })
  }
  return out
}

/* ——— dose schedules ——— */

export interface SchedulePlan {
  /** Local "HH:mm" strings; empty → one dose at 09:00. */
  times: string[]
  /** 0=Sun…6=Sat; null/[] = every day. Only used when intervalDays <= 1. */
  daysOfWeek: number[] | null
  intervalDays: number
  /** yyyy-MM-dd anchor for interval cycles. */
  anchorDate: string
}

function parseLocalDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function startOfLocalDay(ms: number): Date {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d
}

function calendarDayDiff(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ua - ub) / DAY_MS)
}

/**
 * Is `day` a dosing day? Unlike lib/meds#isMedScheduledOn this extends interval
 * cycles backwards before the anchor, so a "long-term regular use" assumption works.
 */
export function isPlanDay(plan: SchedulePlan, day: Date): boolean {
  const n = Math.max(1, Math.round(plan.intervalDays || 1))
  if (n <= 1) {
    const dow = plan.daysOfWeek
    if (!dow || dow.length === 0) return true
    return dow.includes(day.getDay())
  }
  const diff = calendarDayDiff(day, parseLocalDate(plan.anchorDate))
  return ((diff % n) + n) % n === 0
}

function parseHm(raw: string): [number, number] | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return [h, min]
}

/** All planned dose instants in [fromMs, toMs] (local time). */
export function planDoseTimes(plan: SchedulePlan, fromMs: number, toMs: number): number[] {
  const times = plan.times.map(parseHm).filter((x): x is [number, number] => Boolean(x))
  const slots = times.length ? times : [[9, 0] as [number, number]]
  const out: number[] = []
  const day = startOfLocalDay(fromMs)
  // Walk local calendar days (DST-safe: setDate instead of +24h).
  for (let guard = 0; guard < 4000 && day.getTime() <= toMs; guard++) {
    if (isPlanDay(plan, day)) {
      for (const [h, m] of slots) {
        const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime()
        if (t >= fromMs && t <= toMs) out.push(t)
      }
    }
    day.setDate(day.getDate() + 1)
  }
  return out.sort((a, b) => a - b)
}

/** Typical gap between planned doses, hours (for phase detection). */
export function typicalDoseIntervalH(plan: SchedulePlan): number {
  const n = Math.max(1, plan.times.filter((t) => parseHm(t)).length)
  const interval = Math.max(1, Math.round(plan.intervalDays || 1))
  let perWeekFactor = 1
  if (interval <= 1 && plan.daysOfWeek && plan.daysOfWeek.length > 0) {
    perWeekFactor = 7 / plan.daysOfWeek.length
  }
  return Math.max(2, (24 * interval * perWeekFactor) / n)
}

/** Warm-up long enough that earlier doses contribute < 0.1% (10 half-lives), at least 3 days. */
export function warmupMs(p: PkParams): number {
  return Math.max(3 * DAY_MS, 10 * p.halfLifeH * HOUR_MS)
}

/**
 * Steady-state peak (absolute, unit doses) for a plan: simulate ≥10 half-lives of
 * regular dosing, then take the max over a trailing window that covers the whole
 * weekly / interval pattern.
 */
export function steadyStatePeak(plan: SchedulePlan, p: PkParams, refMs = Date.UTC(2026, 0, 5)): number {
  const r = ratesFromParams(p)
  const windowMs = Math.max(7, Math.max(1, plan.intervalDays) * 2) * DAY_MS
  const end = refMs
  const start = end - windowMs
  const doses = planDoseTimes(plan, start - warmupMs(p), end)
  const stepMs = Math.min(10 * 60_000, Math.max(60_000, (p.tmaxH * HOUR_MS) / 12))
  let peak = 0
  for (let t = start; t <= end; t += stepMs) {
    const c = concentrationAt(t, doses, r)
    if (c > peak) peak = c
  }
  return peak
}

/** Accumulation ratio at steady state for a fixed interval τ (h): 1 / (1 − e^(−ke·τ)). */
export function accumulationRatio(halfLifeH: number, tauH: number): number {
  return 1 / (1 - Math.exp(-keFromHalfLife(halfLifeH) * tauH))
}

/** Hours to reach ~97% of steady state ≈ 5 half-lives. */
export function timeToSteadyStateH(halfLifeH: number): number {
  return 5 * halfLifeH
}

/* ——— interpretation ——— */

export type PkPhase = 'none' | 'steady' | 'peak' | 'trough' | 'rising' | 'falling'

export interface Extremum {
  t: number
  c: number
  kind: 'peak' | 'trough'
}

/** Local maxima/minima on a sampled curve, filtered by prominence (same units as c). */
export function findExtrema(points: readonly CurvePoint[], minProminence: number): Extremum[] {
  const raw: Extremum[] = []
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1].c
    const b = points[i].c
    const c = points[i + 1].c
    if (b > a && b >= c) raw.push({ t: points[i].t, c: b, kind: 'peak' })
    else if (b < a && b <= c) raw.push({ t: points[i].t, c: b, kind: 'trough' })
  }
  // Keep only extrema that differ enough from their neighbours of the opposite kind.
  return raw.filter((e, i) => {
    const prev = raw[i - 1]
    const next = raw[i + 1]
    const diffs = [prev, next].filter(Boolean).map((n) => Math.abs(e.c - (n as Extremum).c))
    if (!diffs.length) return false
    return Math.max(...diffs) >= minProminence
  })
}

/**
 * Where is "now" within the dosing cycle? Uses the curve in [now − τ, now + τ].
 * cPct values are relative (100 = steady-state peak).
 */
export function classifyPhase(points: readonly CurvePoint[], nowMs: number, tauH: number): PkPhase {
  if (points.length < 3) return 'none'
  const win = points.filter((p) => Math.abs(p.t - nowMs) <= tauH * HOUR_MS)
  if (win.length < 3) return 'none'
  let idx = 0
  for (let i = 0; i < points.length; i++) {
    if (Math.abs(points[i].t - nowMs) < Math.abs(points[idx].t - nowMs)) idx = i
  }
  const cNow = points[idx].c
  const max = Math.max(...win.map((p) => p.c))
  const min = Math.min(...win.map((p) => p.c))
  if (max < 3) return 'none'
  if (max - min < Math.max(4, 0.15 * max)) return 'steady'
  const pos = (cNow - min) / (max - min)
  if (pos >= 0.85) return 'peak'
  if (pos <= 0.15) return 'trough'
  const before = points[Math.max(0, idx - 1)].c
  const after = points[Math.min(points.length - 1, idx + 1)].c
  return after - before >= 0 ? 'rising' : 'falling'
}
