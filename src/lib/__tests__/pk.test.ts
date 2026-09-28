import { describe, expect, it } from 'vitest'
import {
  DAY_MS,
  HOUR_MS,
  accumulationRatio,
  classifyPhase,
  concentrationAt,
  findExtrema,
  isPlanDay,
  kaFromTmax,
  keFromHalfLife,
  planDoseTimes,
  ratesFromParams,
  sampleCurve,
  steadyStatePeak,
  timeToSteadyStateH,
  tmaxFromRates,
  typicalDoseIntervalH,
  unitDoseConcentration,
  type SchedulePlan,
} from '../pk'

const T0 = new Date(2026, 8, 1, 0, 0).getTime() // local midnight

function argmax(fn: (t: number) => number, from: number, to: number, step: number) {
  let best = from
  let bestV = -Infinity
  for (let t = from; t <= to; t += step) {
    const v = fn(t)
    if (v > bestV) {
      bestV = v
      best = t
    }
  }
  return best
}

describe('rate constants', () => {
  it('ke = ln2 / t½', () => {
    expect(keFromHalfLife(10)).toBeCloseTo(Math.LN2 / 10, 12)
    expect(() => keFromHalfLife(0)).toThrow()
  })

  it.each([
    [26, 6.5], // sertraline
    [2.5, 1.6], // zolpidem
    [120, 7], // fluoxetine
    [5, 5.5], // venlafaxine XR (Tmax close to 1/ke)
    [1.5, 3], // flip-flop: Tmax > 1/ke
  ])('kaFromTmax round-trips (t½=%s h, Tmax=%s h)', (hl, tmax) => {
    const ke = keFromHalfLife(hl)
    const ka = kaFromTmax(tmax, ke)
    expect(ka).toBeGreaterThan(0)
    expect(tmaxFromRates(ka, ke)).toBeCloseTo(tmax, 6)
  })

  it('ka > ke when Tmax < 1/ke, ka < ke when Tmax > 1/ke', () => {
    const ke = keFromHalfLife(10) // 1/ke ≈ 14.4 h
    expect(kaFromTmax(2, ke)).toBeGreaterThan(ke)
    expect(kaFromTmax(20, ke)).toBeLessThan(ke)
  })
})

describe('Bateman single dose', () => {
  it('is zero before/at dose time and positive after', () => {
    const r = ratesFromParams({ halfLifeH: 12, tmaxH: 2 })
    expect(unitDoseConcentration(0, r)).toBe(0)
    expect(unitDoseConcentration(-1, r)).toBe(0)
    expect(unitDoseConcentration(1, r)).toBeGreaterThan(0)
  })

  it.each([
    [26, 6.5],
    [2.5, 1.6],
    [1.5, 3],
  ])('peaks at Tmax (t½=%s, Tmax=%s)', (hl, tmax) => {
    const r = ratesFromParams({ halfLifeH: hl, tmaxH: tmax })
    const peak = argmax((t) => unitDoseConcentration(t, r), 0.001, 48, 0.001)
    expect(peak).toBeCloseTo(tmax, 2)
  })

  it('terminal phase halves every half-life once absorption is complete', () => {
    const hl = 20
    const r = ratesFromParams({ halfLifeH: hl, tmaxH: 1 })
    const c1 = unitDoseConcentration(60, r)
    const c2 = unitDoseConcentration(60 + hl, r)
    expect(c2 / c1).toBeCloseTo(0.5, 4)
  })

  it('handles ka == ke limit continuously', () => {
    const ke = keFromHalfLife(8)
    const near = unitDoseConcentration(5, { ka: ke * (1 + 1e-7), ke })
    const exact = unitDoseConcentration(5, { ka: ke, ke })
    expect(exact).toBeCloseTo(near, 6)
  })

  it('AUC of one unit dose = 1/ke (F/V = 1)', () => {
    const r = ratesFromParams({ halfLifeH: 6, tmaxH: 1.5 })
    let auc = 0
    const dt = 0.01
    for (let t = 0; t < 200; t += dt) auc += unitDoseConcentration(t + dt / 2, r) * dt
    expect(auc).toBeCloseTo(1 / r.ke, 2)
  })
})

