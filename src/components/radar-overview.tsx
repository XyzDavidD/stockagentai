'use client';
import {useMemo,useState} from 'react';
import type {Discovery} from '@/lib/data';
import {sourceCategory} from '@/lib/provenance.mjs';
import {safeEvidenceUrl} from '@/lib/signals.mjs';
export default function RadarOverview({items,error,onExplore}:{items:Discovery[];error:string|null;onExplore:()=>void}){
 const [area,setArea]=useState('all');
 const areas=[...new Set(items.map(i=>i.area))].sort();
 const rows=useMemo(()=>items.filter(i=>area==='all'||i.area===area).sort((a,b)=>(b.published_at||'').localeCompare(a.published_at||'')),[items,area]);
 return <section className="table-panel home-radar"><div className="section-heading"><div><h2>Radar IPO · toate sursele</h2><p>Știri și intenții colectate. Aria indică sursa căutării, nu domiciliul companiei.</p></div><button className="text-button" onClick={onExplore}>Explorează toate rezultatele →</button></div>
 <div className="home-region-tabs" aria-label="Aria radarului"><button aria-pressed={area==='all'} onClick={()=>setArea('all')}>Toate ariile</button>{areas.map(a=><button key={a} aria-pressed={area===a} onClick={()=>setArea(a)}>{a==='Regatul Unit'?'Regatul Unit / Anglia':a}</button>)}</div>
 {error?<p role="alert" className="notice">{error}</p>:<><p className="home-radar-count" role="status">{rows.length} documente în această selecție · afișăm primele 8</p><div className="home-radar-rows">{rows.slice(0,8).map(i=>{const href=safeEvidenceUrl(i.url);return <article key={i.url}><div><span className="badge gray">{sourceCategory(i.source_kind)}</span><small>{i.source_name} · {i.published_at?new Date(i.published_at).toLocaleDateString('ro-RO',{timeZone:'Europe/Bucharest'}):'Publicare necunoscută'}</small></div><h3>{href?<a href={href} target="_blank" rel="noopener noreferrer">{i.title} ↗</a>:i.title}</h3></article>;})}</div>{!rows.length&&<p className="notice">Niciun document pentru această arie în setul disponibil.</p>}</>}
 </section>;
}
