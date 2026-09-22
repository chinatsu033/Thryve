-- Security questions answers (hashed) + auth lockout for Thryve
-- Project ref: srhoswkgjxqmasmaqjfg

create table if not exists public.thryve_security_answers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  q1_id text not null,
  q1_hash text not null,
  q2_id text not null,
  q2_hash text not null,
  q3_id text not null,
  q3_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.thryve_security_answers enable row level security;

drop policy if exists "security_answers_select_own" on public.thryve_security_answers;
create policy "security_answers_select_own"
  on public.thryve_security_answers for select
  using (auth.uid() = user_id);

drop policy if exists "security_answers_insert_own" on public.thryve_security_answers;
create policy "security_answers_insert_own"
  on public.thryve_security_answers for insert
  with check (auth.uid() = user_id);

drop policy if exists "security_answers_update_own" on public.thryve_security_answers;
create policy "security_answers_update_own"
  on public.thryve_security_answers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists thryve_security_answers_set_updated_at on public.thryve_security_answers;
create trigger thryve_security_answers_set_updated_at
  before update on public.thryve_security_answers
  for each row execute function public.set_updated_at();

-- Login / recover lockout (service role only via Pages Functions)
create table if not exists public.thryve_auth_lockout (
  key text primary key,
  fail_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.thryve_auth_lockout enable row level security;
-- No policies: anon/authenticated cannot read/write; service_role bypasses RLS.

create or replace function public.thryve_find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = auth, public
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.thryve_find_user_id_by_email(text) from public;
revoke all on function public.thryve_find_user_id_by_email(text) from anon;
revoke all on function public.thryve_find_user_id_by_email(text) from authenticated;
grant execute on function public.thryve_find_user_id_by_email(text) to service_role;
