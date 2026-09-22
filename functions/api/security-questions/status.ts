import {
  getSecurityAnswers,
  getUserFromBearer,
  json,
  supabaseUrl,
  type PagesContext,
} from '../../_shared/security'

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !supabaseUrl(env)) {
    return json({ ok: false, error: 'server_misconfigured' }, 500)
  }

  const user = await getUserFromBearer(env, request)
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401)

  const row = await getSecurityAnswers(env, user.id)
  return json({ ok: true, configured: Boolean(row) })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === 'GET') return onRequestGet(context)
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
