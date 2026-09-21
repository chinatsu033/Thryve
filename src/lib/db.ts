import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  AttachmentMeta,
  DepressiveEntry,
  EatingEntry,
  EmotionEntry,
  Profile,
  ProfileExport,
  SleepEntry,
} from '../types'
import { DEFAULT_THEME } from '../types'

interface PsychDB extends DBSchema {
  profiles: {
    key: string
    value: Profile
    indexes: { 'by-name': string }
  }
  emotions: {
    key: string
    value: EmotionEntry
    indexes: { 'by-profile': string; 'by-profile-date': [string, string] }
  }
  sleeps: {
    key: string
    value: SleepEntry
    indexes: { 'by-profile': string; 'by-profile-date': [string, string] }
  }
  eatings: {
    key: string
    value: EatingEntry
    indexes: { 'by-profile': string; 'by-profile-date': [string, string] }
  }
  depressives: {
    key: string
    value: DepressiveEntry
    indexes: { 'by-profile': string }
  }
  attachments: {
    key: string
    value: AttachmentMeta
    indexes: { 'by-profile': string }
  }
  attachmentBlobs: {
    key: string
    value: { id: string; blob: Blob }
  }
  session: {
    key: string
    value: { key: string; profileId: string | null }
  }
}

const DB_NAME = 'psych-state-journal'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PsychDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PsychDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const profiles = db.createObjectStore('profiles', { keyPath: 'id' })
        profiles.createIndex('by-name', 'name', { unique: true })

        const emotions = db.createObjectStore('emotions', { keyPath: 'id' })
        emotions.createIndex('by-profile', 'profileId')
        emotions.createIndex('by-profile-date', ['profileId', 'recordedAt'])

        const sleeps = db.createObjectStore('sleeps', { keyPath: 'id' })
        sleeps.createIndex('by-profile', 'profileId')
        sleeps.createIndex('by-profile-date', ['profileId', 'date'])

        const eatings = db.createObjectStore('eatings', { keyPath: 'id' })
        eatings.createIndex('by-profile', 'profileId')
        eatings.createIndex('by-profile-date', ['profileId', 'date'])

        const depressives = db.createObjectStore('depressives', { keyPath: 'id' })
        depressives.createIndex('by-profile', 'profileId')

        const attachments = db.createObjectStore('attachments', { keyPath: 'id' })
        attachments.createIndex('by-profile', 'profileId')

        db.createObjectStore('attachmentBlobs', { keyPath: 'id' })
        db.createObjectStore('session', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

// —— Session ——
export async function getSessionProfileId(): Promise<string | null> {
  const db = await getDB()
  const row = await db.get('session', 'current')
  return row?.profileId ?? null
}

export async function setSessionProfileId(profileId: string | null): Promise<void> {
  const db = await getDB()
  await db.put('session', { key: 'current', profileId })
}

// —— Profiles ——
export async function listProfiles(): Promise<Profile[]> {
  const db = await getDB()
  return db.getAll('profiles')
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const db = await getDB()
  return db.get('profiles', id)
}

export async function getProfileByName(name: string): Promise<Profile | undefined> {
  const db = await getDB()
  return db.getFromIndex('profiles', 'by-name', name)
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDB()
  await db.put('profiles', profile)
}

export async function deleteProfileData(profileId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['profiles', 'emotions', 'sleeps', 'eatings', 'depressives', 'attachments', 'attachmentBlobs', 'session'],
    'readwrite',
  )
  await tx.objectStore('profiles').delete(profileId)
  for (const store of ['emotions', 'sleeps', 'eatings', 'depressives', 'attachments'] as const) {
    const idx = tx.objectStore(store).index('by-profile')
    let cursor = await idx.openCursor(profileId)
    while (cursor) {
      const id = cursor.value.id
      await cursor.delete()
      if (store === 'attachments') {
        await tx.objectStore('attachmentBlobs').delete(id)
      }
      cursor = await cursor.continue()
    }
  }
  const session = await tx.objectStore('session').get('current')
  if (session?.profileId === profileId) {
    await tx.objectStore('session').put({ key: 'current', profileId: null })
  }
  await tx.done
}

// —— Generic CRUD helpers ——
async function listByProfile<T extends { profileId: string }>(
  store: 'emotions' | 'sleeps' | 'eatings' | 'depressives' | 'attachments',
  profileId: string,
): Promise<T[]> {
  const db = await getDB()
  const rows = await db.getAllFromIndex(store, 'by-profile', profileId)
  return rows as unknown as T[]
}

