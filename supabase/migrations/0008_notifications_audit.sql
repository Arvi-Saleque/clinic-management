create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  type text not null check (
    type in ('booking_confirmation', 'reschedule_notice', 'cancellation_notice', 'reminder')
  ),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  sent_at timestamptz,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

-- Insert-only audit trail. Rows are written by triggers on sensitive
-- tables (see 0009) — application code never writes here directly.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null, -- 'insert' | 'update' | 'delete'
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index notifications_log_patient_id_idx on notifications_log(patient_id);
create index audit_log_organization_id_idx on audit_log(organization_id);
create index audit_log_entity_idx on audit_log(entity_type, entity_id);
