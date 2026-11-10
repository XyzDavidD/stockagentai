begin;
create table if not exists public.document_evidence (
 url text primary key references public.ingestion_candidates(url),
 candidate_hash text not null,
 attempted_at timestamptz not null,
 retry_after timestamptz not null,
 evidence jsonb,
 error_code text
);
alter table public.document_evidence enable row level security;
revoke all on public.document_evidence from anon,authenticated;
grant all on public.document_evidence to service_role;

create or replace function public.documents_due()
returns table(url text,content_hash text)
language sql stable security invoker set search_path=pg_catalog,public as $$
 select c.url,c.content_hash from public.ingestion_candidates c
 left join public.document_evidence d on d.url=c.url
 where c.review_status<>'rejected' and (d.url is null or d.retry_after<=now() or (d.error_code is null and d.candidate_hash<>c.content_hash))
 order by d.attempted_at asc nulls first,c.discovered_at desc,c.url limit 4;
$$;
revoke all on function public.documents_due() from public,anon,authenticated;
grant execute on function public.documents_due() to service_role;

create or replace function public.record_document(payload jsonb)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare
 target text:=payload->>'url'; hash text:=payload->>'candidate_hash';
 attempted timestamptz:=(payload->>'attempted_at')::timestamptz;
 err text:=payload->>'error'; doc jsonb:=nullif(payload->'evidence','null'::jsonb);
begin
 if target is null or hash is null or hash!~'^[a-f0-9]{64}$' or attempted is null or attempted>now()+interval '5 minutes' then raise exception 'INVALID_DOCUMENT'; end if;
 if err is not null and (err!~'^[A-Z][A-Z_0-9]+$' or length(err)>80 or doc is not null) then raise exception 'INVALID_DOCUMENT_ERROR'; end if;
 if err is null and (doc is null or jsonb_typeof(doc)<>'object' or coalesce(doc->>'version','')<>'article-rules-v1'
 or coalesce(doc->>'excerpt','')='' or length(doc->>'excerpt')>2000
 or array_length(regexp_split_to_array(trim(doc->>'excerpt'),'\s+'),1)>20
 or coalesce(doc->>'content_hash','')!~'^[a-f0-9]{64}$'
 or jsonb_typeof(doc->'indications') is distinct from 'array') then raise exception 'INVALID_EVIDENCE'; end if;
 perform 1 from public.ingestion_candidates where url=target and content_hash=hash for update;
 if not found then return jsonb_build_object('superseded',true); end if;
 insert into public.document_evidence(url,candidate_hash,attempted_at,retry_after,evidence,error_code)
 values(target,hash,attempted,attempted+case when err in ('HTTP_403','HTTP_429','DOCUMENT_URL_NOT_ALLOWED') then interval '7 days' else interval '1 day' end,doc,err)
 on conflict(url) do update set candidate_hash=excluded.candidate_hash,attempted_at=excluded.attempted_at,retry_after=excluded.retry_after,evidence=excluded.evidence,error_code=excluded.error_code
 where document_evidence.attempted_at<excluded.attempted_at;
 return jsonb_build_object('saved',true);
end;
$$;
revoke all on function public.record_document(jsonb) from public,anon,authenticated;
grant execute on function public.record_document(jsonb) to service_role;

-- A new read endpoint preserves compatibility with the already-deployed UI.
create or replace function public.list_discoveries_enriched()
returns table(url text,title text,source_name text,area text,published_at timestamptz,discovered_at timestamptz,last_seen_at timestamptz,document_evidence jsonb,document_attempted_at timestamptz,document_error text,document_stale boolean)
language sql stable security definer set search_path=pg_catalog,public as $$
 select c.url,c.title,s.name,s.area,c.published_at,c.discovered_at,c.last_seen_at,
 case when d.candidate_hash=c.content_hash then d.evidence - 'content_hash' else null end,
 d.attempted_at,d.error_code,coalesce(d.candidate_hash<>c.content_hash,false)
 from public.ingestion_candidates c join public.research_sources s on s.id=c.source_id
 left join public.document_evidence d on d.url=c.url
 where c.review_status<>'rejected' order by c.discovered_at desc,c.url limit 100;
$$;
revoke all on function public.list_discoveries_enriched() from public;
grant execute on function public.list_discoveries_enriched() to anon,authenticated,service_role;
commit;