export const listEmotions = (pid: string) => listByProfile<EmotionEntry>('emotions', pid)
export const listSleeps = (pid: string) => listByProfile<SleepEntry>('sleeps', pid)
export const listEatings = (pid: string) => listByProfile<EatingEntry>('eatings', pid)
export const listDepressives = (pid: string) => listByProfile<DepressiveEntry>('depressives', pid)
export const listAttachments = (pid: string) => listByProfile<AttachmentMeta>('attachments', pid)

export async function putEmotion(e: EmotionEntry) {
  await (await getDB()).put('emotions', e)
}
export async function deleteEmotion(id: string) {
  await (await getDB()).delete('emotions', id)
}
export async function putSleep(e: SleepEntry) {
  await (await getDB()).put('sleeps', e)
}
export async function deleteSleep(id: string) {
  await (await getDB()).delete('sleeps', id)
}
export async function putEating(e: EatingEntry) {
  await (await getDB()).put('eatings', e)
}
export async function deleteEating(id: string) {
  await (await getDB()).delete('eatings', id)
}
export async function putDepressive(e: DepressiveEntry) {
  await (await getDB()).put('depressives', e)
}
export async function deleteDepressive(id: string) {
  await (await getDB()).delete('depressives', id)
}

export async function saveAttachment(meta: AttachmentMeta, blob: Blob) {
  const db = await getDB()
  const tx = db.transaction(['attachments', 'attachmentBlobs'], 'readwrite')
  await tx.objectStore('attachments').put(meta)
  await tx.objectStore('attachmentBlobs').put({ id: meta.id, blob })
  await tx.done
}

export async function getAttachmentBlob(id: string): Promise<Blob | undefined> {
  const row = await (await getDB()).get('attachmentBlobs', id)
  return row?.blob
}

export async function deleteAttachment(id: string) {
  const db = await getDB()
  const tx = db.transaction(['attachments', 'attachmentBlobs'], 'readwrite')
  await tx.objectStore('attachments').delete(id)
  await tx.objectStore('attachmentBlobs').delete(id)
  await tx.done
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function exportProfile(profileId: string, includePassword = false): Promise<ProfileExport> {
  const profile = await getProfile(profileId)
  if (!profile) throw new Error('档案不存在')

  const [emotions, sleeps, eatings, depressives, attachments] = await Promise.all([
    listEmotions(profileId),
    listSleeps(profileId),
    listEatings(profileId),
    listDepressives(profileId),
    listAttachments(profileId),
  ])

  const attachmentPayload = await Promise.all(
    attachments.map(async (meta) => {
      const blob = await getAttachmentBlob(meta.id)
      const dataBase64 = blob ? await blobToBase64(blob) : ''
      return { ...meta, dataBase64 }
    }),
  )

  const { passwordHash, salt, ...safe } = profile
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: includePassword ? { ...safe, passwordHash, salt } : safe,
    emotions,
    sleeps,
    eatings,
    depressives,
    attachments: attachmentPayload,
  }
}

export async function importProfile(
  data: ProfileExport,
  opts: { newId: string; name: string; passwordHash: string; salt: string },
): Promise<void> {
  const profile: Profile = {
    id: opts.newId,
    name: opts.name,
    passwordHash: opts.passwordHash,
    salt: opts.salt,
    createdAt: new Date().toISOString(),
    medicalHistory: data.profile.medicalHistory ?? {
      diagnoses: '',
      medications: '',
      allergies: '',
      notes: '',
      skipped: true,
    },
    theme: data.profile.theme ?? DEFAULT_THEME,
    onboardingDone: data.profile.onboardingDone ?? true,
  }

  await saveProfile(profile)

  const remap = (oldId: string) => `${opts.newId}:${oldId.split(':').pop() ?? oldId}`

  for (const e of data.emotions ?? []) {
    await putEmotion({ ...e, id: remap(e.id), profileId: opts.newId })
  }
  for (const e of data.sleeps ?? []) {
    await putSleep({ ...e, id: remap(e.id), profileId: opts.newId })
  }
  for (const e of data.eatings ?? []) {
    await putEating({ ...e, id: remap(e.id), profileId: opts.newId })
  }
  for (const e of data.depressives ?? []) {
    await putDepressive({ ...e, id: remap(e.id), profileId: opts.newId })
  }
  for (const a of data.attachments ?? []) {
    const id = remap(a.id)
    const { dataBase64, ...meta } = a
    await saveAttachment(
      { ...meta, id, profileId: opts.newId },
      base64ToBlob(dataBase64 || '', a.mimeType || 'application/octet-stream'),
    )
  }
}
