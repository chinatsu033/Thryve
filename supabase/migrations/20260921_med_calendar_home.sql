-- Thryve med calendar home: interval schedules
-- Project: srhoswkgjxqmasmaqjfg
-- Apply via Supabase MCP apply_migration (name: med_calendar_home) or SQL editor.
-- interval_days: 1=每天, 2=隔天, 3=每两天, … 7=每六天/每周 (from anchor_date)
-- anchor_date: cycle start for interval schedules

alter table public.thryve_medications
  add column if not exists interval_days integer not null default 1,
  add column if not exists anchor_date date not null default (current_date);

alter table public.thryve_medications
  drop constraint if exists thryve_medications_interval_days_valid;

alter table public.thryve_medications
  add constraint thryve_medications_interval_days_valid
  check (interval_days >= 1 and interval_days <= 30);

comment on column public.thryve_medications.interval_days is
  'Dose every N calendar days from anchor_date (1=daily).';
comment on column public.thryve_medications.anchor_date is
  'Anchor date for interval_days cycles (local calendar date).';
