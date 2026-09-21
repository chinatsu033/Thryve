/** Sleep quality: new entries store 1–7 (永夜→日光). Legacy rows may still be 1–10. */

export const SLEEP_QUALITY_LABELS = [
  '永夜',
  '残月',
  '微光',
  '平旦',
  '月华',
  '晨曦',
  '日光',
] as const

export type SleepQualityLabel = (typeof SLEEP_QUALITY_LABELS)[number]

/** Map stored quality to 1–7 band (legacy 1–10 → proportional). */
export function normalizeSleepQuality(quality: number): number {
  if (quality > 7) {
    return Math.min(7, Math.max(1, Math.round((quality / 10) * 7)))
  }
  return Math.min(7, Math.max(1, Math.round(quality)))
}

export function sleepQualityLabel(quality: number): SleepQualityLabel {
  return SLEEP_QUALITY_LABELS[normalizeSleepQuality(quality) - 1]
}

/** Continuous slider 1–7 → discrete band for label. */
export function sleepBandFromContinuous(v: number): number {
  return Math.min(7, Math.max(1, Math.round(v)))
}

export type DayPart =
  | 'dawn'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'midnight'

/** Hours may be fractional (e.g. 14.5 = 14:30). Local browser time bands. */
export function dayPartFromHours(hours: number): DayPart {
  const h = ((hours % 24) + 24) % 24
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 11) return 'morning'
  if (h >= 11 && h < 13) return 'noon'
  if (h >= 13 && h < 17) return 'afternoon'
  if (h >= 17 && h < 19) return 'evening'
  if (h >= 19 && h < 23) return 'night'
  return 'midnight'
}

export function dayPartFromDate(d: Date = new Date()): DayPart {
  return dayPartFromHours(d.getHours() + d.getMinutes() / 60)
}

export function hoursFromHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

export function formatHm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function parseHm(hm: string): { hour: number; minute: number } {
  const [h, m] = hm.split(':').map(Number)
  return { hour: Number.isFinite(h) ? h : 0, minute: Number.isFinite(m) ? m : 0 }
}
