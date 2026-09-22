import {
  clearLockout,
  clientIp,
  emailLockKey,
  ipLockKey,
  json,
  normalizeEmail,
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
  await clearLockout(env, emailLockKey(email))
  if (ip) await clearLockout(env, ipLockKey(ip))

  return json({ ok: true })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === 'POST') return onRequestPost(context)
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
