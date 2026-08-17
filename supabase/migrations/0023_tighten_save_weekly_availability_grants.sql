-- ---------------------------------------------------------------------
-- 0023_tighten_save_weekly_availability_grants.sql
-- Phase 3B.1: Revoke anon execute grant on save_weekly_availability RPC
-- ---------------------------------------------------------------------

revoke execute on function public.save_weekly_availability(uuid, uuid, jsonb) from public;
revoke execute on function public.save_weekly_availability(uuid, uuid, jsonb) from anon;
grant execute on function public.save_weekly_availability(uuid, uuid, jsonb) to authenticated;
