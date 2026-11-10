'use client';
import {useMemo,useState} from 'react';
import type {Company,Discovery,StartupProfile} from '@/lib/data';
import {safeEvidenceUrl} from '@/lib/signals.mjs';
export default function CompanyUniverse({companies,items,startups,error,onVerified}:{companies:Company[];items:Discovery[];startups:{profile:StartupProfile;checked_at:string}[];error:string|null;onVerified:()=>void}){
 const [query,setQuery]=useState(''),[type,setType]=useState('all'),[limit,setLimit]=useState(30);
 const rows=useMemo(()=>[
  ...companies.map(c=>({id:'verified:'+c.id,name:c.name,area:c.country,kind:'Dosar verificat',stage:c.stage,url:c.sourceUrl})),
  ...items.filter(i=>i.source_name.startsWith('Stock Analysis ·')).map(i=>({id:i.url,name:i.title.split(' · IPO:')[0],area:'Piața SUA / internațional · domiciliu neverificat',kind:'Agregator neoficial',stage:i.title.split(' · IPO:')[1]||'De verificat',url:i.url})),
  ...startups.filter(r=>r.profile.status==='Active').map(({profile:p})=>({id:'yc:'+p.id,name:p.name,area:p.location,kind:'Registru YC neoficial',stage:'Activă în director · intenție IPO neconfirmată',url:p.url}))
 ],[companies,items,startups]);
 const filtered=rows.filter(r=>(type==='all'||type===r.kind)&&`${r.name} ${r.area}`.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro'))).sort((a,b)=>a.name.localeCompare(b.name));
 return <section className="table-panel company-universe"><div className="section-heading"><div><h2>Companii și startupuri de cercetat</h2><p>Dosare, înregistrări din agregatoare și profiluri YC. Aceeași companie poate apărea în mai multe surse. Depunerile pot fi istorice sau retrase; stadiul curent necesită verificare.</p></div><button onClick={onVerified}>Doar dosarele verificate →</button></div>
 <div className="discovery-toolbar"><label className="discovery-search"><input aria-label="Caută în universul companiilor" placeholder="Nume sau locație…" value={query} onChange={e=>{setQuery(e.target.value);setLimit(30);}}/></label><select aria-label="Tipul înregistrării" value={type} onChange={e=>{setType(e.target.value);setLimit(30);}}><option value="all">Toate înregistrările</option><option>Dosar verificat</option><option>Agregator neoficial</option><option>Registru YC neoficial</option></select></div>
 {error&&<p className="notice" role="alert">Unele date nu sunt disponibile: {error}</p>}<p className="home-radar-count" role="status">{filtered.length} înregistrări din surse · nu reprezintă {filtered.length} IPO-uri confirmate sau companii distincte</p>
 <div className="universe-list">{filtered.slice(0,limit).map(r=>{const href=safeEvidenceUrl(r.url);return <article key={r.id}><div><strong>{r.name}</strong><small>{r.area||'Locație necunoscută'}</small></div><div><span className="badge gray">{r.kind}</span><small>{r.stage}</small></div>{href&&<a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Sursa pentru ${r.name}`}>Sursă ↗</a>}</article>;})}</div>{filtered.length>limit&&<button className="discovery-button" onClick={()=>setLimit(n=>n+30)}>Arată încă 30</button>}
 </section>;
}
