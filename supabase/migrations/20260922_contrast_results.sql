-- Thryve contrast (对照) results — cloud storage for self-check scales
-- Project: srhoswkgjxqmasmaqjfg
-- Applied via Supabase MCP apply_migration (name: contrast_results) on 2026-09-22.
-- scale_id: phq9 | gad7 | phq2 | phq15 | who5 | dass21 | ais  (no gad2)

create table if not exists public.thryve_contrast_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scale_id text not null,
  answers integer[] not null default '{}',
  scores jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint thryve_contrast_results_scale_id_check check (
    scale_id = any (array['phq9','gad7','phq2','phq15','who5','dass21','ais']::text[])
  )
);

create index if not exists thryve_contrast_results_user_id_idx
  on public.thryve_contrast_results (user_id);
create index if not exists thryve_contrast_results_user_completed_idx
  on public.thryve_contrast_results (user_id, completed_at desc);
create index if not exists thryve_contrast_results_user_scale_completed_idx
  on public.thryve_contrast_results (user_id, scale_id, completed_at desc);

alter table public.thryve_contrast_results enable row level security;

drop policy if exists "thryve_contrast_results_select_own" on public.thryve_contrast_results;
create policy "thryve_contrast_results_select_own"
  on public.thryve_contrast_results for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "thryve_contrast_results_insert_own" on public.thryve_contrast_results;
create policy "thryve_contrast_results_insert_own"
  on public.thryve_contrast_results for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "thryve_contrast_results_update_own" on public.thryve_contrast_results;
create policy "thryve_contrast_results_update_own"
  on public.thryve_contrast_results for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "thryve_contrast_results_delete_own" on public.thryve_contrast_results;
create policy "thryve_contrast_results_delete_own"
  on public.thryve_contrast_results for delete
  to authenticated
  using (auth.uid() = user_id);
