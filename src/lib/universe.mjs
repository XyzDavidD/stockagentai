import {reportedEventDate,isPossibleSpac} from './provenance.mjs';
/** Source identities stay separate: a directory entry is not a verified IPO.
 * @param {import('./data').Company[]} companies
 * @param {import('./data').Discovery[]} items
 * @param {{profile:import('./data').StartupProfile,checked_at:string}[]} startups
 */
export function companyUniverse(companies,items,startups){
 return [
 ...companies.map(c=>({id:c.id,name:c.name,area:c.country,kind:'Dosar verificat',stage:c.stage,url:c.sourceUrl,date:c.publishedAt,spac:false})),
 ...items.filter(i=>i.source_name.startsWith('Stock Analysis ·')).map(i=>({id:'discovery:'+i.url,name:i.title.split(' · IPO:')[0],area:'Piața SUA / internațional · domiciliu neverificat',kind:'Agregator neoficial',stage:i.title.split(' · IPO:')[1]||'De verificat',url:i.url,date:reportedEventDate(i),spac:isPossibleSpac(i.title)})),
 ...startups.filter(r=>r.profile.status==='Active').map(({profile:p})=>({id:'yc:'+p.id,name:p.name,area:p.location,kind:'Registru YC neoficial',stage:'Activă în director · intenție IPO neconfirmată',url:p.url,date:null,spac:false}))
 ];
}
/** @param {import('./data').Discovery[]} items */
export function estimatedCalendar(items){return items.filter(i=>i.source_name==='Stock Analysis · calendar IPO').map(i=>({...i,eventDate:reportedEventDate(i)?.slice(0,10)||null})).filter(i=>i.eventDate);}
/** @param {import('./data').Discovery} i */
export const discoveryKey=i=>'document:'+i.url+':'+i.title+':'+(i.published_at||'');
