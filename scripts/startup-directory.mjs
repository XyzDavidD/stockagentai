import {fetchBounded} from './runner.mjs';
export function parseYcDirectory(body){
 const rows=JSON.parse(body);if(!Array.isArray(rows)||!rows.length||rows.length>500)throw new Error('YC_DIRECTORY_SHAPE_CHANGED');
 return rows.map(r=>{
  const url=new URL(r.url);if(url.protocol!=='https:'||url.hostname!=='www.ycombinator.com'||!url.pathname.startsWith('/companies/')||!r.name)throw new Error('YC_PROFILE_INVALID');
  return {id:String(r.id),name:String(r.name).slice(0,150),url:url.href,batch:String(r.batch||''),status:String(r.status||'Unknown'),stage:String(r.stage||''),industry:String(r.industry||''),location:String(r.all_locations||'').slice(0,250),description:String(r.one_liner||'').split(/\s+/).slice(0,20).join(' ')};
 });
}
export async function syncStartupDirectory(store){
 const state=await store.call('startup_directory_status',{});
 if(state.checked_at&&Date.now()-Date.parse(state.checked_at)<86400000)return {skipped:true,count:state.count};
 const profiles=parseYcDirectory(await fetchBounded('https://yc-oss.github.io/api/companies/top.json'));
 await store.call('record_startup_directory',{profiles});
 return {skipped:false,count:profiles.length};
}
