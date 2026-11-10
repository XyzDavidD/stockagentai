import { feeds, resultSql } from './collectors.mjs';
import { writeFile } from 'node:fs/promises';
// No secrets needed: produces a reviewable SQL import for the Supabase editor.
// Never publish candidates automatically. A filing may be a secondary offering.
const output = process.argv[2];
if(!output) throw new Error('Usage: node scripts/collect.mjs /tmp/stockagentai-import.sql');
const results=[];
for(const feed of feeds) {
  const started=new Date().toISOString();
  try {
    const response=await fetch(feed.url,{headers:{'User-Agent':process.env.SEC_USER_AGENT || 'stockagentai research https://github.com/XyzDavidD/stockagentai','Accept':'application/atom+xml,text/html'},signal:AbortSignal.timeout(20000)});
    // Respect denial/rate limits. No proxy or immediate retry on 403/429.
    if(!response.ok) throw new Error('HTTP_'+response.status);
    const html=await response.text();
    if(html.length>5_000_000) throw new Error('RESPONSE_TOO_LARGE');
    const candidates=feed.parse(html);
    results.push({id:feed.id,started,finished:new Date().toISOString(),candidates,error:null});
  } catch(error) {
    const code=/^(HTTP_\d+|UNEXPECTED_\w+|INVALID_\w+|BVB_TABLE_MISSING|RESPONSE_TOO_LARGE)$/.test(error.message) ? error.message : 'FETCH_FAILED';
    results.push({id:feed.id,started,finished:new Date().toISOString(),candidates:[],error:code});
  }
}
await writeFile(output,'begin;\n'+results.map(resultSql).join('\n')+'\ncommit;\nselect id,status,checked_at,detail from public.research_sources order by id;\n',{mode:0o600});
for(const r of results) console.log(`${r.id}: ${r.error || 'success'}; ${r.candidates.length} candidates`);
console.log(`Reviewable SQL saved to ${output}`);
