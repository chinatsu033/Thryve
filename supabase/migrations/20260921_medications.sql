-- Thryve medications + med logs (calendar + browser reminders)
-- Project: srhoswkgjxqmasmaqjfg
-- Apply via Supabase MCP apply_migration (name: medications) or SQL editor.
-- days_of_week: null or empty = every day; 0=Sun .. 6=Sat
-- reminder_times: local HH:mm strings, e.g. {'08:00','20:00'}

create table if not exists public.thryve_medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dosage text not null default '',
  notes text not null default '',
  reminder_times text[] not null default '{}',
  days_of_week int[] null,
  color text null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint thryve_medications_name_nonempty check (char_length(trim(name)) > 0),
  constraint thryve_medications_days_valid check (
    days_of_week is null
    or (
      cardinality(days_of_week) = 0
      or days_of_week <@ array[0,1,2,3,4,5,6]::int[]
    )
  )
);

create index if not exists thryve_medications_user_id_idx
  on public.thryve_medications (user_id);
create index if not exists thryve_medications_user_enabled_idx
  on public.thryve_medications (user_id, enabled);

alter table public.thryve_medications enable row level security;

drop policy if exists "thryve_medications_select_own" on public.thryve_medications;
create policy "thryve_medications_select_own"
  on public.thryve_medications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "thryve_medications_insert_own" on public.thryve_medications;
create policy "thryve_medications_insert_own"
  on public.thryve_medications for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "thryve_medications_update_own" on public.thryve_medications;
create policy "thryve_medications_update_own"
  on public.thryve_medications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "thryve_medications_delete_own" on public.thryve_medications;
create policy "thryve_medications_delete_own"
  on public.thryve_medications for delete
  to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at fresh (reuses set_updated_at if present from older migrations)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists thryve_medications_set_updated_at on public.thryve_medications;
create trigger thryve_medications_set_updated_at
  before update on public.thryve_medications
  for each row execute function public.set_updated_at();

create table if not exists public.thryve_med_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.thryve_medications (id) on delete cascade,
  taken_date date not null,
  taken_time text null,
  taken_at timestamptz not null default now(),
  skipped boolean not null default false,
  note text not null default ''
);

create index if not exists thryve_med_logs_user_id_idx
  on public.thryve_med_logs (user_id);
create index if not exists thryve_med_logs_user_date_idx
  on public.thryve_med_logs (user_id, taken_date desc);
create index if not exists thryve_med_logs_med_date_idx
  on public.thryve_med_logs (medication_id, taken_date);

-- One log per dose slot per day (null slot treated as empty string for uniqueness)
create unique index if not exists thryve_med_logs_unique_dose
  on public.thryve_med_logs (user_id, medication_id, taken_date, (coalesce(taken_time, '')));

alter table public.thryve_med_logs enable row level security;

drop policy if exists "thryve_med_logs_select_own" on public.thryve_med_logs;
create policy "thryve_med_logs_select_own"
  on public.thryve_med_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "thryve_med_logs_insert_own" on public.thryve_med_logs;
create policy "thryve_med_logs_insert_own"
  on public.thryve_med_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "thryve_med_logs_update_own" on public.thryve_med_logs;
create policy "thryve_med_logs_update_own"
  on public.thryve_med_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "thryve_med_logs_delete_own" on public.thryve_med_logs;
create policy "thryve_med_logs_delete_own"
  on public.thryve_med_logs for delete
  to authenticated
  using (auth.uid() = user_id);
