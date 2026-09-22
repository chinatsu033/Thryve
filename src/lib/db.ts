/**
 * Cloud-first data layer (Supabase).
 * App types stay camelCase; DB columns are snake_case.
 * profileId in app entries maps to user_id.
 */
import { isLegacyMoodEntry, normalizeMood } from './mood'
import { requireSupabase } from './supabase'
import { DEFAULT_THEME, type EatingEntry, type EmotionEntry, type MedLog, type Medication, type Profile, type ProfileExport, type SleepEntry, type ThemeConfig } from '../types'
import { getStoredLanguage } from './locale'
import { translate } from '../locales/messages'

function hydrateEmotion(e: EmotionEntry): EmotionEntry {
  const sources = e.sources ?? []
  if (isLegacyMoodEntry(e)) {
    return { ...e, sources, mood: normalizeMood(e.mood, e) }
  }
  return { ...e, sources }
}

function parseTheme(raw: unknown): ThemeConfig {
  if (raw && typeof raw === 'object') {
    const t = raw as Partial<ThemeConfig>
    if (t.primary && t.accent && t.surface) {
      return { primary: t.primary, accent: t.accent, surface: t.surface }
    }
  }
  return DEFAULT_THEME
}

type ProfileRow = {
  id: string
  display_name: string | null
  theme: unknown
  created_at: string
  updated_at: string
}

type EmotionRow = {
  id: string
  user_id: string
  mode: string
  mood: number
  tags: string[] | null
  sources: string[] | null
  notes: string | null
  recorded_at: string
  created_at: string
}

type SleepRow = {
  id: string
  user_id: string
  date: string
  bedtime: string | null
  wake_time: string | null
  quality: number
  interruptions: number | null
  notes: string | null
  created_at: string
}

type EatingRow = {
  id: string
  user_id: string
  date: string
  meals: number
  appetite: number
  notes: string | null
  created_at: string
}

type MedicationRow = {
  id: string
  user_id: string
  name: string
  dosage: string | null
  notes: string | null
  reminder_times: string[] | null
  days_of_week: number[] | null
  interval_days: number | null
  anchor_date: string | null
  color: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

type MedLogRow = {
  id: string
  user_id: string
  medication_id: string
  taken_date: string
  taken_time: string | null
  taken_at: string
  skipped: boolean
  note: string | null
}

function rowToProfile(row: ProfileRow, email: string): Profile {
  return {
    id: row.id,
    name: row.display_name?.trim() || email.split('@')[0] || translate(getStoredLanguage(), 'auth.defaultUser'),
    email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    theme: parseTheme(row.theme),
    onboardingDone: true,
  }
}

function rowToEmotion(row: EmotionRow): EmotionEntry {
  return hydrateEmotion({
    id: row.id,
    profileId: row.user_id,
    mode: (row.mode === 'daily' ? 'daily' : 'current') as EmotionEntry['mode'],
    mood: row.mood,
    tags: row.tags ?? [],
    sources: row.sources ?? [],
    notes: row.notes ?? '',
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
  })
}

function rowToSleep(row: SleepRow): SleepEntry {
  return {
    id: row.id,
    profileId: row.user_id,
    date: row.date,
    bedtime: row.bedtime ?? '',
    wakeTime: row.wake_time ?? '',
    quality: row.quality,
    interruptions: row.interruptions ?? 0,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }
}

function rowToEating(row: EatingRow): EatingEntry {
  return {
    id: row.id,
    profileId: row.user_id,
    date: row.date,
    meals: row.meals,
    appetite: row.appetite,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }
}

function rowToMedication(row: MedicationRow): Medication {
  const createdDay = row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  return {
    id: row.id,
    profileId: row.user_id,
    name: row.name,
    dosage: row.dosage ?? '',
    notes: row.notes ?? '',
    reminderTimes: row.reminder_times ?? [],
    daysOfWeek: row.days_of_week,
    intervalDays: Math.max(1, row.interval_days ?? 1),
    anchorDate: row.anchor_date || createdDay,
    color: row.color,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToMedLog(row: MedLogRow): MedLog {
  return {
    id: row.id,
    profileId: row.user_id,
    medicationId: row.medication_id,
    takenDate: row.taken_date,
    takenTime: row.taken_time,
    takenAt: row.taken_at,
    skipped: row.skipped,
    note: row.note ?? '',
  }
}

export async function ensureProfile(userId: string, email: string, displayName?: string): Promise<Profile> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('thryve_profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (data) return rowToProfile(data as ProfileRow, email)

  const insert = {
    id: userId,
    display_name: displayName?.trim() || email.split('@')[0] || translate(getStoredLanguage(), 'auth.defaultUser'),
    theme: DEFAULT_THEME,
  }
  const { data: created, error: insertErr } = await sb.from('thryve_profiles').upsert(insert).select('*').single()
  if (insertErr) throw insertErr
  return rowToProfile(created as ProfileRow, email)
}

export async function getProfile(userId: string, email = ''): Promise<Profile | undefined> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('thryve_profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (!data) return undefined
  return rowToProfile(data as ProfileRow, email)
}

export async function saveProfile(profile: Profile): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_profiles').upsert({
    id: profile.id,
    display_name: profile.name,
    theme: profile.theme,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function listEmotions(userId: string): Promise<EmotionEntry[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('thryve_emotions').select('*').eq('user_id', userId).order('recorded_at', { ascending: false })
  if (error) throw error
  return (data as EmotionRow[] | null)?.map(rowToEmotion) ?? []
}

export async function putEmotion(e: EmotionEntry): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_emotions').upsert({
    id: e.id,
    user_id: e.profileId,
    mode: e.mode,
    mood: e.mood,
    tags: e.tags,
    sources: e.sources ?? [],
    notes: e.notes ?? '',
    recorded_at: e.recordedAt,
    created_at: e.createdAt,
  })
  if (error) throw error
}

