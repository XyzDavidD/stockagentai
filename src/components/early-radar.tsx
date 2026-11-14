'use client';
import {useMemo,useState,useEffect} from 'react';
import {earlyRowCompany} from '@/lib/company-detail';
import type {Company,Discovery,Source} from '@/lib/data';
import {markets} from '@/lib/research-focus.mjs';
import {earlyCompanyRows} from '@/lib/early-companies.mjs';
type Evidence={url:string;title:string;source:string;publishedAt:string|null;discoveredAt:string;official:boolean;reviewed?:boolean;keywords:string[];money:string|null};
type Profile={summary:string;thesis:string;valuation:string|null;funding:string;evidence:string;date:string;risks:string};
type Row={key:string;name:string;country:string;industry:string;kind:string;firstSeen:string;profile?:Profile;sources:Evidence[]};
const date=(s:string|null)=>s&&Number.isFinite(Date.parse(s))?new Intl.DateTimeFormat('ro-RO',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(s)):'Neprecizată';
export default function EarlyRadar({items,sources,error,evaluatedAt,onOpenCompany}:{items:Discovery[];sources:Source[];error:string|null;evaluatedAt:string;onOpenCompany:(company:Company)=>void}){
 const [query,setQuery]=useState(''),[group,setGroup]=useState('all'),[limit,setLimit]=useState(24);
 const rows:Row[]=useMemo(()=>earlyCompanyRows(items),[items]);
 const filtered=rows.filter(i=>(group==='all'||i.kind===group)&&`${i.name} ${i.country} ${i.industry}`.toLowerCase().includes(query.toLowerCase()));
 const channels=sources.filter(s=>s.id.startsWith('early-v2-'));
 const latest=channels.map(s=>s.checked_at).filter((s):s is string=>!!s).sort().at(-1);
 useEffect(()=>{const params=new URL(window.location.href).searchParams;const key=params.get('companie'),url=params.get('semnal');const found=rows.find(i=>i.key===key||i.sources.some(s=>s.url===url));if(found)onOpenCompany(earlyRowCompany(found));},[rows,onOpenCompany]);
 return <section className="early-radar">
  <div className="early-status"><strong>{rows.length} companii distincte</strong><span>Ultima verificare a canalelor: {latest?date(latest):'Încă neconfirmată'}</span><span>Fără IPO confirmat prin aceste semnale</span></div>
  {error&&<p role="alert">{error}</p>}
  <div className="early-filters"><input aria-label="Caută în radarul timpuriu" placeholder="Caută o companie sau o industrie…" value={query} onChange={e=>{setQuery(e.target.value);setLimit(24);}}/><select aria-label="Tip de semnal" value={group} onChange={e=>{setGroup(e.target.value);setLimit(24);}}><option value="all">Toate companiile</option><option value="valuation">Evaluare / unicorn relatat</option><option value="funding">Finanțare / rundă de capital</option></select></div>
  <p>{filtered.length} companii · cele mai recent identificate primele</p>
  {!filtered.length&&<div className="early-empty">Nicio companie pentru filtrele alese. Știrile fără o firmă identificabilă și un semnal concret nu sunt afișate.</div>}
  <div className="early-grid">{filtered.slice(0,limit).map(item=><button className="early-card" key={item.key} onClick={()=>onOpenCompany(earlyRowCompany(item))}><span className="access-contact-kind">{item.profile?'Profil documentat':'Companie identificată automat'} · {item.kind==='valuation'?'Evaluare relatată':'Finanțare'}</span><h3>{item.name}</h3><p>{item.industry} · {item.country}</p><p>{item.profile?.summary||`Semnal despre o companie din ${item.industry.toLowerCase()}. Activitatea exactă necesită cercetare suplimentară.`}</p><p><strong>{item.profile?.valuation||item.profile?.funding||'Rundă / evaluare menționată în sursă'}</strong></p><small>{item.sources.length} {item.sources.length===1?'sursă':'surse'} · Identificată: {date(item.firstSeen)} · Deschide analiza ↗</small></button>)}</div>
  {filtered.length>limit&&<button className="secondary" onClick={()=>setLimit(n=>n+24)}>Arată încă 24</button>}
  <details className="access-sources"><summary>Cum selectăm companiile</summary><p>Identificăm numele firmei, un domeniu relevant și un indiciu concret: rundă de capital, evaluare sau statut de unicorn relatat. Grupăm articolele despre aceeași firmă. Știrile politice, proiectele de infrastructură și rezultatele fără identitate clară sunt excluse.</p><p>Căutări în {markets.map(m=>m[1]).join(', ')}. Reguli automate, fără AI. Un rezultat automat are analiză limitată la titlu; sursele oficiale documentate separat au sinteză în română. Sumele istorice sunt datate și nu reprezintă evaluări curente. Piața unei căutări nu dovedește domiciliul companiei.</p><p>Colectare programată orar; procesăm cel mult 20 rezultate per canal, din ultimele 30 de zile. Vizualizarea grupează documentele disponibile (maximum 1.000), nu întregul internet.</p></details>

 </section>;
}
