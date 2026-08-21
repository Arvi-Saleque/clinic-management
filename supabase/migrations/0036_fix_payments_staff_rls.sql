-- Fix RLS policy on `payments` table.
-- Previously, `payments_staff` was restricted only to `owner_admin` and `receptionist`,
-- causing clinicians (dentists, hygienists, specialists) to encounter RLS policy violations
-- when settling patient invoices chairside or recording installment payments.
--
-- This updates `payments_staff` to allow any authenticated staff member in the organization
-- (`private.is_staff()`) to manage payments on their clinic's invoices.

drop policy if exists payments_staff on public.payments;

create policy payments_staff on public.payments
  for all to authenticated
  using (
    invoice_id in (select id from public.invoices where organization_id = private.current_org_id())
    and private.is_staff()
  )
  with check (
    invoice_id in (select id from public.invoices where organization_id = private.current_org_id())
    and private.is_staff()
  );
