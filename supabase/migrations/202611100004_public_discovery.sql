begin;
-- Public discovery was requested by the owner. Expose only public-source metadata,
-- never review notes, hashes, run history, credentials, or mutation permissions.
create or replace function public.list_discoveries()
returns table(url text, title text, source_name text, area text, published_at timestamptz, discovered_at timestamptz, last_seen_at timestamptz)
language sql stable security definer set search_path = pg_catalog, public as $$
 select c.url,c.title,s.name,s.area,c.published_at,c.discovered_at,c.last_seen_at
 from public.ingestion_candidates c join public.research_sources s on s.id=c.source_id
 where c.review_status <> 'rejected'
 order by c.discovered_at desc, c.url limit 100;
$$;
revoke all on function public.list_discoveries() from public;
grant execute on function public.list_discoveries() to anon,authenticated,service_role;
commit;
