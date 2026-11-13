import {createHash} from 'node:crypto';
import {sendDelivery} from './alerts.mjs';
const zone='Europe/Bucharest';
const parts=iso=>Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)).map(p=>[p.type,p.value]));
export function localInstant(date,hour){
 const target=Date.parse(`${date}T${String(hour).padStart(2,'0')}:00:00Z`);let instant=target;
 for(let i=0;i<3;i++){const p=parts(instant);const local=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:00:00Z`);instant+=target-local;}
 return new Date(instant).toISOString();
}
export function summaryWindow(now,preview=false){
 const p=parts(now);let date=`${p.year}-${p.month}-${p.day}`;
 // A delayed run after midnight still belongs to the most recent 21:00 deadline.
 if(!preview&&Number(p.hour)<21)date=new Date(Date.parse(date+'T12:00:00Z')-86400000).toISOString().slice(0,10);
 return {date,start:localInstant(date,0),end:preview&&Number(p.hour)<21?now:localInstant(date,21)};
}
async function allRows(store,path){
 const rows=[];for(let offset=0;offset<50000;offset+=1000){const batch=await store(`${path}&limit=1000&offset=${offset}`);rows.push(...batch);if(batch.length<1000)return rows;}
 throw new Error('DAILY_SUMMARY_ROW_LIMIT');
}
export async function dailyData(store,window){
 const filter=field=>`${field}=gte.${encodeURIComponent(window.start)}&${field}=lt.${encodeURIComponent(window.end)}`;
 const [events,runs,documents]=await Promise.all([
  allRows(store,`research_events?select=*&${filter('discovered_at')}&order=discovered_at.asc,id.asc`),
  allRows(store,`ingestion_runs?select=source_id,run_key,status,candidate_count,finished_at&${filter('finished_at')}&order=finished_at.asc,id.asc`),
  allRows(store,`ingestion_candidates?select=url&${filter('discovered_at')}&order=discovered_at.asc,url.asc`),
 ]);
 return {events,runs,newDocuments:documents.length};
}
export function dailyEmail(data,window,{to,from,preview=false}){
 const errors=data.runs.filter(r=>r.status==='error');
 const latest=data.runs.filter(r=>r.status==='success').at(-1)?.finished_at;
 const time=iso=>new Intl.DateTimeFormat('ro-RO',{timeZone:zone,dateStyle:'short',timeStyle:'short'}).format(new Date(iso));
 const text=[`Bună, Sergiu!\n\nRezumat stockagentai — ${window.date}`,
 `Interval: ${time(window.start)} – ${time(window.end)} (ora României).${preview?' Previzualizare înaintea orei programate.':''}`,
 `\nACTIVITATEA ZILEI\n${data.events.length} companii înregistrate pentru prima dată de modulul de alerte.\n${data.newDocuments} documente noi colectate (nu companii distincte).\n${new Set(data.runs.map(r=>r.run_key)).size} rulări · ${new Set(data.runs.map(r=>r.source_id)).size} surse verificate · ${errors.length} verificări de surse cu eroare.\nUltima colectare reușită din interval: ${latest?time(latest):'niciuna înregistrată'}.`,
 ...(data.runs.length?[]:['ATENȚIE: Nu există rulări înregistrate în acest interval. Absența rezultatelor nu confirmă absența oportunităților.']),
 `\nCOMPANII DESCOPERITE\n${data.events.length?'Semnale automate, nerevizuite editorial.':'Astăzi nu au fost înregistrate companii noi care să treacă regulile de identificare. Căutarea continuă.'}`,
 ...data.events.slice(0,50).map(e=>`\n${e.company_name} · ${e.region}\nIndustrie: ${e.industry}\nCe face: ${e.summary}\nSemnal și dovezi: ${e.listing_evidence}\nCuvinte detectate: ${e.keywords.join(', ')}\nDescoperită: ${time(e.discovered_at)}\nSursa: ${e.source_name}\n${e.url}\nFișa: https://www.stockagentai.ro/semnale/${e.id}`),
 ...(data.events.length>50?[`\nÎn e-mail sunt prezentate primele 50 din ${data.events.length} companii. Restul sunt disponibile în platformă.`]:[]),
 ...(errors.length?[`\nSURSE CU ERORI\n${[...new Set(errors.map(r=>r.source_id))].join(', ')}`]:[]),
 '\nJurnal și loguri: https://www.stockagentai.ro/cercetare\nCompanii: https://www.stockagentai.ro/companii\nRadar timpuriu: https://www.stockagentai.ro/radar-timpuriu',
 '\nRezumatul completează alertele pentru companii noi. O finanțare sau o evaluare mare nu confirmă intenția de IPO. Nu sunt recomandări de investiții. Raportul acoperă ziua până la 21:00, nu orele rămase până la miezul nopții.',
 ].join('\n');
 return {from,to:[to],subject:`stockagentai · Rezumat zilnic · ${window.date}`,text};
}
export async function runDailySummary({store,to,from,resendKey,now=new Date().toISOString(),dryRun=false,sender=sendDelivery}){
 const window=summaryWindow(now,dryRun);
 const recipient_hash=createHash('sha256').update((to||'').trim().toLowerCase()).digest('hex');
 const id=`daily-${window.date}-${recipient_hash}`;
 if(!dryRun){
  if(!to||!from||!resendKey)throw new Error('DAILY_EMAIL_CONFIGURATION');
  const prior=(await store(`email_deliveries?id=eq.${id}&select=*`))[0];
  if(prior)return {date:window.date,status:prior.status==='pending'?await sender(prior,{store,resendKey,now}):prior.status==='accepted'?'already-sent':prior.status};
 }
 const data=await dailyData(store,window);
 if(dryRun)return {date:window.date,status:'preview',companies:data.events.length,documents:data.newDocuments,runs:data.runs.length,errors:data.runs.filter(r=>r.status==='error').length};
 const delivery={id,recipient_hash,event_ids:data.events.map(e=>e.id),payload:dailyEmail(data,window,{to,from}),status:'pending'};
 await store('email_deliveries','POST',delivery,'return=representation');
 return {date:window.date,status:await sender(delivery,{store,resendKey,now})};
}
