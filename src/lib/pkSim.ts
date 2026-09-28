/**
 * Glue between Thryve medication records and the PK math (lib/pk).
 * Builds the relative-concentration curve shown in the 血药浓度模拟 sheet.
 */
import type { MedLog, Medication } from '../types'
import {
  DAY_MS,
  HOUR_MS,
  classifyPhase,
  concentrationAt,
  findExtrema,
  planDoseTimes,
  ratesFromParams,
  steadyStatePeak,
  typicalDoseIntervalH,
  warmupMs,
  type Extremum,
  type PkParams,
  type PkPhase,
  type SchedulePlan,
} from './pk'

export type PkSourceMode = 'logs' | 'plan'

export function planFromMed(med: Medication): SchedulePlan {
  return {
    times: med.reminderTimes ?? [],
    daysOfWeek: med.daysOfWeek,
    intervalDays: Math.max(1, med.intervalDays ?? 1),
    anchorDate: med.anchorDate || med.createdAt.slice(0, 10),
  }
}

function localMs(dateKey: string, hm: string | null): number | null {
  const [y, mo, d] = dateKey.split('-').map(Number)
  if (!y || !mo || !d) return null
  let h = 9
  let m = 0
  if (hm) {
    const mm = hm.match(/^(\d{1,2}):(\d{2})$/)
    if (mm) {
      h = Number(mm[1])
      m = Number(mm[2])
    }
  }
  return new Date(y, mo - 1, d, h, m).getTime()
}

/** Within this window around the reminder slot, the tap time (takenAt) is trusted as the real intake time. */
export const TAKEN_AT_TRUST_WINDOW_H = 2

/**
 * When was a logged dose actually taken?
 * - Reminder slot known: use the tap time if it is within ±2 h of the slot
 *   (logged in real time), otherwise the slot time (likely back-filled).
 * - No slot: tap time if it falls on the logged date, else 09:00 that day.
 */
export function logDoseTimeMs(log: MedLog): number | null {
  const slot = localMs(log.takenDate, log.takenTime)
  const tap = Date.parse(log.takenAt)
  if (slot == null) return Number.isFinite(tap) ? tap : null
  if (!Number.isFinite(tap)) return slot
  if (log.takenTime) {
    return Math.abs(tap - slot) <= TAKEN_AT_TRUST_WINDOW_H * HOUR_MS ? tap : slot
  }
  const tapDay = new Date(tap)
  const sameDay =
    tapDay.getFullYear() === new Date(slot).getFullYear() &&
    tapDay.getMonth() === new Date(slot).getMonth() &&
    tapDay.getDate() === new Date(slot).getDate()
  return sameDay ? tap : slot
}

export function loggedDoseTimes(med: Medication, logs: readonly MedLog[]): number[] {
  return logs
    .filter((l) => l.medicationId === med.id && !l.skipped)
    .map(logDoseTimeMs)
    .filter((t): t is number => t != null)
    .sort((a, b) => a - b)
}

/** Default source: logs if this med has a taken log in the past 7 days. */
export function defaultSourceMode(med: Medication, logs: readonly MedLog[], nowMs: number): PkSourceMode {
  const since = nowMs - 7 * DAY_MS
  return loggedDoseTimes(med, logs).some((t) => t >= since && t <= nowMs) ? 'logs' : 'plan'
}

/** How many days of logs to fetch so earlier doses no longer matter (≥ 10 half-lives, capped). */
export function logLookbackDays(halfLifeH: number, pastDays = 3): number {
  return Math.min(90, Math.ceil((10 * halfLifeH) / 24) + pastDays + 1)
}

export interface PkDoseMark {
  t: number
  kind: 'taken' | 'planned'
}

export interface PkSimulation {
  fromMs: number
  toMs: number
  nowMs: number
  /** c = % of the planned regimen's steady-state peak. */
  points: Array<{ t: number; c: number }>
  doses: PkDoseMark[]
  extrema: Extremum[]
  phase: PkPhase
  nowPct: number
  nextPeak: Extremum | null
  maxPct: number
  tauH: number
}

export function buildPkSimulation(opts: {
  med: Medication
  logs: readonly MedLog[]
  params: PkParams
  nowMs: number
  mode: PkSourceMode
  pastDays?: number
  futureDays?: number
  stepMin?: number
}): PkSimulation {
  const { med, logs, params, nowMs, mode } = opts
  const pastDays = opts.pastDays ?? 3
  const futureDays = opts.futureDays ?? 2
  const stepMs = (opts.stepMin ?? 15) * 60_000
  const plan = planFromMed(med)
  const rates = ratesFromParams(params)
  const fromMs = nowMs - pastDays * DAY_MS
  const toMs = nowMs + futureDays * DAY_MS

  let pastDoses: number[]
  if (mode === 'logs') {
    pastDoses = loggedDoseTimes(med, logs).filter((t) => t <= nowMs)
  } else {
    pastDoses = planDoseTimes(plan, fromMs - warmupMs(params), nowMs)
  }
  const futureDoses = planDoseTimes(plan, nowMs + 1, toMs)
  const all = [...pastDoses, ...futureDoses]

  const ref = steadyStatePeak(plan, params) || 1
  const points: Array<{ t: number; c: number }> = []
  for (let t = fromMs; t <= toMs + 1; t += stepMs) {
    points.push({ t, c: (concentrationAt(t, all, rates) / ref) * 100 })
  }
  const nowPct = (concentrationAt(nowMs, all, rates) / ref) * 100
  const tauH = typicalDoseIntervalH(plan)
  const extrema = findExtrema(points, 3)
  const phase = classifyPhase(points, nowMs, tauH)
  const nextPeak = extrema.find((e) => e.kind === 'peak' && e.t > nowMs) ?? null
  const doses: PkDoseMark[] = [
    // In plan mode past doses are only assumed, so they are drawn like planned ones.
    ...pastDoses.filter((t) => t >= fromMs).map((t) => ({ t, kind: mode === 'logs' ? ('taken' as const) : ('planned' as const) })),
    ...futureDoses.map((t) => ({ t, kind: 'planned' as const })),
  ]
  const maxPct = points.reduce((m, p) => Math.max(m, p.c), 0)
  return { fromMs, toMs, nowMs, points, doses, extrema, phase, nowPct, nextPeak, maxPct, tauH }
}