export async function deleteEmotion(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_emotions').delete().eq('id', id)
  if (error) throw error
}

export async function listSleeps(userId: string): Promise<SleepEntry[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('thryve_sleeps').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) throw error
  return (data as SleepRow[] | null)?.map(rowToSleep) ?? []
}

export async function putSleep(e: SleepEntry): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_sleeps').upsert({
    id: e.id,
    user_id: e.profileId,
    date: e.date,
    bedtime: e.bedtime,
    wake_time: e.wakeTime,
    quality: e.quality,
    interruptions: e.interruptions ?? 0,
    notes: e.notes ?? '',
    created_at: e.createdAt,
  })
  if (error) throw error
}

export async function deleteSleep(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_sleeps').delete().eq('id', id)
  if (error) throw error
}

export async function listEatings(userId: string): Promise<EatingEntry[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('thryve_eatings').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) throw error
  return (data as EatingRow[] | null)?.map(rowToEating) ?? []
}

export async function putEating(e: EatingEntry): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_eatings').upsert({
    id: e.id,
    user_id: e.profileId,
    date: e.date,
    meals: e.meals,
    appetite: e.appetite,
    notes: e.notes ?? '',
    created_at: e.createdAt,
  })
  if (error) throw error
}

export async function deleteEating(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_eatings').delete().eq('id', id)
  if (error) throw error
}


export async function listMedications(userId: string): Promise<Medication[]> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('thryve_medications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as MedicationRow[] | null)?.map(rowToMedication) ?? []
}

export async function putMedication(m: Medication): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_medications').upsert({
    id: m.id,
    user_id: m.profileId,
    name: m.name,
    dosage: m.dosage ?? '',
    notes: m.notes ?? '',
    reminder_times: m.reminderTimes ?? [],
    days_of_week: m.daysOfWeek,
    interval_days: Math.max(1, m.intervalDays ?? 1),
    anchor_date: m.anchorDate || m.createdAt.slice(0, 10),
    color: m.color,
    enabled: m.enabled,
    created_at: m.createdAt,
    updated_at: m.updatedAt || new Date().toISOString(),
  })
  if (error) throw error
}

