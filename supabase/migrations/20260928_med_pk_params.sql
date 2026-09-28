-- Thryve: per-medication plasma-concentration simulation parameters (血药浓度模拟)
-- Project: srhoswkgjxqmasmaqjfg
-- Additive + nullable only. No existing data is modified.
-- Apply via Supabase MCP apply_migration (name: med_pk_params) or SQL editor.
--
-- pk_params JSON shape (all fields optional; null = auto-match built-in table by name):
--   { "mode": "builtin" | "custom",
--     "drugId": "sertraline",        -- when mode = builtin
--     "halfLifeH": 26,               -- when mode = custom (hours)
--     "tmaxH": 6 }                   -- when mode = custom (hours, optional)

alter table public.thryve_medications
  add column if not exists pk_params jsonb null;

comment on column public.thryve_medications.pk_params is
  'Optional PK simulation params (built-in drug override or custom half-life/Tmax). Null = auto-match by name.';
