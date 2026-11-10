-- Only reviewed, public research is readable. No credentials or user data here.
begin;
create table if not exists public.companies (
 id text primary key,
 profile jsonb not null check (jsonb_typeof(profile) = 'object' and profile->>'id' = id),
 published boolean not null default false,
 updated_at timestamptz not null default now()
);
create table if not exists public.research_sources (
 id text primary key, name text not null, area text not null, kind text not null,
 url text not null check (url like 'https://%'), status text not null,
 checked_at timestamptz, detail text not null
);
create table if not exists public.ingestion_candidates (
 url text primary key, source_id text not null references public.research_sources(id),
 title text not null, content_hash text not null, discovered_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(), review_status text not null default 'pending'
 check (review_status in ('pending','accepted','rejected'))
);
create table if not exists public.ingestion_runs (
 id bigint generated always as identity primary key, source_id text not null references public.research_sources(id),
 started_at timestamptz not null default now(), finished_at timestamptz,
 status text not null check (status in ('success','error')), candidate_count integer not null default 0,
 error_code text
);
alter table public.companies enable row level security;
alter table public.research_sources enable row level security;
alter table public.ingestion_candidates enable row level security;
alter table public.ingestion_runs enable row level security;
revoke all on public.companies, public.research_sources, public.ingestion_candidates, public.ingestion_runs from anon, authenticated;
grant select on public.companies, public.research_sources to anon, authenticated;
grant all on public.companies, public.research_sources, public.ingestion_candidates, public.ingestion_runs to service_role;
grant usage, select on sequence public.ingestion_runs_id_seq to service_role;
create policy published_research on public.companies for select to anon, authenticated using (published = true);
create policy public_source_status on public.research_sources for select to anon, authenticated using (true);
commit;
