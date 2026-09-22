import type { ContrastReminderState, ContrastResult, ContrastScaleId } from '../types'
import {
  listContrastResults as dbListContrastResults,
  putContrastResult as dbPutContrastResult,
} from './db'

const RESULTS_PREFIX = 'thryve.contrast.results.'
const REMINDER_PREFIX = 'thryve.contrast.reminder.'
const MIGRATED_PREFIX = 'thryve.contrast.migrated.'
const MS_DAY = 24 * 60 * 60 * 1000
const CYCLE_DAYS = 7

const VALID_SCALE_IDS = new Set<string>([
  'phq9', 'gad7', 'phq2', 'phq15', 'who5', 'dass21', 'ais',
])

function resultsKey(userId: string): string {
  return `${RESULTS_PREFIX}${userId}`
}

function reminderKey(userId: string): string {
  return `${REMINDER_PREFIX}${userId}`
}

function migratedKey(userId: string): string {
  return `${MIGRATED_PREFIX}${userId}`
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

function clearLocalContrastKeys(userId: string): void {
  try {
    localStorage.removeItem(resultsKey(userId))
    localStorage.removeItem(reminderKey(userId))
  } catch {
    /* private mode */
  }
}

/** One-time: upsert local results to Supabase, then drop local keys. */
export async function migrateLocalContrastResults(userId: string): Promise<void> {
  try {
    if (localStorage.getItem(migratedKey(userId)) === '1') {
      // Still scrub leftover keys if flag was set mid-failure
      if (localStorage.getItem(resultsKey(userId)) || localStorage.getItem(reminderKey(userId))) {
        clearLocalContrastKeys(userId)
      }
      return
    }
  } catch {
    /* ignore */
  }

  const local = readJson<ContrastResult[]>(resultsKey(userId), [])
  const valid = local.filter(
    (r) =>
      r &&
      typeof r.id === 'string' &&
      r.profileId === userId &&
      VALID_SCALE_IDS.has(r.scaleId) &&
      Array.isArray(r.answers) &&
      r.scores &&
      typeof r.completedAt === 'string',
  )

  for (const r of valid) {
    await dbPutContrastResult({
      ...r,
      profileId: userId,
      scaleId: r.scaleId as ContrastScaleId,
    })
  }

  clearLocalContrastKeys(userId)
  try {
    localStorage.setItem(migratedKey(userId), '1')
  } catch {
    /* ignore */
  }
}

export async function listContrastResults(userId: string): Promise<ContrastResult[]> {
  const list = await dbListContrastResults(userId)
  return list.sort((a, b) => b.completedAt.localeCompare(a.completedAt))
}

export async function listContrastResultsByScale(
  userId: string,
  scaleId: ContrastScaleId,
): Promise<ContrastResult[]> {
  const list = await listContrastResults(userId)
  return list.filter((r) => r.scaleId === scaleId)
}

export async function getLatestContrastResult(
  userId: string,
  scaleId: ContrastScaleId,
): Promise<ContrastResult | null> {
  const list = await listContrastResultsByScale(userId, scaleId)
  return list[0] ?? null
}

export async function saveContrastResult(result: ContrastResult): Promise<void> {
  await dbPutContrastResult(result)
}

export function reminderStateFromResults(results: ContrastResult[]): ContrastReminderState {
  if (!results.length) {
    return { firstCompletedAt: null, lastCompletedAt: null }
  }
  let first = results[0]!.completedAt
  let last = results[0]!.completedAt
  for (const r of results) {
    if (r.completedAt < first) first = r.completedAt
    if (r.completedAt > last) last = r.completedAt
  }
  return { firstCompletedAt: first, lastCompletedAt: last }
}

/**
 * Dot is due when now >= firstCompletedAt + 7*n days (n≥1)
 * AND the user has not completed any scale since the start of the current 7-day cycle.
 * If never completed, no dot.
 */
export function isContrastReminderDueFromResults(
  results: ContrastResult[],
  now = new Date(),
): boolean {
  const { firstCompletedAt, lastCompletedAt } = reminderStateFromResults(results)
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

export async function isContrastReminderDue(
  userId: string,
  now = new Date(),
): Promise<boolean> {
  const results = await listContrastResults(userId)
  return isContrastReminderDueFromResults(results, now)
}

/** @deprecated no-op — reminder is derived from cloud results */
export function debugBackdateContrastFirstCompleted(
  _userId: string,
  _daysAgo: number,
): void {
  /* no-op */
}