describe('superposition', () => {
  const r = ratesFromParams({ halfLifeH: 12, tmaxH: 2 })

  it('is linear: two simultaneous doses = 2× one dose', () => {
    const t = T0 + 5 * HOUR_MS
    expect(concentrationAt(t, [T0, T0], r)).toBeCloseTo(2 * concentrationAt(t, [T0], r), 12)
  })

  it('ignores future doses', () => {
    expect(concentrationAt(T0 + HOUR_MS, [T0 + 2 * HOUR_MS], r)).toBe(0)
  })

  it('matches the closed-form steady-state curve for once-daily dosing', () => {
    const hl = 26
    const tmax = 6.5
    const tau = 24
    const rr = ratesFromParams({ halfLifeH: hl, tmaxH: tmax })
    const doses = Array.from({ length: 60 }, (_, i) => T0 + i * tau * HOUR_MS)
    const last = doses[doses.length - 1]
    for (const tIn of [1, 6.5, 12, 23.9]) {
      const sim = concentrationAt(last + tIn * HOUR_MS, doses, rr)
      const { ka, ke } = rr
      const closed =
        (ka / (ka - ke)) *
        (Math.exp(-ke * tIn) / (1 - Math.exp(-ke * tau)) - Math.exp(-ka * tIn) / (1 - Math.exp(-ka * tau)))
      expect(sim).toBeCloseTo(closed, 6)
    }
  })

  it('accumulation ratio at trough matches 1/(1−e^(−ke·τ))', () => {
    const hl = 26
    const rr = ratesFromParams({ halfLifeH: hl, tmaxH: 0.05 }) // near-instant absorption
    const single = concentrationAt(T0 + 24 * HOUR_MS - 1, [T0], rr)
    const doses = Array.from({ length: 40 }, (_, i) => T0 + i * DAY_MS)
    const ss = concentrationAt(doses[39] + 24 * HOUR_MS - 1, doses, rr)
    expect(ss / single).toBeCloseTo(accumulationRatio(hl, 24), 2)
    // Zoloft label: "approximately two-fold accumulation" for once-daily dosing.
    expect(accumulationRatio(26, 24)).toBeGreaterThan(1.8)
    expect(accumulationRatio(26, 24)).toBeLessThan(2.3)
  })

  it('reaches ≥ 96% of steady state after 5 half-lives', () => {
    const hl = 30
    const rr = ratesFromParams({ halfLifeH: hl, tmaxH: 2 })
    const n = Math.ceil(timeToSteadyStateH(hl) / 24)
    const doses = Array.from({ length: 80 }, (_, i) => T0 + i * DAY_MS)
    const trough = (k: number) => concentrationAt(T0 + k * DAY_MS - 1, doses.slice(0, k), rr)
    expect(trough(n) / trough(79)).toBeGreaterThan(0.96)
    expect(trough(1) / trough(79)).toBeLessThan(0.5)
  })
})

describe('schedules', () => {
  const daily: SchedulePlan = { times: ['08:00', '20:00'], daysOfWeek: null, intervalDays: 1, anchorDate: '2026-09-01' }

  it('generates local dose instants', () => {
    const d = planDoseTimes(daily, T0, T0 + 2 * DAY_MS - 1)
    expect(d).toHaveLength(4)
    expect(new Date(d[0]).getHours()).toBe(8)
    expect(new Date(d[1]).getHours()).toBe(20)
  })

  it('defaults to 09:00 when no reminder time', () => {
    const d = planDoseTimes({ ...daily, times: [] }, T0, T0 + DAY_MS - 1)
    expect(d).toHaveLength(1)
    expect(new Date(d[0]).getHours()).toBe(9)
  })

  it('respects weekday filters', () => {
    const plan: SchedulePlan = { ...daily, times: ['08:00'], daysOfWeek: [1, 3, 5] }
    const d = planDoseTimes(plan, T0, T0 + 7 * DAY_MS - 1)
    expect(d).toHaveLength(3)
    for (const t of d) expect([1, 3, 5]).toContain(new Date(t).getDay())
  })

  it('extends interval cycles before the anchor date', () => {
    const plan: SchedulePlan = { times: ['08:00'], daysOfWeek: null, intervalDays: 2, anchorDate: '2026-09-10' }
    expect(isPlanDay(plan, new Date(2026, 8, 10))).toBe(true)
    expect(isPlanDay(plan, new Date(2026, 8, 8))).toBe(true)
    expect(isPlanDay(plan, new Date(2026, 8, 9))).toBe(false)
    expect(planDoseTimes(plan, T0, T0 + 10 * DAY_MS - 1)).toHaveLength(5)
  })

  it('typical interval', () => {
    expect(typicalDoseIntervalH(daily)).toBe(12)
    expect(typicalDoseIntervalH({ ...daily, times: ['08:00'], intervalDays: 2 })).toBe(48)
  })
})