export async function deleteMedication(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_medications').delete().eq('id', id)
  if (error) throw error
}

export async function listMedLogs(
  userId: string,
  opts?: { from?: string; to?: string },
): Promise<MedLog[]> {
  const sb = requireSupabase()
  let q = sb.from('thryve_med_logs').select('*').eq('user_id', userId)
  if (opts?.from) q = q.gte('taken_date', opts.from)
  if (opts?.to) q = q.lte('taken_date', opts.to)
  const { data, error } = await q.order('taken_date', { ascending: false })
  if (error) throw error
  return (data as MedLogRow[] | null)?.map(rowToMedLog) ?? []
}

export async function putMedLog(log: MedLog): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_med_logs').upsert({
    id: log.id,
    user_id: log.profileId,
    medication_id: log.medicationId,
    taken_date: log.takenDate,
    taken_time: log.takenTime,
    taken_at: log.takenAt,
    skipped: log.skipped,
    note: log.note ?? '',
  })
  if (error) throw error
}

export async function deleteMedLog(id: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_med_logs').delete().eq('id', id)
  if (error) throw error
}

/** Attachments skipped for cloud MVP (no blob storage yet). */
export async function listAttachments(_userId: string) {
  return [] as import('../types').AttachmentMeta[]
}
export async function getAttachmentBlob(_id: string): Promise<Blob | undefined> {
  return undefined
}
export async function saveAttachment(_meta: import('../types').AttachmentMeta, _blob: Blob): Promise<void> {
  throw new Error(translate(getStoredLanguage(), 'summary.attachUnavailable'))
}
export async function deleteAttachment(_id: string): Promise<void> {
  /* no-op */
}

export async function exportProfile(userId: string, email = ''): Promise<ProfileExport> {
  const profile = await getProfile(userId, email)
  if (!profile) throw new Error(translate(getStoredLanguage(), 'common.unknownError'))

  const [emotions, sleeps, eatings] = await Promise.all([
    listEmotions(userId),
    listSleeps(userId),
    listEatings(userId),
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    emotions,
    sleeps,
    eatings,
    depressives: [],
    attachments: [],
  }
}

/** Merge a JSON export into the current logged-in user's cloud rows. */
export async function importIntoCurrentUser(
  userId: string,
  data: ProfileExport,
): Promise<{ emotions: number; sleeps: number; eatings: number }> {
  let emotions = 0
  let sleeps = 0
  let eatings = 0
  for (const e of data.emotions ?? []) {
    await putEmotion(
      hydrateEmotion({
        ...e,
        id: crypto.randomUUID(),
        profileId: userId,
        sources: e.sources ?? [],
        createdAt: e.createdAt || new Date().toISOString(),
      }),
    )
    emotions++
  }
  for (const e of data.sleeps ?? []) {
    await putSleep({
      ...e,
      id: crypto.randomUUID(),
      profileId: userId,
      createdAt: e.createdAt || new Date().toISOString(),
    })
    sleeps++
  }
  for (const e of data.eatings ?? []) {
    await putEating({
      ...e,
      id: crypto.randomUUID(),
      profileId: userId,
      createdAt: e.createdAt || new Date().toISOString(),
    })
    eatings++
  }
  if (data.profile?.theme) {
    const p = await getProfile(userId)
    if (p) await saveProfile({ ...p, theme: data.profile.theme })
  }
  return { emotions, sleeps, eatings }
}

export async function deleteAllUserData(userId: string): Promise<void> {
  const sb = requireSupabase()
  await Promise.all([
    sb.from('thryve_emotions').delete().eq('user_id', userId),
    sb.from('thryve_sleeps').delete().eq('user_id', userId),
    sb.from('thryve_eatings').delete().eq('user_id', userId),
    sb.from('thryve_med_logs').delete().eq('user_id', userId),
    sb.from('thryve_medications').delete().eq('user_id', userId),
  ])
}
