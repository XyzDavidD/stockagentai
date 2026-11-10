begin;
create table if not exists public.agent_status (
 id text primary key check(id='research'),
 enabled boolean not null default false,
 cadence_minutes integer not null default 60 check(cadence_minutes>0),
 configured_at timestamptz not null default now()
);
alter table public.agent_status enable row level security;
revoke all on public.agent_status from anon,authenticated;
grant select on public.agent_status to anon,authenticated;
grant all on public.agent_status to service_role;
create policy public_agent_status on public.agent_status for select to anon,authenticated using(true);
insert into public.agent_status(id,enabled) values('research',false) on conflict(id) do nothing;
commit;
