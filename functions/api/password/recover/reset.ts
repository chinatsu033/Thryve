import {
  checkAnyLocked,
  clearLockout,
  clientIp,
  emailLockKey,
  findUserByEmail,
  getSecurityAnswers,
  hashAnswer,
  ipLockKey,
  json,
  normalizeEmail,
  recordFailure,
  supabaseUrl,
  timingSafeEqual,
  type PagesContext,
} from '../../../_shared/security'

const GENERIC = { ok: false as const, error: 'recover_failed' }

type AnswerIn = { id?: string; answer?: string }

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const pepper = env.SECURITY_ANSWERS_PEPPER
  const url = supabaseUrl(env)

  if (!serviceKey || !pepper || !url) {
    return json({ ok: false, error: 'server_misconfigured' }, 500)
  }

  let body: { email?: string; answers?: AnswerIn[]; newPassword?: string }
  try {
    body = (await request.json()) as {
      email?: string
      answers?: AnswerIn[]
      newPassword?: string
    }
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
  const answersIn = Array.isArray(body.answers) ? body.answers : []

  if (!email.includes('@') || newPassword.length < 6 || answersIn.length !== 3) {
    return json(GENERIC, 400)
  }

  const ip = clientIp(request)
  const lock = await checkAnyLocked(env, email, ip)
  if (lock.locked) {
    return json({ ok: false, error: 'locked', until: lock.until }, 429)
  }

  const user = await findUserByEmail(env, email)
  if (!user) {
    await recordFailure(env, emailLockKey(email))
    if (ip) await recordFailure(env, ipLockKey(ip))
    return json(GENERIC, 400)
  }

  const stored = await getSecurityAnswers(env, user.id)
  if (!stored) {
    await recordFailure(env, emailLockKey(email))
    if (ip) await recordFailure(env, ipLockKey(ip))
    return json(GENERIC, 400)
  }

  const expected = [
    { id: stored.q1_id, hash: stored.q1_hash },
    { id: stored.q2_id, hash: stored.q2_hash },
    { id: stored.q3_id, hash: stored.q3_hash },
  ]

  // Match by id order as returned from start (q1,q2,q3)
  let allOk = true
  for (let i = 0; i < 3; i++) {
    const given = answersIn[i]
    const id = typeof given?.id === 'string' ? given.id.trim() : ''
    const answer = typeof given?.answer === 'string' ? given.answer : ''
    if (id !== expected[i].id || !answer.trim()) {
      allOk = false
      break
    }
    const h = await hashAnswer(pepper, answer)
    if (!timingSafeEqual(h, expected[i].hash)) {
      allOk = false
      break
    }
  }

  if (!allOk) {
    const fail = await recordFailure(env, emailLockKey(email))
    if (ip) await recordFailure(env, ipLockKey(ip))
    if (fail.locked) {
      return json({ ok: false, error: 'locked', until: fail.until }, 429)
    }
    return json({ ok: false, error: 'bad_answers' }, 400)
  }

  const updateRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  })

  if (!updateRes.ok) {
    return json({ ok: false, error: 'reset_failed' }, 500)
  }

  await clearLockout(env, emailLockKey(email))
  if (ip) await clearLockout(env, ipLockKey(ip))

  return json({ ok: true })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === 'POST') return onRequestPost(context)
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
