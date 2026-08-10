-- Expert email logs: track emails received from experts and responses
create table if not exists expert_email_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null default current_date,
  log_time time not null default localtime,
  last_email_subject text not null,
  expert_id uuid not null references profiles(id) on delete cascade,
  action_taken text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for filtering by expert
create index if not exists idx_expert_email_logs_expert_id on expert_email_logs(expert_id);

-- Index for ordering by date/time
create index if not exists idx_expert_email_logs_date on expert_email_logs(log_date desc, log_time desc);

-- Enable RLS
alter table expert_email_logs enable row level security;

-- Coordinator-only policies
create policy "Coordinators can view expert email logs"
  on expert_email_logs for select
  using ((select role from profiles where id = auth.uid()) = 'coordinator');

create policy "Coordinators can insert expert email logs"
  on expert_email_logs for insert
  with check ((select role from profiles where id = auth.uid()) = 'coordinator');

create policy "Coordinators can update expert email logs"
  on expert_email_logs for update
  using ((select role from profiles where id = auth.uid()) = 'coordinator');

create policy "Coordinators can delete expert email logs"
  on expert_email_logs for delete
  using ((select role from profiles where id = auth.uid()) = 'coordinator');

-- Auto-update updated_at on row change
create or replace function update_expert_email_log_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_expert_email_log_updated_at
  before update on expert_email_logs
  for each row
  execute function update_expert_email_log_updated_at();
