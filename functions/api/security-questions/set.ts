import {
  VALID_QUESTION_IDS,
  getUserFromBearer,
  hashAnswer,
  json,
  supabaseUrl,
  type PagesContext,
} from '../../_shared/security'

type QuestionIn = { id?: string; answer?: string }

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const pepper = env.SECURITY_ANSWERS_PEPPER
  const url = supabaseUrl(env)

  if (!serviceKey || !pepper || !url) {
    return json({ ok: false, error: 'server_misconfigured' }, 500)
  }

  const user = await getUserFromBearer(env, request)
  if (!user) return json({ ok: false, error: 'unauthorized' }, 401)

  let body: { questions?: QuestionIn[] }
  try {
    body = (await request.json()) as { questions?: QuestionIn[] }
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  const questions = Array.isArray(body.questions) ? body.questions : []
  if (questions.length !== 3) {
    return json({ ok: false, error: 'need_three' }, 400)
  }

  const ids: string[] = []
  const hashes: string[] = []

  for (const q of questions) {
    const id = typeof q.id === 'string' ? q.id.trim() : ''
    const answer = typeof q.answer === 'string' ? q.answer : ''
    if (!VALID_QUESTION_IDS.has(id) || !answer.trim()) {
      return json({ ok: false, error: 'invalid_question' }, 400)
    }
    if (ids.includes(id)) {
      return json({ ok: false, error: 'duplicate_question' }, 400)
    }
    ids.push(id)
    hashes.push(await hashAnswer(pepper, answer))
  }

  const res = await fetch(`${url}/rest/v1/thryve_security_answers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: user.id,
      q1_id: ids[0],
      q1_hash: hashes[0],
      q2_id: ids[1],
      q2_hash: hashes[1],
      q3_id: ids[2],
      q3_hash: hashes[2],
      updated_at: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    return json({ ok: false, error: 'save_failed' }, 500)
  }

  return json({ ok: true, configured: true })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === 'POST') return onRequestPost(context)
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
