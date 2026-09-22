import {
  clientIp,
  emailLockKey,
  ipLockKey,
  json,
  normalizeEmail,
  recordFailure,
  supabaseUrl,
  type PagesContext,
} from '../../_shared/security'

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
    return json({ ok: false, error: 'invalid_input' }, 400)
  }

  const ip = clientIp(request)
  const fail = await recordFailure(env, emailLockKey(email))
  if (ip) await recordFailure(env, ipLockKey(ip))

  if (fail.locked) {
    return json({ ok: false, locked: true, until: fail.until, error: 'locked' }, 429)
  }
  return json({ ok: true, locked: false, fail_count: fail.fail_count })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === 'POST') return onRequestPost(context)
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