describe('steady-state normalization and interpretation', () => {
  it('long regular dosing peaks at ~100% of steadyStatePeak', () => {
    const plan: SchedulePlan = { times: ['08:00'], daysOfWeek: null, intervalDays: 1, anchorDate: '2026-09-01' }
    const p = { halfLifeH: 26, tmaxH: 6.5 }
    const ref = steadyStatePeak(plan, p)
    const r = ratesFromParams(p)
    const doses = planDoseTimes(plan, T0 - 30 * DAY_MS, T0 + 3 * DAY_MS)
    const pts = sampleCurve(doses, r, T0, T0 + 3 * DAY_MS, 5 * 60_000)
    const max = Math.max(...pts.map((x) => x.c))
    expect((max / ref) * 100).toBeCloseTo(100, 0)
  })

  it('classifies peak / trough / falling for a short half-life drug', () => {
    const plan: SchedulePlan = { times: ['22:00'], daysOfWeek: null, intervalDays: 1, anchorDate: '2026-09-01' }
    const p = { halfLifeH: 2.5, tmaxH: 1.6 }
    const r = ratesFromParams(p)
    const doses = planDoseTimes(plan, T0 - 3 * DAY_MS, T0 + 3 * DAY_MS)
    const ref = steadyStatePeak(plan, p)
    const pts = sampleCurve(doses, r, T0 - DAY_MS, T0 + 2 * DAY_MS, 10 * 60_000).map((x) => ({ t: x.t, c: (x.c / ref) * 100 }))
    const dose = new Date(2026, 8, 1, 22, 0).getTime()
    expect(classifyPhase(pts, dose + 1.6 * HOUR_MS, 24)).toBe('peak')
    expect(classifyPhase(pts, dose - 2 * HOUR_MS, 24)).toBe('trough')
    expect(classifyPhase(pts, dose + 4 * HOUR_MS, 24)).toBe('falling')
    expect(classifyPhase(pts, dose + 0.5 * HOUR_MS, 24)).toBe('rising')
  })

  it('reports "steady" for a very long half-life (fluoxetine-like)', () => {
    const plan: SchedulePlan = { times: ['08:00'], daysOfWeek: null, intervalDays: 1, anchorDate: '2026-09-01' }
    const p = { halfLifeH: 120, tmaxH: 7 }
    const r = ratesFromParams(p)
    const doses = planDoseTimes(plan, T0 - 60 * DAY_MS, T0 + 3 * DAY_MS)
    const ref = steadyStatePeak(plan, p)
    const pts = sampleCurve(doses, r, T0, T0 + 2 * DAY_MS, 15 * 60_000).map((x) => ({ t: x.t, c: (x.c / ref) * 100 }))
    expect(classifyPhase(pts, T0 + DAY_MS, 24)).toBe('steady')
  })

  it('reports "none" when nothing was taken', () => {
    const pts = Array.from({ length: 20 }, (_, i) => ({ t: T0 + i * HOUR_MS, c: 0 }))
    expect(classifyPhase(pts, T0 + 10 * HOUR_MS, 24)).toBe('none')
  })

  it('finds one peak and one trough per day for once-daily dosing', () => {
    const plan: SchedulePlan = { times: ['08:00'], daysOfWeek: null, intervalDays: 1, anchorDate: '2026-09-01' }
    const p = { halfLifeH: 6, tmaxH: 1.5 }
    const r = ratesFromParams(p)
    const doses = planDoseTimes(plan, T0 - 5 * DAY_MS, T0 + 3 * DAY_MS)
    const ref = steadyStatePeak(plan, p)
    const pts = sampleCurve(doses, r, T0, T0 + 3 * DAY_MS - 1, 10 * 60_000).map((x) => ({ t: x.t, c: (x.c / ref) * 100 }))
    const ex = findExtrema(pts, 3)
    expect(ex.filter((e) => e.kind === 'peak')).toHaveLength(3)
    expect(ex.filter((e) => e.kind === 'trough').length).toBeGreaterThanOrEqual(2)
    for (const e of ex.filter((x) => x.kind === 'peak')) {
      expect(new Date(e.t).getHours() + new Date(e.t).getMinutes() / 60).toBeCloseTo(9.5, 0)
    }
  })
})
