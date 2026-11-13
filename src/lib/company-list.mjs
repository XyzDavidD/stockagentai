const identity=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
/** Merge automatic discoveries into the list without replacing reviewed dossiers.
 * @param {import('./data').Company[]} companies
 * @param {import('./data').ResearchEvent[]} events
 * @returns {import('./data').Company[]}
 */
export function companyList(companies,events){
 const names=new Set(companies.flatMap(c=>[c.name,...(c.aliases||[])].map(identity)));
 const rows=[...companies];
 for(const event of [...events].sort((a,b)=>a.discovered_at.localeCompare(b.discovered_at))){
  const key=identity(event.company_name);if(names.has(key)||event.region==='România')continue;names.add(key);
  rows.push({id:`signal-${event.id}`,signalId:event.id,discoveredAt:event.discovered_at,name:event.company_name,monogram:event.company_name.slice(0,2),color:'mint',country:event.region,flag:'',sector:event.industry,exchange:'Bursă neconfirmată',stage:'Semnal preliminar',confidence:'Scăzută',priority:0,publishedAt:event.published_at||'',checkedAt:'',official:false,sourceLabel:'Automat · nerevizuit',sourceUrl:event.url,sourceName:event.source_name,summary:event.summary,signal:event.listing_evidence,date:null,dateLabel:'Fără calendar confirmat',evidence:1,opportunity:'De cercetat',risk:'Nu confirmă o intenție de listare.'});
 }
 return rows;
}
/** @param {import('./data').Company} a @param {import('./data').Company} b */
export function newestCompanyFirst(a,b){
 // Older editorial dossiers have no historical discovery timestamp. Use their dated review,
 // explicitly labelled in the UI, rather than pretending publication was first discovery.
 return (Date.parse(b.discoveredAt||b.checkedAt)||0)-(Date.parse(a.discoveredAt||a.checkedAt)||0)||a.name.localeCompare(b.name,'ro');
}
