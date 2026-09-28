import { describe, expect, it } from 'vitest'
import type { MedLog, Medication } from '../../types'
import { DAY_MS, HOUR_MS } from '../pk'
import { buildPkSimulation, defaultSourceMode, logDoseTimeMs, loggedDoseTimes } from '../pkSim'

const med: Medication = {
  id: 'm1',
  profileId: 'u',
  name: 'Sertraline',
  dosage: '50mg',
  notes: '',
  reminderTimes: ['08:00'],
  daysOfWeek: null,
  intervalDays: 1,
  anchorDate: '2026-09-01',
  color: '#FF8A65',
  enabled: true,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
}

const at = (y: number, mo: number, d: number, h: number, m = 0) => new Date(y, mo - 1, d, h, m)
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function log(date: Date, slot: string | null, tap: Date, skipped = false): MedLog {
  return {
    id: `${date.getTime()}-${slot}`,
    profileId: 'u',
    medicationId: 'm1',
    takenDate: key(date),
    takenTime: slot,
    takenAt: tap.toISOString(),
    skipped,
    note: '',
  }
}

describe('log dose time', () => {
  it('trusts the tap time near the slot', () => {
    const d = at(2026, 9, 20, 0)
    expect(logDoseTimeMs(log(d, '08:00', at(2026, 9, 20, 9, 10)))).toBe(at(2026, 9, 20, 9, 10).getTime())
  })
  it('uses the slot time for back-filled logs', () => {
    const d = at(2026, 9, 20, 0)
    expect(logDoseTimeMs(log(d, '08:00', at(2026, 9, 21, 22, 0)))).toBe(at(2026, 9, 20, 8, 0).getTime())
  })
  it('skipped logs are not doses', () => {
    const d = at(2026, 9, 20, 0)
    expect(loggedDoseTimes(med, [log(d, '08:00', at(2026, 9, 20, 8), true)])).toEqual([])
  })
})

describe('buildPkSimulation', () => {
  const now = at(2026, 9, 28, 14).getTime()
  const params = { halfLifeH: 26, tmaxH: 6.5 }

  it('plan mode: long-term regular use sits near steady state (peak ≈ 100%)', () => {
    const sim = buildPkSimulation({ med, logs: [], params, nowMs: now, mode: 'plan' })
    expect(sim.maxPct).toBeGreaterThan(97)
    expect(sim.maxPct).toBeLessThan(101)
    expect(sim.nowPct).toBeGreaterThan(50)
    expect(sim.points[0].t).toBe(now - 3 * DAY_MS)
    // plan mode only assumes past doses, so none are marked as taken
    expect(sim.doses.some((d) => d.kind === 'taken')).toBe(false)
    expect(sim.doses.filter((d) => d.kind === 'planned' && d.t > now)).toHaveLength(2)
    expect(sim.nextPeak).not.toBeNull()
  })

  it('logs mode: missed days lower the curve vs plan mode', () => {
    const logs: MedLog[] = []
    // took it only on the last 2 days
    for (const day of [26, 27]) logs.push(log(at(2026, 9, day, 0), '08:00', at(2026, 9, day, 8, 5)))
    const sLogs = buildPkSimulation({ med, logs, params, nowMs: now, mode: 'logs' })
    const sPlan = buildPkSimulation({ med, logs, params, nowMs: now, mode: 'plan' })
    expect(sLogs.nowPct).toBeLessThan(sPlan.nowPct)
    expect(sLogs.nowPct).toBeGreaterThan(0)
    expect(sLogs.doses.filter((d) => d.kind === 'taken')).toHaveLength(2)
  })

  it('defaults to logs mode only when recent taken logs exist', () => {
    expect(defaultSourceMode(med, [], now)).toBe('plan')
    const recent = [log(at(2026, 9, 27, 0), '08:00', at(2026, 9, 27, 8))]
    expect(defaultSourceMode(med, recent, now)).toBe('logs')
    const old = [log(at(2026, 9, 1, 0), '08:00', at(2026, 9, 1, 8))]
    expect(defaultSourceMode(med, old, now)).toBe('plan')
  })

  it('curve is continuous and non-negative', () => {
    const sim = buildPkSimulation({ med: { ...med, reminderTimes: ['08:00', '20:00'] }, logs: [], params: { halfLifeH: 6, tmaxH: 1.5 }, nowMs: now, mode: 'plan' })
    for (const p of sim.points) expect(p.c).toBeGreaterThanOrEqual(0)
    const step = sim.points[1].t - sim.points[0].t
    expect(step).toBe(15 * 60_000)
    expect(sim.tauH).toBe(12)
    expect(sim.extrema.filter((e) => e.kind === 'peak').length).toBeGreaterThanOrEqual(9)
    expect(sim.extrema.every((e) => e.t >= now - 3 * DAY_MS && e.t <= now + 2 * DAY_MS + HOUR_MS)).toBe(true)
  })
})
