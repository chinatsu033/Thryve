import { requireSupabase } from './supabase'

export type InviteCodeRow = {
  id: string
  code: string
  max_uses: number | null
  use_count: number
  note: string
  enabled: boolean
  created_by: string | null
  created_at: string
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Random uppercase alphanumeric invite code (default 8 chars). */
export function generateInviteCode(length = 8): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return out
}

/**
 * Consume an invite code before signup.
 * Prefer calling this BEFORE auth.signUp. If signUp then fails, the use is not
 * refunded (MVP leak; acceptable until a same-transaction or refund path exists).
 */
export async function consumeInviteCode(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = code.trim()
  if (!trimmed) return { ok: false, error: '请输入邀请码' }
  const sb = requireSupabase()
  const { data, error } = await sb.rpc('thryve_consume_invite_code', { p_code: trimmed })
  if (error) {
    const msg = error.message || '邀请码校验失败'
    if (msg.includes('邀请码')) return { ok: false, error: msg }
    return { ok: false, error: msg.includes('function') ? '邀请码服务未就绪，请稍后再试' : msg }
  }
  if (data !== true) return { ok: false, error: '邀请码无效、已停用或已达使用上限' }
  return { ok: true }
}

export async function listMyInviteCodes(userId: string): Promise<InviteCodeRow[]> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('thryve_invite_codes')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as InviteCodeRow[]
}

export async function createInviteCode(params: {
  userId: string
  code?: string
  maxUses?: number | null
  note?: string
}): Promise<InviteCodeRow> {
  const sb = requireSupabase()
  const code = (params.code ?? generateInviteCode(8)).toUpperCase()
  const { data, error } = await sb
    .from('thryve_invite_codes')
    .insert({
      code,
      max_uses: params.maxUses === undefined ? 10 : params.maxUses,
      note: params.note ?? '',
      enabled: true,
      created_by: params.userId,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as InviteCodeRow
}

export async function setInviteCodeEnabled(id: string, enabled: boolean): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.from('thryve_invite_codes').update({ enabled }).eq('id', id)
  if (error) throw error
}
