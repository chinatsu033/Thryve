import { format, parseISO, getDay, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import type { Medication, MedLog } from '../types'

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

export function dowLabel(d: number): string {
  return DOW_LABELS[((d % 7) + 7) % 7] ?? String(d)
}

/** null or empty daysOfWeek → every day */
export function isMedScheduledOn(med: Medication, date: Date | string): boolean {
  if (!med.enabled) return false
  const d = typeof date === 'string' ? parseISO(date) : date
  const dow = getDay(d)
  const days = med.daysOfWeek
  if (days == null || days.length === 0) return true
  return days.includes(dow)
}

export function dosesForDay(med: Medication, date: Date | string): string[] {
  if (!isMedScheduledOn(med, date)) return []
  const times = (med.reminderTimes ?? []).filter(Boolean)
  return times.length ? [...times].sort() : ['']
}

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'missed'

export interface DayDose {
  medication: Medication
  time: string
  log: MedLog | null
  status: DoseStatus
}

function findLog(logs: MedLog[], medId: string, dateKey: string, time: string): MedLog | null {
  const slot = time || null
  return (
    logs.find(
      (l) =>
        l.medicationId === medId &&
        l.takenDate === dateKey &&
        (l.takenTime ?? '') === (slot ?? ''),
    ) ?? null
  )
}

export function resolveDoseStatus(log: MedLog | null, dateKey: string, time: string, now = new Date()): DoseStatus {
  if (log) return log.skipped ? 'skipped' : 'taken'
  const today = format(now, 'yyyy-MM-dd')
  if (dateKey > today) return 'pending'
  if (dateKey < today) return 'missed'
  // today: missed only if time has passed (empty time = pending until EOD)
  if (!time) return 'pending'
  const [hh, mm] = time.split(':').map((x) => Number(x))
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 'pending'
  const due = new Date(now)
  due.setHours(hh, mm, 0, 0)
  return now.getTime() >= due.getTime() + 30 * 60 * 1000 ? 'missed' : 'pending'
}

export function listDayDoses(meds: Medication[], logs: MedLog[], dateKey: string, now = new Date()): DayDose[] {
  const out: DayDose[] = []
  for (const med of meds) {
    for (const time of dosesForDay(med, dateKey)) {
      const log = findLog(logs, med.id, dateKey, time)
      out.push({
        medication: med,
        time,
        log,
        status: resolveDoseStatus(log, dateKey, time, now),
      })
    }
  }
  return out.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
}

export type DayMedMark = 'none' | 'scheduled' | 'partial' | 'done' | 'missed'

export function dayMedMark(meds: Medication[], logs: MedLog[], dateKey: string, now = new Date()): DayMedMark {
  const doses = listDayDoses(meds, logs, dateKey, now)
  if (!doses.length) return 'none'
  const takenOrSkip = doses.filter((d) => d.status === 'taken' || d.status === 'skipped')
  const missed = doses.filter((d) => d.status === 'missed')
  if (takenOrSkip.length === doses.length) return 'done'
  if (missed.length && takenOrSkip.length === 0) return 'missed'
  if (takenOrSkip.length || missed.length) return 'partial'
  return 'scheduled'
}

export function monthDayKeys(month: Date): string[] {
  return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((d) =>
    format(d, 'yyyy-MM-dd'),
  )
}

/** Adherence in [from,to] inclusive (yyyy-MM-dd). */
export function adherenceSummary(
  meds: Medication[],
  logs: MedLog[],
  from: string,
  to: string,
  now = new Date(),
): { due: number; taken: number; skipped: number; missed: number; rate: number | null } {
  const enabled = meds.filter((m) => m.enabled)
  let due = 0
  let taken = 0
  let skipped = 0
  let missed = 0
  const start = parseISO(from)
  const end = parseISO(to)
  for (const day of eachDayOfInterval({ start, end })) {
    const key = format(day, 'yyyy-MM-dd')
    for (const dose of listDayDoses(enabled, logs, key, now)) {
      due++
      if (dose.status === 'taken') taken++
      else if (dose.status === 'skipped') skipped++
      else if (dose.status === 'missed') missed++
    }
  }
  const accounted = taken + skipped
  const rate = due > 0 ? Math.round((accounted / due) * 100) : null
  return { due, taken, skipped, missed, rate }
}

export function normalizeReminderTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
