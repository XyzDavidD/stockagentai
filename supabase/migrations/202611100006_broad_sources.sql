begin;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('stockanalysis-filings','Stock Analysis · depuneri IPO','SUA / internațional','Agregator neoficial','https://stockanalysis.com/ipos/filings/','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('stockanalysis-calendar','Stock Analysis · calendar IPO','SUA / internațional','Agregator neoficial','https://stockanalysis.com/ipos/calendar/','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('techcrunch','TechCrunch','SUA / internațional','Presă neoficială','https://techcrunch.com/feed/','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('eu-startups','EU-Startups','Europa','Presă neoficială','https://www.eu-startups.com/feed/','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('sifted','Sifted','Europa','Presă neoficială','https://sifted.eu/feed','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('profit','Profit.ro','România','Presă neoficială','https://www.profit.ro/rss','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('news-us','Google News · SUA','SUA','Agregator neoficial','https://news.google.com/rss/search?q=IPO+OR+%22plans+to+go+public%22+OR+%22confidential+filing%22+when%3A90d&hl=en-US&gl=US&ceid=US%3Aen','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('news-uk','Google News · Regatul Unit','Regatul Unit','Agregator neoficial','https://news.google.com/rss/search?q=IPO+OR+%22intention+to+float%22+OR+%22London+listing%22+when%3A90d&hl=en-GB&gl=GB&ceid=GB%3Aen','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('news-de','Google News · Germania','Germania','Agregator neoficial','https://news.google.com/rss/search?q=B%C3%B6rsengang+OR+IPO+OR+B%C3%B6rsenpl%C3%A4ne+when%3A90d&hl=de&gl=DE&ceid=DE%3Ade','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('news-at','Google News · Austria','Austria','Agregator neoficial','https://news.google.com/rss/search?q=B%C3%B6rsengang+OR+IPO+OR+B%C3%B6rsenpl%C3%A4ne+when%3A90d&hl=de&gl=AT&ceid=AT%3Ade','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('news-fr','Google News · Franța','Franța','Agregator neoficial','https://news.google.com/rss/search?q=%22introduction+en+bourse%22+OR+IPO+when%3A90d&hl=fr&gl=FR&ceid=FR%3Afr','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
insert into public.research_sources(id,name,area,kind,url,status,detail) values ('news-ro','Google News · România','România','Agregator neoficial','https://news.google.com/rss/search?q=%22listare+la+burs%C4%83%22+OR+%22ofert%C4%83+public%C4%83+ini%C8%9Bial%C4%83%22+OR+IPO+when%3A90d&hl=ro&gl=RO&ceid=RO%3Aro','Pregătit','Descoperire extinsă; sursă neoficială, necesită verificare.') on conflict(id) do update set name=excluded.name,kind=excluded.kind,url=excluded.url;
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
 if jsonb_array_length(candidates)>500 or (err is not null and jsonb_array_length(candidates)>0) then raise exception 'INVALID_CANDIDATES'; end if;
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

create or replace function public.documents_due()
returns table(url text,content_hash text) language sql stable security invoker set search_path=pg_catalog,public as $$
select c.url,c.content_hash from public.ingestion_candidates c left join public.document_evidence d on d.url=c.url
where c.review_status<>'rejected' and c.source_id in ('bvb-news','anthropic-news','deutsche-boerse','wiener-boerse','prnewswire')
and (d.url is null or d.retry_after<=now() or (d.error_code is null and d.candidate_hash<>c.content_hash))
order by d.attempted_at asc nulls first,c.discovered_at desc,c.url limit 4;
$$;
revoke all on function public.documents_due() from public,anon,authenticated;
grant execute on function public.documents_due() to service_role;
create or replace function public.list_discoveries_broad()
returns table(url text,title text,source_name text,source_kind text,area text,published_at timestamptz,discovered_at timestamptz,last_seen_at timestamptz,document_evidence jsonb,document_attempted_at timestamptz,document_error text,document_stale boolean,article_supported boolean)
language sql stable security definer set search_path=pg_catalog,public as $$
 select c.url,c.title,s.name,s.kind,s.area,c.published_at,c.discovered_at,c.last_seen_at,
 case when d.candidate_hash=c.content_hash then d.evidence - 'content_hash' else null end,
 d.attempted_at,d.error_code,coalesce(d.candidate_hash<>c.content_hash,false),
 c.source_id in ('bvb-news','anthropic-news','deutsche-boerse','wiener-boerse','prnewswire')
 from public.ingestion_candidates c join public.research_sources s on s.id=c.source_id left join public.document_evidence d on d.url=c.url
 where c.review_status<>'rejected' order by c.discovered_at desc,c.url limit 1000;
$$;
revoke all on function public.list_discoveries_broad() from public;
grant execute on function public.list_discoveries_broad() to anon,authenticated,service_role;
commit;
