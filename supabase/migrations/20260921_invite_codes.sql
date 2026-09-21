-- Thryve invite codes for gated signup
-- Project: srhoswkgjxqmasmaqjfg
-- Apply via Supabase MCP apply_migration (name: invite_codes) or SQL editor.
--
-- MVP race note: client consumes invite code BEFORE auth.signUp.
-- If signUp fails after a successful consume, that use is not refunded (acceptable leak for MVP).

create table if not exists public.thryve_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  max_uses int default 1, -- null = unlimited
  use_count int not null default 0,
  note text not null default '',
  enabled boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint thryve_invite_codes_code_unique unique (code),
  constraint thryve_invite_codes_code_format check (code ~ '^[A-Z0-9]+$'),
  constraint thryve_invite_codes_use_count_nonneg check (use_count >= 0),
  constraint thryve_invite_codes_max_uses_pos check (max_uses is null or max_uses > 0)
);

create index if not exists thryve_invite_codes_created_by_idx
  on public.thryve_invite_codes (created_by);

alter table public.thryve_invite_codes enable row level security;

-- No anon/public SELECT of the codes list. Authenticated users see only their own.
drop policy if exists "thryve_invite_codes_select_own" on public.thryve_invite_codes;
create policy "thryve_invite_codes_select_own"
  on public.thryve_invite_codes for select
  to authenticated
  using (auth.uid() = created_by);

drop policy if exists "thryve_invite_codes_insert_own" on public.thryve_invite_codes;
create policy "thryve_invite_codes_insert_own"
  on public.thryve_invite_codes for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "thryve_invite_codes_update_own" on public.thryve_invite_codes;
create policy "thryve_invite_codes_update_own"
  on public.thryve_invite_codes for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Atomic consume for signup (anon + authenticated). SECURITY DEFINER bypasses RLS.
create or replace function public.thryve_consume_invite_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_updated int;
begin
  v_code := upper(trim(coalesce(p_code, '')));
  if v_code = '' then
    raise exception '请输入邀请码';
  end if;

  update public.thryve_invite_codes
  set use_count = use_count + 1
  where code = v_code
    and enabled = true
    and (max_uses is null or use_count < max_uses);

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception '邀请码无效、已停用或已达使用上限';
  end if;

  return true;
end;
$$;

revoke all on function public.thryve_consume_invite_code(text) from public;
grant execute on function public.thryve_consume_invite_code(text) to anon, authenticated;

-- Starter code so friends can register immediately
insert into public.thryve_invite_codes (code, max_uses, note, enabled, created_by)
values ('THRYVE26', 50, 'starter seed', true, null)
on conflict (code) do nothing;
