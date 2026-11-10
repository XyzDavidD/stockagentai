begin;
alter table public.research_sources add column if not exists last_attempt_at timestamptz;
alter table public.research_sources add column if not exists last_error text;
alter table public.research_sources add column if not exists consecutive_failures integer not null default 0;
alter table public.research_sources add column if not exists pending_count integer not null default 0;
alter table public.research_sources add column if not exists last_trigger text;
alter table public.ingestion_candidates add column if not exists published_at timestamptz;
alter table public.ingestion_candidates add column if not exists reason text;
alter table public.ingestion_runs add column if not exists run_key text;
create unique index if not exists ingestion_run_dedupe on public.ingestion_runs(source_id,run_key);
insert into public.research_sources(id,name,area,kind,url,status,detail) values
('bvb-news','BVB · comunicate','România','Bursă','https://www.bvb.ro/AboutUs/MediaCenter/PressReleases','Pregătit','Descoperire de anunțuri; necesită revizuire înainte de publicare.'),
('anthropic-news','Anthropic · noutăți','SUA','Emitent','https://www.anthropic.com/news','Pregătit','Urmărirea comunicatelor emitentului, inclusiv modificarea stadiului IPO.'),
('prnewswire','PR Newswire · financiar','SUA / internațional','Comunicate distribuite','https://www.prnewswire.com/rss/financial-services-latest-news/financial-services-latest-news-list.rss','Pregătit','Feed de descoperire. Piața vizată și stadiul se verifică separat.')
on conflict(id) do nothing;
update public.research_sources set status='Suspendat · HTTP 403',last_error='HTTP_403',detail='Suspendat după refuzul accesului. Nicio încercare automată până la reevaluarea accesului.' where id='sec';

-- SECURITY INVOKER: this function does not grant a caller extra privileges.
-- Execute is revoked from PUBLIC/anon/authenticated in the same transaction.
create or replace function public.record_ingestion(payload jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
 source text := payload->>'source_id';
 runkey text := payload->>'run_key';
 started timestamptz := (payload->>'started_at')::timestamptz;
 finished timestamptz := (payload->>'finished_at')::timestamptz;
 err text := payload->>'error_code';
 trigger_name text := payload->>'trigger';
 candidates jsonb := payload->'candidates';
 candidate jsonb;
 inserted_id bigint;
 pending integer;
begin
 if runkey is null or length(runkey)>150 or source is null or started is null or finished is null or finished<started
    or trigger_name not in ('schedule','manual') or trigger_name is null
    or candidates is null or jsonb_typeof(candidates)<>'array' then
   raise exception 'INVALID_PAYLOAD';
 end if;
 if jsonb_array_length(candidates)>100 or (err is not null and jsonb_array_length(candidates)>0) then raise exception 'INVALID_CANDIDATES'; end if;
 if err is not null and (length(err)>80 or err !~ '^[A-Z][A-Z_0-9]+$') then raise exception 'INVALID_ERROR'; end if;
 -- Serializes updates for this source, so stale/replayed runs cannot replace newer status.
 perform 1 from public.research_sources where id=source for update;
 if not found then raise exception 'UNKNOWN_SOURCE'; end if;
 insert into public.ingestion_runs(source_id,run_key,started_at,finished_at,status,candidate_count,error_code)
 values(source,runkey,started,finished,case when err is null then 'success' else 'error' end,jsonb_array_length(candidates),err)
 on conflict(source_id,run_key) do nothing returning id into inserted_id;
 if inserted_id is null then return jsonb_build_object('duplicate',true); end if;
 if exists(select 1 from public.research_sources where id=source and last_attempt_at>finished) then
   return jsonb_build_object('superseded',true);
 end if;
 for candidate in select value from jsonb_array_elements(candidates) loop
   if coalesce(candidate->>'url','') !~ '^https://' or length(candidate->>'url')>2048
      or coalesce(candidate->>'title','')='' or length(candidate->>'title')>500
      or coalesce(candidate->>'content_hash','') !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_CANDIDATE'; end if;
   insert into public.ingestion_candidates(url,source_id,title,content_hash,last_seen_at,published_at,reason)
   values(candidate->>'url',source,candidate->>'title',candidate->>'content_hash',finished,(candidate->>'published_at')::timestamptz,left(candidate->>'reason',300))
   on conflict(url) do update set
     last_seen_at=greatest(ingestion_candidates.last_seen_at,excluded.last_seen_at),
     review_status=case when ingestion_candidates.content_hash<>excluded.content_hash then 'pending' else ingestion_candidates.review_status end,
     title=excluded.title,content_hash=excluded.content_hash,
     published_at=coalesce(excluded.published_at,ingestion_candidates.published_at),reason=excluded.reason;
 end loop;
 select count(*) into pending from public.ingestion_candidates where source_id=source and review_status='pending';
 update public.research_sources set
   last_attempt_at=finished,last_error=err,last_trigger=trigger_name,pending_count=pending,
   consecutive_failures=case when err is null then 0 else consecutive_failures+1 end,
   checked_at=case when err is null then finished else checked_at end,
   status=case when err is null then 'Colectare reușită' else 'Eroare colectare' end,
   detail=case when err is null then pending||' candidați în așteptarea revizuirii. Nu sunt IPO-uri confirmate.' else err||' · Ultima verificare reușită rămâne neschimbată.' end
 where id=source;
 return jsonb_build_object('duplicate',false,'pending_count',pending);
end;
$$;
revoke all on function public.record_ingestion(jsonb) from public, anon, authenticated;
grant execute on function public.record_ingestion(jsonb) to service_role;
commit;
