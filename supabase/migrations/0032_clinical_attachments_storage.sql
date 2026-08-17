-- =====================================================================
-- Migration: 0032_clinical_attachments_storage.sql
-- Description: Establishes private Supabase Storage security architecture
--              for encounter-linked clinical attachments (X-rays, scans,
--              photos, lab reports, etc.).
--
-- Components:
--   1. Idempotent private bucket registration ('clinical-attachments')
--   2. Safe path parsing and authorization helper (private.can_access_clinical_storage)
--   3. Storage RLS policies for storage.objects:
--      - INSERT: Clinician-only, metadata-backed & in-progress encounter enforced
--      - SELECT (Clinician): Organization & metadata-backed
--      - SELECT (Patient): Patient identity & is_patient_visible backed
--      - DELETE: Clinician-only, path & in-progress encounter enforced
--      - NO UPDATE policy (binary files are write-once / append-only)
-- =====================================================================

-- 1. Ensure private 'clinical-attachments' bucket exists and is configured
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinical-attachments',
  'clinical-attachments',
  false,
  15728640, -- 15 MB in bytes
  array['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf'];

-- 2. Safe path parsing & storage authorization helper
create or replace function private.can_access_clinical_storage(
  p_name text,
  p_action text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_parts text[];
  v_uuid_regex text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  v_org_id uuid;
  v_patient_id uuid;
  v_encounter_id uuid;
  v_attachment_id uuid;
  v_role text;
  v_encounter_status text;
  v_encounter_practitioner_id uuid;
  v_metadata_exists boolean;
begin
  if p_name is null or p_action is null then
    return false;
  end if;

  -- -------------------------------------------------------------------
  -- ACTION: SELECT_CLINICIAN (Metadata-backed read for clinic staff)
  -- -------------------------------------------------------------------
  if p_action = 'SELECT_CLINICIAN' then
    if private.is_clinician() is not true then
      return false;
    end if;

    return exists (
      select 1
      from public.clinical_attachments ca
      where ca.storage_path = p_name
        and ca.organization_id = private.current_org_id()
    );

  -- -------------------------------------------------------------------
  -- ACTION: SELECT_PATIENT (Metadata-backed read for verified patient)
  -- -------------------------------------------------------------------
  elsif p_action = 'SELECT_PATIENT' then
    if private.current_patient_id() is null then
      return false;
    end if;

    return exists (
      select 1
      from public.clinical_attachments ca
      where ca.storage_path = p_name
        and ca.patient_id = private.current_patient_id()
        and ca.is_patient_visible = true
    );

  -- -------------------------------------------------------------------
  -- ACTIONS: INSERT and DELETE (Path-validated encounter operations)
  -- Expected format: {org_id}/patients/{patient_id}/encounters/{encounter_id}/{attachment_id}/{filename}
  -- -------------------------------------------------------------------
  elsif p_action in ('INSERT', 'DELETE') then
    v_parts := string_to_array(p_name, '/');

    -- Validate exact segment count (7 segments)
    if array_length(v_parts, 1) is distinct from 7 then
      return false;
    end if;

    -- Validate literal markers
    if v_parts[2] != 'patients' or v_parts[4] != 'encounters' then
      return false;
    end if;

    -- Validate non-empty filename
    if length(v_parts[7]) = 0 then
      return false;
    end if;

    -- Validate UUID format of all key segments before casting
    if v_parts[1] !~ v_uuid_regex
       or v_parts[3] !~ v_uuid_regex
       or v_parts[5] !~ v_uuid_regex
       or v_parts[6] !~ v_uuid_regex then
      return false;
    end if;

    v_org_id := v_parts[1]::uuid;
    v_patient_id := v_parts[3]::uuid;
    v_encounter_id := v_parts[5]::uuid;
    v_attachment_id := v_parts[6]::uuid;

    -- Tenant alignment check
    if v_org_id is distinct from private.current_org_id() then
      return false;
    end if;

    -- Caller role check (fail-closed)
    v_role := private.current_role();
    if v_role is null
       or v_role not in ('dentist', 'owner_admin') then
      return false;
    end if;

    -- For INSERT: Require the matching clinical_attachments metadata row to ALREADY exist
    if p_action = 'INSERT' then
      select exists (
        select 1
        from public.clinical_attachments ca
        where ca.id = v_attachment_id
          and ca.storage_path = p_name
          and ca.organization_id = v_org_id
          and ca.patient_id = v_patient_id
          and ca.encounter_id = v_encounter_id
      ) into v_metadata_exists;

      if not v_metadata_exists then
        return false;
      end if;
    end if;

    -- For both INSERT and DELETE: Validate encounter ownership and status
    select status, practitioner_id
      into v_encounter_status, v_encounter_practitioner_id
    from public.clinical_encounters
    where id = v_encounter_id
      and organization_id = v_org_id
      and patient_id = v_patient_id;

    if not found then
      return false;
    end if;

    -- Dentist caller: must be the treating practitioner and encounter must be in_progress
    if v_role = 'dentist' then
      if v_encounter_practitioner_id is distinct from private.current_practitioner_id()
         or v_encounter_status != 'in_progress' then
        return false;
      end if;
    end if;

    -- Owner admin caller: verified within tenant
    return true;

  else
    -- Unknown action: reject
    return false;
  end if;
end;
$$;

revoke execute on function private.can_access_clinical_storage(text, text) from public;
revoke execute on function private.can_access_clinical_storage(text, text) from anon;
grant execute on function private.can_access_clinical_storage(text, text) to authenticated;

-- 3. Storage RLS Policies on storage.objects for 'clinical-attachments'

-- INSERT: Clinicians uploading files matching a pre-created metadata row
drop policy if exists clinical_attachments_storage_insert on storage.objects;
create policy clinical_attachments_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clinical-attachments'
    and private.can_access_clinical_storage(name, 'INSERT')
  );

-- SELECT (Clinician): Clinicians viewing files belonging to their organization
drop policy if exists clinical_attachments_storage_clinician_select on storage.objects;
create policy clinical_attachments_storage_clinician_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clinical-attachments'
    and private.can_access_clinical_storage(name, 'SELECT_CLINICIAN')
  );

-- SELECT (Patient): Patients viewing files explicitly marked as patient-visible
drop policy if exists clinical_attachments_storage_patient_select on storage.objects;
create policy clinical_attachments_storage_patient_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clinical-attachments'
    and private.can_access_clinical_storage(name, 'SELECT_PATIENT')
  );

-- DELETE: Clinicians removing or rolling back encounter-linked files
drop policy if exists clinical_attachments_storage_delete on storage.objects;
create policy clinical_attachments_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'clinical-attachments'
    and private.can_access_clinical_storage(name, 'DELETE')
  );
