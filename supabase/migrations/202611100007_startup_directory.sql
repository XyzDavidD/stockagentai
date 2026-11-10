begin;
create table if not exists public.startup_directory(id text primary key, profile jsonb not null, checked_at timestamptz not null);
create table if not exists public.startup_directory_sync(id text primary key check(id='yc-top'),checked_at timestamptz not null);
alter table public.startup_directory enable row level security;
alter table public.startup_directory_sync enable row level security;
revoke all on public.startup_directory,public.startup_directory_sync from anon,authenticated;
grant all on public.startup_directory,public.startup_directory_sync to service_role;
create or replace function public.startup_directory_status() returns jsonb language sql stable security definer set search_path=pg_catalog,public as $$
select jsonb_build_object('checked_at',(select checked_at from public.startup_directory_sync where id='yc-top'),'count',(select count(*) from public.startup_directory where checked_at=(select checked_at from public.startup_directory_sync where id='yc-top')));
$$;
create or replace function public.list_startup_directory() returns table(profile jsonb,checked_at timestamptz) language sql stable security definer set search_path=pg_catalog,public as $$
select d.profile,d.checked_at from public.startup_directory d where d.checked_at=(select s.checked_at from public.startup_directory_sync s where s.id='yc-top') order by d.profile->>'name' limit 500;
$$;
create or replace function public.record_startup_directory(profiles jsonb) returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare p jsonb; checked timestamptz:=now();
begin
 if jsonb_typeof(profiles) is distinct from 'array' then raise exception 'INVALID_DIRECTORY'; end if;
 if jsonb_array_length(profiles)<1 or jsonb_array_length(profiles)>500 then raise exception 'INVALID_DIRECTORY_SIZE'; end if;
 for p in select value from jsonb_array_elements(profiles) loop
 if coalesce(p->>'id','')='' or coalesce(p->>'name','')='' or coalesce(p->>'url','')!~'^https://www[.]ycombinator[.]com/companies/' then raise exception 'INVALID_PROFILE'; end if;
 insert into public.startup_directory(id,profile,checked_at) values(p->>'id',p,checked) on conflict(id) do update set profile=excluded.profile,checked_at=excluded.checked_at;
 end loop;
 insert into public.startup_directory_sync(id,checked_at) values('yc-top',checked) on conflict(id) do update set checked_at=excluded.checked_at;
 return jsonb_build_object('count',jsonb_array_length(profiles));
end;
$$;
revoke all on function public.record_startup_directory(jsonb) from public,anon,authenticated;
grant execute on function public.record_startup_directory(jsonb) to service_role;
revoke all on function public.startup_directory_status(), public.list_startup_directory() from public;
grant execute on function public.startup_directory_status(), public.list_startup_directory() to anon,authenticated,service_role;
commit;
