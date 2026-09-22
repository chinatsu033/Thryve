import {
  checkAnyLocked,
  clientIp,
  findUserByEmail,
  getSecurityAnswers,
  json,
  normalizeEmail,
  supabaseUrl,
  type PagesContext,
} from '../../../_shared/security'

/** Generic error — do not reveal whether email or questions exist. */
const GENERIC = { ok: false as const, error: 'recover_unavailable' }

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !supabaseUrl(env)) {
    return json({ ok: false, error: 'server_misconfigured' }, 500)
  }

  let body: { email?: string }
  try {
    body = (await request.json()) as { email?: string }
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  if (!email.includes('@')) {
    return json(GENERIC, 400)
  }

  const ip = clientIp(request)
  const lock = await checkAnyLocked(env, email, ip)
  if (lock.locked) {
    return json({ ok: false, error: 'locked', until: lock.until }, 429)
  }

  const user = await findUserByEmail(env, email)
  if (!user) {
    // Same shape delay-ish response as missing questions
    return json(GENERIC, 400)
  }

  const answers = await getSecurityAnswers(env, user.id)
  if (!answers) {
    return json(GENERIC, 400)
  }

  return json({
    ok: true,
    questionIds: [answers.q1_id, answers.q2_id, answers.q3_id],
  })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === 'POST') return onRequestPost(context)
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
