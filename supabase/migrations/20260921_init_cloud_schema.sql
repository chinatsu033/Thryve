-- Thryve cloud schema (email auth + per-user RLS)
-- Project ref: srhoswkgjxqmasmaqjfg
-- Apply via Supabase MCP apply_migration or SQL editor after project is ACTIVE.

-- Extensions
create extension if not exists "pgcrypto";

-- 1. profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  theme jsonb not null default '{"primary":"#FF8A65","accent":"#FFD54F","surface":"#FFF8F3"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, theme)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), '用户'),
    '{"primary":"#FF8A65","accent":"#FFD54F","surface":"#FFF8F3"}'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 2. emotions
create table if not exists public.emotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('current', 'daily')),
  mood int not null,
  tags text[] not null default '{}',
  sources text[] not null default '{}',
  notes text not null default '',
  recorded_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists emotions_user_id_idx on public.emotions (user_id);
create index if not exists emotions_user_recorded_idx on public.emotions (user_id, recorded_at desc);

alter table public.emotions enable row level security;

create policy "emotions_select_own"
  on public.emotions for select
  using (auth.uid() = user_id);

create policy "emotions_insert_own"
  on public.emotions for insert
  with check (auth.uid() = user_id);

create policy "emotions_update_own"
  on public.emotions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "emotions_delete_own"
  on public.emotions for delete
  using (auth.uid() = user_id);

-- 3. sleeps
create table if not exists public.sleeps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  bedtime text not null default '',
  wake_time text not null default '',
  quality int not null,
  interruptions int not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists sleeps_user_id_idx on public.sleeps (user_id);
create index if not exists sleeps_user_date_idx on public.sleeps (user_id, date desc);

alter table public.sleeps enable row level security;

create policy "sleeps_select_own"
  on public.sleeps for select
  using (auth.uid() = user_id);

create policy "sleeps_insert_own"
  on public.sleeps for insert
  with check (auth.uid() = user_id);

create policy "sleeps_update_own"
  on public.sleeps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sleeps_delete_own"
  on public.sleeps for delete
  using (auth.uid() = user_id);

-- 4. eatings
create table if not exists public.eatings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  meals int not null default 0,
  appetite int not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists eatings_user_id_idx on public.eatings (user_id);
create index if not exists eatings_user_date_idx on public.eatings (user_id, date desc);

alter table public.eatings enable row level security;

create policy "eatings_select_own"
  on public.eatings for select
  using (auth.uid() = user_id);

create policy "eatings_insert_own"
  on public.eatings for insert
  with check (auth.uid() = user_id);

create policy "eatings_update_own"
  on public.eatings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "eatings_delete_own"
  on public.eatings for delete
  using (auth.uid() = user_id);

-- Optional MVP: attachments metadata only (no blobs / storage yet)
-- Uncomment when needed:
-- create table if not exists public.attachments (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid not null references auth.users (id) on delete cascade,
--   name text not null,
--   mime_type text not null,
--   size int not null default 0,
--   note text not null default '',
--   created_at timestamptz not null default now()
-- );
-- alter table public.attachments enable row level security;
-- create policy "attachments_select_own" on public.attachments for select using (auth.uid() = user_id);
-- create policy "attachments_insert_own" on public.attachments for insert with check (auth.uid() = user_id);
-- create policy "attachments_update_own" on public.attachments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "attachments_delete_own" on public.attachments for delete using (auth.uid() = user_id);
