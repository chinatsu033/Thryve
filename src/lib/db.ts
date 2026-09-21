/**
 * Cloud-first data layer (Supabase).
 * App types stay camelCase; DB columns are snake_case.
 * profileId in app entries maps to user_id.
 */
import { isLegacyMoodEntry, normalizeMood } from './mood'
import { requireSupabase } from './supabase'
import { DEFAULT_THEME, type EatingEntry, type EmotionEntry, type Profile, type ProfileExport, type SleepEntry, type ThemeConfig } from '../types'

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

function rowToProfile(row: ProfileRow, email: string): Profile {
  return {
    id: row.id,
    name: row.display_name?.trim() || email.split('@')[0] || '用户',
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

export async function ensureProfile(userId: string, email: string, displayName?: string): Promise<Profile> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (data) return rowToProfile(data as ProfileRow, email)

  const insert = {
    id: userId,
    display_name: displayName?.trim() || email.split('@')[0] || '用户',
    theme: DEFAULT_THEME,
  }
  const { data: created, error: insertErr } = await sb.from('profiles').upsert(insert).select('*').single()
  if (insertErr) throw insertErr
  return rowToProfile(created as ProfileRow, email)
}

export async function getProfile(userId: string, email = ''): Promise<Profile | undefined> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (!data) return undefined
  return rowToProfile(data as ProfileRow, email)
}

export async function saveProfile(profile: Profile): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('profiles').upsert({
    id: profile.id,
    display_name: profile.name,
    theme: profile.theme,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function listEmotions(userId: string): Promise<EmotionEntry[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('emotions').select('*').eq('user_id', userId).order('recorded_at', { ascending: false })
  if (error) throw error
  return (data as EmotionRow[] | null)?.map(rowToEmotion) ?? []
}

export async function putEmotion(e: EmotionEntry): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('emotions').upsert({
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
  const { error } = await sb.from('emotions').delete().eq('id', id)
  if (error) throw error
}

export async function listSleeps(userId: string): Promise<SleepEntry[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('sleeps').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) throw error
  return (data as SleepRow[] | null)?.map(rowToSleep) ?? []
}

export async function putSleep(e: SleepEntry): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('sleeps').upsert({
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
  const { error } = await sb.from('sleeps').delete().eq('id', id)
  if (error) throw error
}

export async function listEatings(userId: string): Promise<EatingEntry[]> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('eatings').select('*').eq('user_id', userId).order('date', { ascending: false })
  if (error) throw error
  return (data as EatingRow[] | null)?.map(rowToEating) ?? []
}

export async function putEating(e: EatingEntry): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('eatings').upsert({
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
  const { error } = await sb.from('eatings').delete().eq('id', id)
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
  throw new Error('云端附件尚未开放（MVP）')
}
export async function deleteAttachment(_id: string): Promise<void> {
  /* no-op */
}

export async function exportProfile(userId: string, email = ''): Promise<ProfileExport> {
  const profile = await getProfile(userId, email)
  if (!profile) throw new Error('档案不存在')

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
    sb.from('emotions').delete().eq('user_id', userId),
    sb.from('sleeps').delete().eq('user_id', userId),
    sb.from('eatings').delete().eq('user_id', userId),
  ])
}
