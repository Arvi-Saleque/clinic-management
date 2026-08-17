-- db advisors (re-run after module 9) flagged queue_appointment_reminders
-- and handle_new_user as callable by anon/authenticated via
-- /rest/v1/rpc/<name>. Root cause: this project auto-grants EXECUTE on
-- new public functions to anon/authenticated directly (same mechanism
-- that auto-grants table privileges -- confirmed earlier via
-- information_schema.role_table_grants), so `revoke ... from public`
-- alone doesn't remove it; the explicit anon/authenticated grants need
-- revoking too.
--
-- handle_new_user is a trigger function (`returns trigger`) -- Postgres
-- already refuses to invoke it outside a trigger context, so this is a
-- hygiene fix, not a live exploit. queue_appointment_reminders is a real
-- fix: nothing except the pg_cron schedule (which runs as the job
-- owner) should ever be able to trigger a reminder sweep on demand.

revoke execute on function public.queue_appointment_reminders() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
