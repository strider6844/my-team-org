create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text not null,
  role text not null default 'editor',
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;
drop policy if exists "team_members_v1_read" on team_members;
create policy "team_members_v1_read" on team_members for select using (true);
drop policy if exists "team_members_v1_write" on team_members;
create policy "team_members_v1_write" on team_members for all using (true) with check (true);

create table if not exists work_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  record_type text not null default 'general',
  status text not null default 'open',
  assignee_id uuid references team_members(id) on delete set null,
  notes text,
  due_date date,
  priority text not null default 'medium',
  suggested_next_status text,
  suggested_next_status_source text,
  suggested_next_status_confidence numeric,
  suggested_next_status_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table work_records enable row level security;
drop policy if exists "work_records_v1_read" on work_records;
create policy "work_records_v1_read" on work_records for select using (true);
drop policy if exists "work_records_v1_write" on work_records;
create policy "work_records_v1_write" on work_records for all using (true) with check (true);

create table if not exists record_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  record_id uuid references work_records(id) on delete cascade,
  actor_name text not null,
  action text not null,
  old_value text,
  new_value text,
  field_changed text,
  created_at timestamptz not null default now()
);

alter table record_activities enable row level security;
drop policy if exists "record_activities_v1_read" on record_activities;
create policy "record_activities_v1_read" on record_activities for select using (true);
drop policy if exists "record_activities_v1_write" on record_activities;
create policy "record_activities_v1_write" on record_activities for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  actor_name text not null,
  action text not null,
  target_table text not null,
  target_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into team_members (id, name, email, role) values
  ('a1000000-0000-0000-0000-000000000001', 'Jordan Lee', 'jordan@example.com', 'admin'),
  ('a1000000-0000-0000-0000-000000000002', 'Sam Rivera', 'sam@example.com', 'editor'),
  ('a1000000-0000-0000-0000-000000000003', 'Alex Kim', 'alex@example.com', 'editor'),
  ('a1000000-0000-0000-0000-000000000004', 'Morgan Chen', 'morgan@example.com', 'viewer')
on conflict (id) do nothing;

insert into work_records (id, title, record_type, status, assignee_id, notes, due_date, priority) values
  ('b1000000-0000-0000-0000-000000000001', 'Q3 Vendor Renewal', 'contract', 'in_progress', 'a1000000-0000-0000-0000-000000000001', 'Awaiting signed copy from vendor.', '2025-08-15', 'high'),
  ('b1000000-0000-0000-0000-000000000002', 'Monthly Compliance Check', 'compliance', 'open', 'a1000000-0000-0000-0000-000000000002', 'Run standard checklist by end of month.', '2025-07-31', 'medium'),
  ('b1000000-0000-0000-0000-000000000003', 'Onboard New Contractor', 'onboarding', 'blocked', 'a1000000-0000-0000-0000-000000000003', 'Waiting on IT access provisioning.', '2025-07-25', 'high'),
  ('b1000000-0000-0000-0000-000000000004', 'Budget Reforecast Review', 'finance', 'done', 'a1000000-0000-0000-0000-000000000001', 'Approved by director on 7/10.', '2025-07-10', 'low'),
  ('b1000000-0000-0000-0000-000000000005', 'Team Offsite Planning', 'project', 'open', 'a1000000-0000-0000-0000-000000000004', 'Venue options being collected.', '2025-08-01', 'medium')
on conflict (id) do nothing;

insert into record_activities (record_id, actor_name, action, field_changed, old_value, new_value) values
  ('b1000000-0000-0000-0000-000000000001', 'Jordan Lee', 'status_change', 'status', 'open', 'in_progress'),
  ('b1000000-0000-0000-0000-000000000003', 'Alex Kim', 'status_change', 'status', 'open', 'blocked'),
  ('b1000000-0000-0000-0000-000000000004', 'Jordan Lee', 'status_change', 'status', 'in_progress', 'done')
on conflict do nothing;