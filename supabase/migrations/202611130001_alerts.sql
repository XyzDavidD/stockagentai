begin;
create table if not exists public.research_events (
 id text primary key check(id ~ '^[a-f0-9]{64}$'), company_key text not null unique,
 company_name text not null, title text not null, industry text not null, region text not null,
 keywords jsonb not null, url text not null check(url like 'https://%'),
 published_at timestamptz, discovered_at timestamptz not null default now(),
 summary text not null, listing_evidence text not null, source_name text not null
);
alter table public.research_events enable row level security;
revoke all on public.research_events from anon,authenticated;
grant select on public.research_events to anon,authenticated;
grant all on public.research_events to service_role;
create policy public_automated_events on public.research_events for select to anon,authenticated using(true);
create table if not exists public.email_deliveries (
 id text primary key, recipient_hash text not null, event_ids jsonb not null,
 payload jsonb not null, status text not null default 'pending' check(status in('pending','accepted','failed','uncertain')),
 created_at timestamptz not null default now(), attempted_at timestamptz, accepted_at timestamptz,
 provider_id text, error_code text
);
alter table public.email_deliveries enable row level security;
revoke all on public.email_deliveries from public,anon,authenticated;
grant all on public.email_deliveries to service_role;
create or replace function public.research_activity()
returns jsonb language sql stable security definer set search_path=pg_catalog,public as $$
select jsonb_build_object(
 'runs',coalesce((select jsonb_agg(x) from(select r.run_key,max(r.finished_at) as finished_at,count(*) as sources,count(*) filter(where r.status='error') as errors,sum(r.candidate_count) as observed from public.ingestion_runs r group by r.run_key order by max(r.finished_at) desc limit 12)x),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(x) from(select id,company_name,industry,region,discovered_at from public.research_events order by discovered_at desc limit 20)x),'[]'::jsonb),
 'email',jsonb_build_object('accepted',(select count(*) from public.email_deliveries where status='accepted'),'last_accepted',(select max(accepted_at) from public.email_deliveries where status='accepted'),'pending',(select count(*) from public.email_deliveries where status='pending'),'issues',(select count(*) from public.email_deliveries where status in('failed','uncertain')))
);
$$;
revoke all on function public.research_activity() from public;
grant execute on function public.research_activity() to anon,authenticated,service_role;
commit;
