/**
 * Cloudflare Pages Function: POST /api/register
 * Verifies Turnstile server-side, then creates the user via Supabase Admin API.
 * Do not expose SUPABASE_SERVICE_ROLE_KEY to the client.
 *
 * Follow-up: when ready, disable open signups in Supabase Dashboard →
 * Authentication → Providers / Settings so clients cannot call anon signUp.
 */

type Env = {
  TURNSTILE_SECRET_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  SUPABASE_URL?: string
  VITE_SUPABASE_URL?: string
}

type RegisterBody = {
  email?: string
  password?: string
  displayName?: string
  turnstileToken?: string
}

type PagesContext = {
  request: Request
  env: Env
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context

  const secret = env.TURNSTILE_SECRET_KEY
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '')

  if (!secret || !serviceKey || !supabaseUrl) {
    return json({ ok: false, error: 'server_misconfigured' }, 500)
  }

  let body: RegisterBody
  try {
    body = (await request.json()) as RegisterBody
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const displayName =
    typeof body.displayName === 'string' ? body.displayName.trim() : ''
  const turnstileToken =
    typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : ''

  if (!email.includes('@') || password.length < 6 || !turnstileToken) {
    return json({ ok: false, error: 'invalid_input' }, 400)
  }

  const remoteip = request.headers.get('CF-Connecting-IP') || undefined
  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', turnstileToken)
  if (remoteip) form.set('remoteip', remoteip)

  let turnstileOk = false
  try {
    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: form },
    )
    const verifyJson = (await verifyRes.json()) as { success?: boolean }
    turnstileOk = Boolean(verifyJson.success)
  } catch {
    return json({ ok: false, error: 'turnstile' }, 400)
  }

  if (!turnstileOk) {
    return json({ ok: false, error: 'turnstile' }, 400)
  }

  const name = displayName || email.split('@')[0] || 'user'
  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '')
    const lower = errText.toLowerCase()
    if (
      createRes.status === 422 ||
      createRes.status === 409 ||
      lower.includes('already') ||
      lower.includes('registered') ||
      lower.includes('duplicate') ||
      lower.includes('exists')
    ) {
      return json({ ok: false, error: 'already_registered' }, 409)
    }
    return json({ ok: false, error: 'register_failed' }, 500)
  }

  return json({ ok: true })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === 'POST') {
    return onRequestPost(context)
  }
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
