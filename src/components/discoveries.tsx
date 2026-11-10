'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowUpRight,Search,ScanText,SlidersHorizontal} from 'lucide-react';
import type {Discovery} from '@/lib/data';
import {analyzeSignal,isOldPublication,safeEvidenceUrl} from '@/lib/signals.mjs';
const date=(value:string|null)=>value?new Intl.DateTimeFormat('ro-RO',{dateStyle:'medium',timeZone:'Europe/Bucharest'}).format(new Date(value)):'Necunoscută';
export default function Discoveries({items,error}:{items:Discovery[];error:string|null}){
 const [query,setQuery]=useState(''),[area,setArea]=useState('all'),[stage,setStage]=useState('all');
 const rows=useMemo(()=>items.map(item=>({...item,analysis:analyzeSignal(item.title)})),[items]);
 const filtered=rows.filter(item=>(area==='all'||item.area===area)&&(stage==='all'||item.analysis.id===stage)&&`${item.title} ${item.source_name}`.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro')));
 return <main className="discovery-page">
  <header className="discovery-nav"><Link href="/" className="discovery-back"><ArrowLeft size={17}/> Dashboard</Link><span>stockagent<strong>ai</strong> / Cercetare deschisă</span></header>
  <div className="discovery-heading"><div><p className="discovery-eyebrow">DIN SURSE, ÎNAINTE DE CONCLUZII</p><h1>Ce a găsit colectorul.</h1><p>Documente publice, indicii explicabile și întrebări încă deschise.</p></div><span className="discovery-mode"><ScanText size={18}/> Fără AI · fără API plătit</span></div>
  <section className="discovery-notice" aria-label="Cum interpretăm documentele"><strong>Descoperit nu înseamnă confirmat.</strong><p>Analiza folosește numai titlul, prin reguli în română, engleză și germană. Nu citește automat articolul integral și nu estimează randamente. Documentele nu devin automat dosare de companii. Data publicării nu este data listării.</p></section>
  {error?<div role="alert" className="discovery-notice"><p>{error}</p><button className="discovery-button" onClick={()=>window.location.reload()}>Reîncearcă</button></div>:<>
  <div className="discovery-toolbar"><label className="discovery-search"><Search size={17}/><input aria-label="Caută documente" placeholder="Caută în titluri și surse…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label><SlidersHorizontal size={16}/><select aria-label="Filtrează aria sursei" value={area} onChange={e=>setArea(e.target.value)}><option value="all">Toate ariile surselor</option>{[...new Set(items.map(i=>i.area))].sort().map(a=><option key={a}>{a}</option>)}</select></label><select aria-label="Filtrează indiciul" value={stage} onChange={e=>setStage(e.target.value)}><option value="all">Toate indiciile</option>{[...new Map(rows.map(r=>[r.analysis.id,r.analysis.label])).entries()].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div>
  <div className="discovery-count" role="status">{filtered.length} din {items.length} documente · maximum 100 descoperiri recente · ordonate după prima detectare</div>
  <div className="discovery-list">{filtered.map(item=>{const href=safeEvidenceUrl(item.url);return <article className="discovery-card" key={item.url}>
   <div className="discovery-card-top"><span>{item.source_name} <span className="discovery-dot">/</span> Aria sursei: {item.area}</span><span className="discovery-unverified">Necesită verificare</span></div>
   <h2>{item.title}</h2>
   <div className="discovery-analysis"><span className="discovery-tag">{item.analysis.label}</span><p>{item.analysis.explanation}</p>{item.analysis.matches.length>1&&<small>Indicii: {item.analysis.matches.join(' · ')}</small>}</div>
   <dl className="discovery-dates"><div><dt>Publicat</dt><dd>{date(item.published_at)}</dd></div><div><dt>Prima detectare</dt><dd>{date(item.discovered_at)}</dd></div><div><dt>Ultima observare în feed</dt><dd>{date(item.last_seen_at)}</dd></div></dl>
   {isOldPublication(item.published_at)&&<p className="discovery-old">Sursă mai veche de 90 de zile. Stadiul actual necesită reconfirmare.</p>}
   <footer><small>Reguli pe titlu · fără stadiu sau dată de IPO confirmate</small>{href&&<a href={href} target="_blank" rel="noopener noreferrer">Citește documentul <ArrowUpRight size={16}/></a>}</footer>
  </article>;})}</div>
  {!filtered.length&&<div className="discovery-empty"><ScanText size={30}/><h2>{items.length?'Niciun document pentru aceste filtre.':'Nu există încă documente în această listă.'}</h2><p>Lipsa rezultatelor nu înseamnă că nu există IPO-uri.</p>{!!items.length&&<button className="discovery-button" onClick={()=>{setQuery('');setArea('all');setStage('all');}}>Resetează filtrele</button>}</div>}
  </>}
  <footer className="discovery-footnote">Acces public, numai pentru citire. Dosarele verificate sunt în dashboard. Colectorul urmărește un set limitat de surse, fără acoperire exhaustivă.</footer>
 </main>;
}
