-- ---------------------------------------------------------------------
-- 0028_fix_audit_log_encounter_entity_id.sql
-- Phase 5G.3-B: Fix Audit Entity ID Resolution for Private Encounter Notes
-- ---------------------------------------------------------------------
-- 1. Preserves existing organization_id resolution (direct, patient, invoice).
-- 2. Preserves actor_profile_id, action, entity_type, before, and after payloads.
-- 3. Extends entity_id resolution with fallback to encounter_id when id is absent.
-- 4. Enables successful audit logging on clinical_encounter_private_notes
--    where the primary key is encounter_id instead of id.
-- ---------------------------------------------------------------------

create or replace function private.audit_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end;
  v_old jsonb := case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end;
  v_org_id uuid;
  v_patient_id uuid;
  v_invoice_id uuid;
  v_entity_id uuid;
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

  v_entity_id := coalesce(
    (v_new ->> 'id')::uuid,
    (v_old ->> 'id')::uuid,
    (v_new ->> 'encounter_id')::uuid,
    (v_old ->> 'encounter_id')::uuid
  );

  insert into public.audit_log (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    before,
    after
  ) values (
    v_org_id,
    (select auth.uid()),
    lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    v_old,
    v_new
  );

  return coalesce(NEW, OLD);
end;
$$;
