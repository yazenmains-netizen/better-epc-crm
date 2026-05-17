-- Your Home Specialist CRM — Supabase Schema
-- Run this in the Supabase SQL Editor after creating your project

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ─── CLIENTS ───────────────────────────────────────────────
create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text,
  contact_name text,
  phone       text,
  email       text,
  address     text,
  how_found   text,
  active      boolean default true,
  notes       text,
  created_at  timestamptz default now()
);

-- ─── JOBS ──────────────────────────────────────────────────
create table if not exists jobs (
  id              uuid primary key default gen_random_uuid(),
  ref             text unique,
  title           text,
  status          text not null default 'New Enquiry',
  date            date,
  client_id       uuid references clients(id) on delete set null,
  client_type     text,
  contact_phone   text,
  property_address text,
  postcode        text,
  service         text,
  fee             numeric(10,2),
  invoice_sent    boolean default false,
  paid            boolean default false,
  date_paid       date,
  payment_method  text,
  source          text,
  review_requested boolean default false,
  review_received  boolean default false,
  notes           text,
  created_at      timestamptz default now()
);

-- ─── INVOICES ──────────────────────────────────────────────
create table if not exists invoices (
  id              uuid primary key default gen_random_uuid(),
  ref             text unique,
  job_id          uuid references jobs(id) on delete set null,
  client_id       uuid references clients(id) on delete set null,
  invoice_date    date,
  due_date        date,
  amount          numeric(10,2),
  status          text default 'Draft',
  payment_method  text,
  date_paid       date,
  notes           text,
  created_at      timestamptz default now()
);

-- ─── EXPENSES ──────────────────────────────────────────────
create table if not exists expenses (
  id              uuid primary key default gen_random_uuid(),
  description     text not null,
  date            date,
  category        text,
  supplier        text,
  amount          numeric(10,2),
  payment_method  text,
  has_receipt     boolean default false,
  tax_deductible  boolean default true,
  notes           text,
  created_at      timestamptz default now()
);

-- ─── MILEAGE ───────────────────────────────────────────────
create table if not exists mileage (
  id              uuid primary key default gen_random_uuid(),
  trip_name       text,
  date            date,
  from_location   text,
  to_location     text,
  job_id          uuid references jobs(id) on delete set null,
  purpose         text,
  miles           numeric(6,1),
  rate            numeric(5,3) default 0.45,
  claim           numeric(8,2) generated always as (miles * rate) stored,
  notes           text,
  created_at      timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────
-- Enable RLS on all tables (only authenticated users can access)
alter table clients  enable row level security;
alter table jobs     enable row level security;
alter table invoices enable row level security;
alter table expenses enable row level security;
alter table mileage  enable row level security;

-- Policy: allow all operations for authenticated users
create policy "Authenticated users can do everything" on clients
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything" on jobs
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything" on invoices
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything" on expenses
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything" on mileage
  for all using (auth.role() = 'authenticated');

-- ─── COMMS QUEUE ───────────────────────────────────────────
create table if not exists comms_queue (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  type       text not null check (type in ('email', 'sms')),
  recipient  text not null,
  subject    text,
  body       text not null,
  status     text not null default 'pending' check (status in ('pending', 'sent', 'skipped')),
  created_at timestamptz default now(),
  sent_at    timestamptz
);

alter table comms_queue enable row level security;

create policy "Authenticated users can do everything" on comms_queue
  for all using (auth.role() = 'authenticated');

-- ─── INDEXES ───────────────────────────────────────────────
create index if not exists jobs_client_id_idx on jobs(client_id);
create index if not exists jobs_status_idx on jobs(status);
create index if not exists invoices_job_id_idx on invoices(job_id);
create index if not exists mileage_job_id_idx on mileage(job_id);
create index if not exists comms_queue_status_idx on comms_queue(status);
create index if not exists comms_queue_job_id_idx on comms_queue(job_id);

-- ─── LEAD NURTURE EMAIL SEQUENCE ───────────────────────────────────────────
-- Add 'Not Interested' to valid job statuses
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS email_sequence TEXT DEFAULT 'none' CHECK (email_sequence IN ('none', 'day1', 'day2', 'day3', 'weekly'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sequence_started_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sequence_last_sent_at TIMESTAMPTZ;

-- Index for the scheduled email function to query efficiently
create index if not exists jobs_email_sequence_idx on jobs(email_sequence) where email_sequence != 'none';
create index if not exists jobs_status_sequence_idx on jobs(status, email_sequence);
