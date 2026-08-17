-- Bug fix: private.audit_log() resolves organization_id either directly
-- from the row's own `organization_id` column, or by looking up
-- `patient_id`. The `payments` table has neither column (only
-- `invoice_id`), so every insert/update/delete on `payments` violated
-- audit_log's `organization_id not null` constraint -- meaning recording
-- a payment through the real staff UI (record-payment-form.tsx ->
-- recordPaymentAction) has been broken since the trigger was added.
--
-- Add an `invoice_id` fallback so `payments` resolves its organization
-- via the parent invoice.
create or replace function private.audit_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end;
  v_old jsonb := case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end;
  v_org_id uuid;
  v_patient_id uuid;
  v_invoice_id uuid;
begin
  v_org_id := coalesce((v_new ->> 'organization_id')::uuid, (v_old ->> 'organization_id')::uuid);

  if v_org_id is null then
    v_patient_id := coalesce((v_new ->> 'patient_id')::uuid, (v_old ->> 'patient_id')::uuid);
    if v_patient_id is not null then
      select organization_id into v_org_id from public.patients where id = v_patient_id;
    end if;
  end if;

  if v_org_id is null then
    v_invoice_id := coalesce((v_new ->> 'invoice_id')::uuid, (v_old ->> 'invoice_id')::uuid);
    if v_invoice_id is not null then
      select organization_id into v_org_id from public.invoices where id = v_invoice_id;
    end if;
  end if;

  insert into public.audit_log (organization_id, actor_profile_id, action, entity_type, entity_id, before, after)
  values (
    v_org_id,
    (select auth.uid()),
    lower(TG_OP),
    TG_TABLE_NAME,
    coalesce((v_new ->> 'id')::uuid, (v_old ->> 'id')::uuid),
    v_old,
    v_new
  );

  return coalesce(NEW, OLD);
end;
$$;
