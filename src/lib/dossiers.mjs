import {canonicalSource} from './reconciliation.mjs';
const normal=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/** Only explicitly reviewed identities are published; never infer an IPO from YC membership.
 * @param {import('./data').Company[]} existing
 * @param {import('./data').Company[]} reviewed
 */
export function mergeDossiers(existing,reviewed){
 const result=[];
 for(const company of [...existing,...reviewed]){
  const identities=[company.name,...(company.aliases||[])].map(normal);
  const at=result.findIndex(c=>c.id===company.id||[c.name,...(c.aliases||[])].map(normal).some(n=>identities.includes(n)));
  if(at<0){result.push({...company});continue;}
  const prior=result[at];
  const newer=(company.checkedAt||'')>(prior.checkedAt||'')?company:prior;
  const documents=[...(prior.documents||[]),...(company.documents||[])];
  const seen=new Set();
  result[at]={...newer,id:prior.id,aliases:[...new Set([...(prior.aliases||[]),...(company.aliases||[]),prior.name,company.name])],documents:documents.filter(d=>{const key=canonicalSource(d.url);if(!key||seen.has(key))return false;seen.add(key);return true;})};
 }
 return result.sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')||a.name.localeCompare(b.name));
}
/** @param {import('./data').Discovery[]} items @param {import('./data').Company[]} companies */
export function relatedSources(items,companies){
 /** @type {Record<string,import('./data').Discovery[]>} */
 const output={};
 for(const c of companies)output[c.id]=[];
 const seen=new Set();
 for(const item of items){
  const key=canonicalSource(item.url);if(!key||seen.has(key))continue;seen.add(key);
  const title=` ${normal(item.title)} `;
  const matches=companies.filter(c=>[c.name,...(c.aliases||[])].some(n=>normal(n).length>=4&&title.includes(` ${normal(n)} `)));
  if(matches.length===1&&![(matches[0].sourceUrl),...(matches[0].documents||[]).map(d=>d.url)].some(u=>canonicalSource(u)===key))output[matches[0].id].push(item);
 }
 for(const rows of Object.values(output))rows.sort((a,b)=>(b.published_at||'').localeCompare(a.published_at||''));
 return output;
}

/** Romanian dossiers require a documented official process, not speculative press.
 * @param {import('./data').Company} company */
export function eligibleCompany(company){
 const romanian=company.country==='România'||company.regions?.includes('România');
 return !romanian||(company.official&&['Documente depuse','Roadshow lansat','Ofertă programată','Listată'].includes(company.stage));
}
/** Never infer a trading date from a source, filing or estimated date.
 * @param {import('./data').Company} company */
export function listingDates(company){return {confirmed:company.context?.listingDate||null,estimated:company.context?.estimatedListingDate||null};}
