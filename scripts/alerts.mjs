import {createHash} from 'node:crypto';
import {focusEvidence,markets} from '../src/lib/research-focus.mjs';
import {analyzeSignal} from '../src/lib/signals.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const known={Anthropic:['SUA','Dezvoltă modele de inteligență artificială și asistentul Claude.'],OpenAI:['SUA','Dezvoltă modele de inteligență artificială și produse bazate pe acestea.'],Anduril:['SUA','Dezvoltă sisteme autonome și software pentru apărare.'],Helsing:['Germania','Dezvoltă software AI și sisteme pentru apărare.'],Mistral:['Franța','Dezvoltă modele de inteligență artificială.'],Nscale:['Regatul Unit','Dezvoltă infrastructură de calcul pentru AI.'],KNDS:['Germania / Franța','Produce echipamente și sisteme pentru apărare.']};
export function eventFromCandidate(c,source,now=new Date().toISOString()){
 const focus=focusEvidence(c.title);if(focus.excluded||!focus.industry)return null;
 const published=Date.parse(c.publishedAt||'');if(!Number.isFinite(published)||published>Date.parse(now)+3600000||published<Date.parse(now)-3*86400000)return null;
 const title=c.title.replace(/\s+-\s+[^-]+$/,'').trim();
 const familiar=Object.keys(known).find(n=>new RegExp(`\\b${n}\\b`,'i').test(title));
 const match=title.match(/^([\p{L}\p{N}&. '-]{2,65}?)\s+(?:raises|secures|lands|announces|files|plans|strânge|atrage|anunță|pregătește|obtient|lève|sammelt|erhält|haalt|recauda)\b/iu);
 const company=familiar||(match?.[1]||'').replace(/^(?:(?:UK['’]s|US['’]s|startup(?:-ul)?|AI startup|defence|defense|AI|tech|British|German|French)\s+)+/i,'').trim();
 if(!company||company.split(/\s+/).length>6||/^(the|a |an |un |o |this |how |why |government|minister|premier)/i.test(company))return null;
 const nationality=title.match(/^(British|German|French|American|Austrian|Swiss|Dutch|Polish|Swedish|Romanian)\b/i)?.[1]?.toLowerCase();
 const countries={british:'Regatul Unit',german:'Germania',french:'Franța',american:'SUA',austrian:'Austria',swiss:'Elveția',dutch:'Țările de Jos',polish:'Polonia',swedish:'Suedia',romanian:'România'};
 const geo=markets.find(m=>m[5].split(' OR ').some(term=>new RegExp('(?<![\\p{L}\\p{N}])'+term.replaceAll('"','')+'(?![\\p{L}\\p{N}])','iu').test(title)));
 // Search locale alone is not proof of a company's location. Alerts require a country clue or documented identity.
 const region=familiar?known[familiar][0]:(countries[nationality]||geo?.[1]);if(!region)return null;
 const growth=/\b(raises|funding|fundrais\w*|secures|finan\w*|serie\w*|unicorn\w*|investment|investit\w*|ipo|s-1|f-1|list\w*|bors\w*|roadshow|levee|lève|sammelt)\b/i.test(title.normalize('NFD').replace(/[\u0300-\u036f]/g,''));if(!growth)return null;
 const signal=analyzeSignal(title),company_key=normalize(company),id=hash(company_key);
 return {id,company_key,company_name:company,title:c.title,industry:focus.industry,region,keywords:[...new Set([...focus.keywords,...(title.match(/\b(raises|funding|Series [A-F]|IPO|pre-IPO|finanțare|financement|Finanzierung|unicorn)\b/gi)||[])])],url:c.url,published_at:c.publishedAt,discovered_at:now,source_name:source.name||source.id,
 summary:familiar?known[familiar][1]:`Activitate sugerată de titlu: ${focus.industry}. Descrierea exactă a produselor și clienților necesită verificarea articolului; nu avem încă o sinteză editorială.`,
 listing_evidence:`${signal.id==='uncertain'?'Fără intenție de listare confirmată în această analiză automată.':signal.label+'. '+signal.explanation} Semnalul indică un subiect de cercetat, nu potențial financiar demonstrat. Relatarea de verificat: ${title}`};
}
export function makeEmail(events,{to,from}){
 const text=['stockagentai — companii detectate pentru cercetare','Semnale automate, nerevizuite editorial. Nu sunt recomandări de investiții.',...events.map(e=>`\n${e.company_name}\nIndustrie: ${e.industry}\nȚară / indiciu geografic: ${e.region}\nCe face: ${e.summary}\nDe ce apare: ${e.listing_evidence}\nCuvinte detectate în titlu: ${e.keywords.join(', ')}\nCanal: ${e.source_name}\nPublicare: ${e.published_at}\nPrima detectare: ${e.discovered_at}\nDetalii: https://www.stockagentai.ro/semnale/${e.id}\nSursa: ${e.url}`),'\nColectarea este orară; sunt trimise doar firme identificate pentru prima dată de modulul de alerte. Pentru oprire, dezactivează ALERTS_ENABLED în GitHub Actions.'].join('\n');
 return {from,to:[to],subject:`stockagentai · ${events.length} ${events.length===1?'companie de cercetat':'companii de cercetat'}`,text};
}
export function alertStore({url,key,fetcher=fetch}){
 if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url||'')||!key)throw new Error('ALERT_STORE_CONFIGURATION');
 return async(path,method='GET',body,prefer)=>{let r;try{r=await fetcher(`${url}/rest/v1/${path}`,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},...(body?{body:JSON.stringify(body)}:{})});}catch{throw new Error('ALERT_STORE_NETWORK');}if(!r.ok)throw new Error('ALERT_STORE_HTTP_'+r.status);return r.status===204?null:await r.json();};
}
export async function sendDelivery(delivery,{store,resendKey,fetcher=fetch,now=new Date().toISOString()}){
 if(delivery.attempted_at&&Date.parse(now)-Date.parse(delivery.attempted_at)>23*3600000){await store('email_deliveries?id=eq.'+delivery.id,'PATCH',{status:'uncertain',error_code:'IDEMPOTENCY_WINDOW_EXPIRED'});return 'uncertain';}
 await store('email_deliveries?id=eq.'+delivery.id,'PATCH',{attempted_at:delivery.attempted_at||now});
 let r;try{r=await fetcher('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':delivery.id},body:JSON.stringify(delivery.payload)});}catch{return 'pending';}
 if(!r.ok){const retry=r.status===429||r.status>=500;await store('email_deliveries?id=eq.'+delivery.id,'PATCH',{status:retry?'pending':'failed',error_code:'RESEND_HTTP_'+r.status});return retry?'pending':'failed';}
 const data=await r.json();if(!data.id)throw new Error('RESEND_MISSING_ID');
 await store('email_deliveries?id=eq.'+delivery.id,'PATCH',{status:'accepted',accepted_at:now,provider_id:data.id,error_code:null});return 'accepted';
}
export async function runAlerts({results,sources,store,to,from,resendKey,enabled,now=new Date().toISOString()}){
 let created=0;
 for(const result of results.filter(r=>!r.error))for(const c of result.candidates){const source=sources.find(s=>s.id===result.id);const event=eventFromCandidate(c,source||{id:result.id},now);if(!event)continue;const rows=await store('research_events?on_conflict=company_key','POST',event,'resolution=ignore-duplicates,return=representation');created+=rows.length;}
 if(!enabled)return {created,email:'disabled'};
 if(!resendKey||!to||!from)throw new Error('ALERT_EMAIL_CONFIGURATION');
 const recipient_hash=hash(to.toLowerCase());
 const deliveries=await store(`email_deliveries?recipient_hash=eq.${recipient_hash}&select=*&order=created_at.desc&limit=1000`);
 const pending=deliveries.find(d=>d.status==='pending');if(pending)return {created,email:await sendDelivery(pending,{store,resendKey,now})};
 // At most one new digest per UTC hour, at most 24/day. Retry uses the same immutable body/key.
 const id='research-'+hash(recipient_hash+now.slice(0,13));if(deliveries.some(d=>d.id===id))return {created,email:'hour-limit'};
 const sent=new Set(deliveries.flatMap(d=>d.event_ids));
 const events=(await store('research_events?select=*&order=discovered_at.desc&limit=1000')).filter(e=>!sent.has(e.id)&&eventFromCandidate({title:e.title,url:e.url,publishedAt:e.published_at},{name:e.source_name},now)).slice(0,10);
 if(!events.length)return {created,email:'no-new-companies'};
 const delivery={id,recipient_hash,event_ids:events.map(e=>e.id),payload:makeEmail(events,{to,from}),status:'pending'};
 await store('email_deliveries','POST',delivery,'return=representation');
 return {created,email:await sendDelivery(delivery,{store,resendKey,now})};
}
