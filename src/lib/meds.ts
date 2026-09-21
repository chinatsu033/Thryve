import { format, parseISO, getDay, eachDayOfInterval, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns'
import type { Medication, MedLog } from '../types'

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

export function dowLabel(d: number): string {
  return DOW_LABELS[((d % 7) + 7) % 7] ?? String(d)
}

/**
 * Scheduled when enabled, matches weekday filter (if any), and fits interval_days from anchor.
 * intervalDays<=1: daily (subject to daysOfWeek). intervalDays>1: every N days from anchorDate.
 */
export function isMedScheduledOn(med: Medication, date: Date | string): boolean {
  if (!med.enabled) return false
  const d = typeof date === 'string' ? parseISO(date) : date
  const interval = Math.max(1, med.intervalDays ?? 1)
  const days = med.daysOfWeek
  if (interval <= 1) {
    if (days == null || days.length === 0) return true
    return days.includes(getDay(d))
  }
  const anchorRaw = med.anchorDate || med.createdAt?.slice(0, 10)
  if (!anchorRaw) return true
  const anchor = parseISO(anchorRaw)
  const diff = differenceInCalendarDays(d, anchor)
  if (diff < 0) return false
  return diff % interval === 0
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

export type StripAdherence = 'taken' | 'partial' | 'missed' | 'planned' | 'none'

export function stripAdherenceFromMark(mark: DayMedMark): StripAdherence {
  switch (mark) {
    case 'done':
      return 'taken'
    case 'partial':
      return 'partial'
    case 'missed':
      return 'missed'
    case 'scheduled':
      return 'planned'
    default:
      return 'none'
  }
}

/** Default evenly-spaced reminder times for N doses/day (1–99). */
export function defaultTimesForCount(n: number): string[] {
  const count = Math.min(99, Math.max(1, Math.round(n)))
  const presets: Record<number, string[]> = {
    1: ['08:00'],
    2: ['08:00', '20:00'],
    3: ['08:00', '13:00', '20:00'],
    4: ['08:00', '12:00', '16:00', '20:00'],
    5: ['08:00', '11:00', '14:00', '17:00', '20:00'],
  }
  if (presets[count]) return [...presets[count]]
  // Spread across waking hours 06:00–22:00
  const start = 6 * 60
  const end = 22 * 60
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const mins =
      count === 1 ? 8 * 60 : Math.round(start + (i * (end - start)) / (count - 1))
    const h = Math.floor(mins / 60) % 24
    const m = mins % 60
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return out
}

export const FREQUENCY_OPTIONS: { label: string; intervalDays: number }[] = [
  { label: '每天', intervalDays: 1 },
  { label: '隔天', intervalDays: 2 },
  { label: '每两天', intervalDays: 3 },
  { label: '每三天', intervalDays: 4 },
  { label: '每四天', intervalDays: 5 },
  { label: '每五天', intervalDays: 6 },
  { label: '每六天', intervalDays: 7 },
  { label: '每周', intervalDays: 7 },
]

export function frequencyLabel(intervalDays: number): string {
  const n = Math.max(1, intervalDays || 1)
  if (n === 1) return '每天'
  if (n === 2) return '隔天'
  if (n === 3) return '每两天'
  if (n === 4) return '每三天'
  if (n === 5) return '每四天'
  if (n === 6) return '每五天'
  if (n === 7) return '每周'
  return `每${n}天`
}

export const COMMON_MED_NAMES = [
  '舍曲林',
  '氟西汀',
  '帕罗西汀',
  '艾司西酞普兰',
  '文拉法辛',
  '米氮平',
  '度洛西汀',
  '曲唑酮',
  '喹硫平',
  '奥氮平',
  '阿立哌唑',
  '利培酮',
  '碳酸锂',
  '丙戊酸钠',
  '拉莫三嗪',
  '氯硝西泮',
  '劳拉西泮',
  '阿普唑仑',
  '佐匹克隆',
  '唑吡坦',
  '褪黑素',
  '维生素D',
  '维生素B',
  '益生菌',
] as const

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
