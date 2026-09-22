import type { ContrastReminderState, ContrastResult, ContrastScaleId } from '../types'

const RESULTS_PREFIX = 'thryve.contrast.results.'
const REMINDER_PREFIX = 'thryve.contrast.reminder.'
const MS_DAY = 24 * 60 * 60 * 1000
const CYCLE_DAYS = 7

function resultsKey(userId: string): string {
  return `${RESULTS_PREFIX}${userId}`
}

function reminderKey(userId: string): string {
  return `${REMINDER_PREFIX}${userId}`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}

export function listContrastResults(userId: string): ContrastResult[] {
  const list = readJson<ContrastResult[]>(resultsKey(userId), [])
  return list.sort((a, b) => b.completedAt.localeCompare(a.completedAt))
}

export function listContrastResultsByScale(
  userId: string,
  scaleId: ContrastScaleId,
): ContrastResult[] {
  return listContrastResults(userId).filter((r) => r.scaleId === scaleId)
}

export function getLatestContrastResult(
  userId: string,
  scaleId: ContrastScaleId,
): ContrastResult | null {
  return listContrastResultsByScale(userId, scaleId)[0] ?? null
}

export function saveContrastResult(result: ContrastResult): void {
  const list = listContrastResults(result.profileId)
  list.unshift(result)
  writeJson(resultsKey(result.profileId), list)

  const rem = getContrastReminderState(result.profileId)
  const now = result.completedAt
  if (!rem.firstCompletedAt) {
    rem.firstCompletedAt = now
  }
  rem.lastCompletedAt = now
  setContrastReminderState(result.profileId, rem)
}

export function getContrastReminderState(userId: string): ContrastReminderState {
  return readJson<ContrastReminderState>(reminderKey(userId), {
    firstCompletedAt: null,
    lastCompletedAt: null,
  })
}

export function setContrastReminderState(
  userId: string,
  state: ContrastReminderState,
): void {
  writeJson(reminderKey(userId), state)
}

/**
 * Dot is due when now >= firstCompletedAt + 7*n days (n≥1)
 * AND the user has not completed any scale since the start of the current 7-day cycle.
 * If never completed, no dot.
 */
export function isContrastReminderDue(userId: string, now = new Date()): boolean {
  const { firstCompletedAt, lastCompletedAt } = getContrastReminderState(userId)
  if (!firstCompletedAt) return false

  const firstMs = Date.parse(firstCompletedAt)
  if (Number.isNaN(firstMs)) return false

  const nowMs = now.getTime()
  const elapsed = nowMs - firstMs
  if (elapsed < CYCLE_DAYS * MS_DAY) return false

  const cycles = Math.floor(elapsed / (CYCLE_DAYS * MS_DAY))
  if (cycles < 1) return false

  const cycleStartMs = firstMs + cycles * CYCLE_DAYS * MS_DAY
  if (!lastCompletedAt) return true

  const lastMs = Date.parse(lastCompletedAt)
  if (Number.isNaN(lastMs)) return true
  return lastMs < cycleStartMs
}

/** Dev / QA helper: backdate firstCompletedAt so the reminder appears. */
export function debugBackdateContrastFirstCompleted(
  userId: string,
  daysAgo: number,
): void {
  const rem = getContrastReminderState(userId)
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  rem.firstCompletedAt = d.toISOString()
  if (!rem.lastCompletedAt) {
    rem.lastCompletedAt = rem.firstCompletedAt
  }
  setContrastReminderState(userId, rem)
}
