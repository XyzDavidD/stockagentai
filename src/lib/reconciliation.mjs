import {analyzeSignal,safeEvidenceUrl} from './signals.mjs';
const normal=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function canonicalSource(value){const safe=safeEvidenceUrl(value);if(!safe)return null;const u=new URL(safe);u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_/.test(key))u.searchParams.delete(key);return u.href;}
/** @param {import('./data').Discovery} item @param {import('./data').Company[]} companies */
export function matchCompany(item,companies){
 const url=canonicalSource(item.url);
 const exact=companies.filter(c=>url&&[c.sourceUrl,...(c.documents||[]).map(d=>d.url)].some(link=>canonicalSource(link)===url));
 if(exact.length===1)return {companyId:exact[0].id,kind:'source',reason:'URL prezent în sursele dosarului'};
 if(exact.length>1)return {companyId:null,kind:'ambiguous',reason:'Sursa este comună mai multor dosare; asociere ambiguă'};
 const text=` ${normal(item.title)} `;
 const names=companies.filter(c=>{const name=normal(c.name);return name.length>=4&&text.includes(` ${name} `);});
 if(names.length===1)return {companyId:names[0].id,kind:'name',reason:'Nume complet în titlu; asociere propusă, de verificat'};
 return {companyId:null,kind:names.length?'ambiguous':'unmatched',reason:names.length?'Mai multe companii menționate; asociere ambiguă':'Nicio asociere sigură cu dosarele existente'};
}
const stages={roadshow:'Roadshow lansat',filing:'Documente depuse',completed:'Listată',intention:'Intenție anunțată',paused:'Amânată'};
const day=value=>{const time=Date.parse(value||'');return Number.isFinite(time)?new Date(time).toISOString().slice(0,10):null;};
/** @param {import('./data').Discovery} item @param {import('./data').Company} company @param {ReturnType<typeof matchCompany>} match */
export function compareSignal(item,company,match,now=Date.now()){
 const feed=day(item.published_at),article=day(item.document_evidence?.publication_date),published=feed||article;
 const signal=analyzeSignal(item.title),suggested=stages[signal.id]||null;
 const result=(kind,reason,needsReview)=>({kind,reason,needsReview,published,suggested,signalLabel:signal.label});
 if(match.kind!=='source')return result('identity','Verifică identitatea companiei înainte de a interpreta schimbarea.',true);
 if(item.document_stale)return result('changed','Titlul sursei s-a schimbat; fragmentul vechi nu mai este folosit.',true);
 if(feed&&article&&feed!==article)return result('date-conflict','Date diferite în feed și articol; cronologia necesită verificare.',true);
 if(!published||!day(company.publishedAt))return result('undated','Fără dată comparabilă de publicare; nu presupunem că este un semnal nou.',true);
 if(published>day(new Date(now).toISOString()))return result('future','Data publicării este în viitor; verifică metadatele.',true);
 if(published<day(company.publishedAt))return result('history','Document anterior sursei curente din dosar; nu schimbă stadiul înapoi.',false);
 if(published===day(company.publishedAt))return result('same-day','Sursă din aceeași zi cu dosarul; nu putem deduce ordinea intrazilnică.',false);
 if(!suggested)return result('new-document','Document mai recent, cu stadiu neclar. Necesită citire și verificare.',true);
 return suggested!==company.stage?result('possible-change',`Indiciu de „${suggested}” față de „${company.stage}” în dosar. Nu este o schimbare confirmată.`,true):result('new-document','Document mai recent cu indiciu similar stadiului curent; verifică eventualele detalii noi.',true);
}
/** @param {import('./data').Discovery[]} items @param {import('./data').Company[]} companies */
export function reconcile(items,companies,now=Date.now()){
 const seen=new Set();
 const documents=items.filter(item=>{const key=canonicalSource(item.url)||item.url;if(seen.has(key))return false;seen.add(key);return true;}).map(item=>{
  const match=matchCompany(item,companies),company=companies.find(c=>c.id===match.companyId);
  return {item,match,comparison:company?compareSignal(item,company,match,now):null};
 });
 const groups=companies.map(company=>({company,documents:documents.filter(d=>d.match.companyId===company.id).sort((a,b)=>(b.comparison?.published||'').localeCompare(a.comparison?.published||''))}));
 return {groups,unmatched:documents.filter(d=>!d.match.companyId),reviewCount:documents.filter(d=>!d.match.companyId||d.comparison?.needsReview).length};
}
