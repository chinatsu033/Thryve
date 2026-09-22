/** Shared helpers for Thryve Pages Functions (auth recovery + lockout). */

export type Env = {
  TURNSTILE_SECRET_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  SUPABASE_URL?: string
  VITE_SUPABASE_URL?: string
  SECURITY_ANSWERS_PEPPER?: string
}

export type PagesContext = {
  request: Request
  env: Env
}

export const LOCK_FAIL_LIMIT = 5
export const LOCK_MINUTES = 15

export const VALID_QUESTION_IDS = new Set([
  'pet',
  'city',
  'school',
  'motherMaiden',
  'teacher',
  'street',
  'book',
  'friend',
  'food',
  'birthplace',
])

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export function supabaseUrl(env: Env): string {
  return (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function hashAnswer(pepper: string, answer: string): Promise<string> {
  const data = new TextEncoder().encode(`${pepper}:${normalizeAnswer(answer)}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function getUserFromBearer(
  env: Env,
  request: Request,
): Promise<{ id: string; email?: string } | null> {
  const auth = request.headers.get('Authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  if (!m) return null
  const token = m[1].trim()
  if (!token) return null

  const url = supabaseUrl(env)
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceKey,
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { id?: string; email?: string }
  if (!data.id) return null
  return { id: data.id, email: data.email }
}

export async function findUserByEmail(
  env: Env,
  email: string,
): Promise<{ id: string; email: string } | null> {
  const url = supabaseUrl(env)
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  const normalized = normalizeEmail(email)
  const res = await fetch(`${url}/rest/v1/rpc/thryve_find_user_id_by_email`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_email: normalized }),
  })
  if (!res.ok) return null
  const id = (await res.json()) as string | null
  if (!id || typeof id !== 'string') return null
  return { id, email: normalized }
}

/** Direct REST to PostgREST with service role. */
export async function sbRest(
  env: Env,
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<Response> {
  const url = supabaseUrl(env)
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('misconfigured')
  }
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${serviceKey}`)
  headers.set('apikey', serviceKey)
  headers.set('Content-Type', 'application/json')
  if (init.prefer) headers.set('Prefer', init.prefer)
  return fetch(`${url}/rest/v1/${path}`, { ...init, headers })
}

export function emailLockKey(email: string): string {
  return `email:${normalizeEmail(email)}`
}

export function ipLockKey(ip: string): string {
  return `ip:${ip}`
}

export type LockoutRow = {
  key: string
  fail_count: number
  locked_until: string | null
  updated_at: string
}

export async function getLockout(env: Env, key: string): Promise<LockoutRow | null> {
  const res = await sbRest(
    env,
    `thryve_auth_lockout?key=eq.${encodeURIComponent(key)}&select=*`,
    { method: 'GET' },
  )
  if (!res.ok) return null
  const rows = (await res.json()) as LockoutRow[]
  return rows[0] ?? null
}

export function isLocked(row: LockoutRow | null): boolean {
  if (!row?.locked_until) return false
  return new Date(row.locked_until).getTime() > Date.now()
}

export async function checkAnyLocked(
  env: Env,
  email: string,
  ip?: string | null,
): Promise<{ locked: boolean; until?: string }> {
  const emailRow = await getLockout(env, emailLockKey(email))
  if (isLocked(emailRow)) {
    return { locked: true, until: emailRow!.locked_until || undefined }
  }
  if (ip) {
    const ipRow = await getLockout(env, ipLockKey(ip))
    if (isLocked(ipRow)) {
      return { locked: true, until: ipRow!.locked_until || undefined }
    }
  }
  return { locked: false }
}

export async function recordFailure(
  env: Env,
  key: string,
): Promise<{ locked: boolean; until?: string; fail_count: number }> {
  const existing = await getLockout(env, key)
  const now = new Date()
  let failCount = existing?.fail_count ?? 0

  // If previous lock expired, reset counter
  if (existing?.locked_until && new Date(existing.locked_until).getTime() <= now.getTime()) {
    failCount = 0
  }

  failCount += 1
  let lockedUntil: string | null = existing?.locked_until ?? null
  if (failCount >= LOCK_FAIL_LIMIT) {
    lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString()
    // After lock triggers, keep count at limit (or reset on unlock path)
  }

  await sbRest(env, 'thryve_auth_lockout', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: JSON.stringify({
      key,
      fail_count: failCount,
      locked_until: lockedUntil,
      updated_at: now.toISOString(),
    }),
  })

  return {
    locked: Boolean(lockedUntil && new Date(lockedUntil).getTime() > now.getTime()),
    until: lockedUntil || undefined,
    fail_count: failCount,
  }
}

export async function clearLockout(env: Env, key: string): Promise<void> {
  await sbRest(env, `thryve_auth_lockout?key=eq.${encodeURIComponent(key)}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  })
}

export async function getSecurityAnswers(
  env: Env,
  userId: string,
): Promise<{
  q1_id: string
  q1_hash: string
  q2_id: string
  q2_hash: string
  q3_id: string
  q3_hash: string
} | null> {
  const res = await sbRest(
    env,
    `thryve_security_answers?user_id=eq.${encodeURIComponent(userId)}&select=q1_id,q1_hash,q2_id,q2_hash,q3_id,q3_hash`,
    { method: 'GET' },
  )
  if (!res.ok) return null
  const rows = (await res.json()) as Array<{
    q1_id: string
    q1_hash: string
    q2_id: string
    q2_hash: string
    q3_id: string
    q3_hash: string
  }>
  return rows[0] ?? null
}

export function clientIp(request: Request): string | null {
  return request.headers.get('CF-Connecting-IP') || null
}
