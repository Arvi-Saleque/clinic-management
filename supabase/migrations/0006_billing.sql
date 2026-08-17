create table invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'draft' check (
    status in ('draft', 'issued', 'partially_paid', 'paid', 'void')
  ),
  subtotal numeric(10, 2) not null default 0,
  tax_amount numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  notes text,
  created_by_staff_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  description text not null,
  quantity numeric(6, 2) not null default 1,
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  method text not null check (method in ('cash', 'card', 'bank_transfer', 'other')),
  paid_at timestamptz not null default now(),
  recorded_by_staff_id uuid references profiles(id) on delete set null,
  reference text,
  created_at timestamptz not null default now()
);

create index invoices_patient_id_idx on invoices(patient_id);
create index invoices_organization_id_idx on invoices(organization_id);
create index invoice_items_invoice_id_idx on invoice_items(invoice_id);
create index payments_invoice_id_idx on payments(invoice_id);
