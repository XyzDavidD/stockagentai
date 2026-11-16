import { feeds, toPayload } from './collectors.mjs';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function fetchBounded(url,fetcher=fetch) {
  const r=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{'User-Agent':process.env.SEC_USER_AGENT || 'stockagentai research https://github.com/XyzDavidD/stockagentai','Accept':'application/rss+xml,application/atom+xml,text/html'}});
  if(!r.ok) throw new Error('HTTP_'+r.status);
  if(!r.body) throw new Error('EMPTY_RESPONSE');
  const reader=r.body.getReader();let size=0;const chunks=[];
  try {
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2_000_000)throw new Error('RESPONSE_TOO_LARGE');chunks.push(value);}
  } finally {await reader.cancel();}
  return Buffer.concat(chunks).toString('utf8');
}
export async function collectFeed(feed,{fetcher=fetch,wait=delay,now=()=>new Date().toISOString()}={}) {
  const started=now();let error;
  for(let attempt=0;attempt<2;attempt++) {
    try {const body=await fetchBounded(feed.url,fetcher);return {id:feed.id,started,finished:now(),candidates:feed.parse(body),error:null};}
    catch(e) {
      const message=String(e.message);
      error=/^[A-Z][A-Z_0-9]+$/.test(message)?message:'FETCH_FAILED';
      // Denials, rate limits and parser errors are never immediately retried.
      if(attempt===0 && (error==='FETCH_FAILED'||/^HTTP_5\d\d$/.test(error))) {await wait(1200);continue;}
      break;
    }
  }
  return {id:feed.id,started,finished:now(),candidates:[],error};
}
export async function runCollection({persist,runKey,trigger='manual',selected=feeds,fetcher=fetch,wait=delay,random=Math.random}) {
  const results=[];
  const visited=new Set(), limited=new Set();
  // All Google News queries share one provider, regardless of country/channel.
  // Pace retries too; after a 429, leave this host alone for the rest of the run.
  const pacedFetch=async (url,options)=>{
    const host=new URL(url).hostname;
    if(limited.has(host))throw new Error('RATE_LIMIT_COOLDOWN');
    if(visited.has(host))await wait((host==='news.google.com'?10000:2000)+Math.floor(random()*2000));
    visited.add(host);
    const response=await fetcher(url,options);
    if(response.status===429)limited.add(host);
    return response;
  };
  for(const feed of selected.filter(f=>!f.paused)) {
    const result=await collectFeed(feed,{fetcher:pacedFetch,wait});
    // Persist each source atomically; a failure must fail the job, never report success.
    if(persist) await persist(toPayload(result,runKey,trigger));
    results.push(result);
    await wait(600);
  }
  return results;
}
export function createPersistence({url,key,fetcher=fetch}) {
  if(!key || /\s/.test(key) || !url || !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) throw new Error('MISSING_OR_INVALID_SUPABASE_CONFIGURATION');
  return async payload=>{
    let r; try { r=await fetcher(`${url}/rest/v1/rpc/record_ingestion`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json'},body:JSON.stringify({payload})}); } catch { throw new Error('PERSIST_NETWORK_ERROR'); }
    if(!r.ok) throw new Error(`PERSIST_HTTP_${r.status}`); // Never log response body or credentials.
  };
}
