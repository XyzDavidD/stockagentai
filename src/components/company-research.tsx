'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowUpRight,Search,Files} from 'lucide-react';
import type {Company,Discovery} from '@/lib/data';
import {reconcile,canonicalSource} from '@/lib/reconciliation.mjs';
import {safeEvidenceUrl} from '@/lib/signals.mjs';
const date=(value:string|null)=>value?new Intl.DateTimeFormat('ro-RO',{dateStyle:'medium',timeZone:'Europe/Bucharest'}).format(new Date(value)):'Dată necunoscută';
export default function CompanyResearch({items,companies,error,evaluatedAt,embedded=false}:{items:Discovery[];companies:Company[];error:string|null;evaluatedAt:string;embedded?:boolean}){
 const Root=embedded?'section':'main';
 const [query,setQuery]=useState(''),[reviewOnly,setReviewOnly]=useState(false);
 const result=useMemo(()=>reconcile(items,companies,Date.parse(evaluatedAt)),[items,companies,evaluatedAt]);
 const groups=result.groups.filter(g=>g.company.name.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro'))&&(!reviewOnly||g.documents.some(d=>d.comparison?.needsReview)));
 const unmatched=result.unmatched.filter(d=>d.item.title.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro')));
 return <Root className={`discovery-page ${embedded?'embedded-discovery':''}`}>
  {!embedded&&<header className="discovery-nav"><Link href="/" className="discovery-back"><ArrowLeft size={17}/> Dashboard</Link><Link href="/descoperiri">Toate documentele <ArrowUpRight size={14}/></Link></header>}
  <div className="discovery-heading"><div><p className="discovery-eyebrow">DOCUMENTE CARE SPUN ACEEAȘI POVESTE</p><h1>Dosare și semnale.</h1><p>Istoricul surselor, organizat în jurul fiecărei companii.</p></div><span className="discovery-mode"><Files size={18}/> Asociere prin reguli</span></div>
  <section className="discovery-notice"><strong>Dosarul publicat și indiciile noi rămân distincte.</strong><p>Legăm documentele prin URL-urile din dosare. Numele complet din titlu propune doar o asociere. Comparăm data publicării cu sursa curentă, fără să confundăm o descoperire recentă cu o știre nouă. Nu modificăm automat stadiile.</p></section>
  {error?<div role="alert" className="discovery-notice">{error} <button className="discovery-button" onClick={()=>window.location.reload()}>Reîncearcă</button></div>:<>
  <div className="dossier-stats"><div><strong>{companies.length}</strong><span>dosare publicate</span></div><div><strong>{result.groups.reduce((n,g)=>n+g.documents.length,0)}</strong><span>documente asociate sau propuse</span></div><div><strong>{result.reviewCount}</strong><span>documente de verificat</span></div></div>
  <div className="discovery-toolbar"><label className="discovery-search"><Search size={17}/><input aria-label="Caută dosare" value={query} placeholder="Caută o companie…" onChange={e=>setQuery(e.target.value)}/></label><label><input type="checkbox" checked={reviewOnly} onChange={e=>setReviewOnly(e.target.checked)}/> Doar de verificat</label></div>
  <p className="discovery-count" role="status">{groups.length} dosare afișate · {unmatched.length} documente fără asociere · analiza ultimelor maximum 1000 de descoperiri</p>
  <div className="discovery-list">{groups.map(({company,documents})=>{
   const known=company.documents||[{url:company.sourceUrl,title:company.sourceName,publishedAt:company.publishedAt,checkedAt:company.checkedAt}];
   const historical=known.filter(d=>!documents.some(x=>canonicalSource(x.item.url)===canonicalSource(d.url))).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
   return <article className="discovery-card dossier-card" id={company.id} key={company.id}>
    <div className="discovery-card-top"><span>{company.flag} {company.country} · {company.exchange}</span><span className="discovery-tag">Dosar publicat: {company.stage}</span></div><h2>{company.name}</h2><p className="dossier-summary">{company.summary}</p>
    <p className="dossier-current">Stadiul din dosar se bazează pe sursa din {date(company.publishedAt)}. Consultat: {date(company.checkedAt)}.</p>
    {documents.length===0&&<p className="dossier-none">Niciun document asociat în ultimele descoperiri. Sursele dosarului rămân disponibile mai jos.</p>}
    <ol className="dossier-timeline">{documents.map(({item,match,comparison})=>{const href=safeEvidenceUrl(item.url);return <li key={item.url}>
     <div className="dossier-event-top"><time>{date(comparison?.published||null)}</time><span className={comparison?.needsReview?'discovery-unverified':'discovery-tag'}>{comparison?.needsReview?'De verificat':'Context pentru dosar'}</span></div>
     {href?<a className="dossier-title" href={href} target="_blank" rel="noopener noreferrer">{item.title} <ArrowUpRight size={14}/></a>:<strong>{item.title}</strong>}
     <p className="dossier-match">{match.reason} · {item.source_name}</p><p>{comparison?.reason}</p>
     <small>Observat în feed: {date(item.last_seen_at)}. Asocierea nu confirmă că întregul conținut a fost revizuit.</small>
    </li>;})}</ol>
    {!!historical.length&&<details className="dossier-history"><summary>Surse din dosar, în afara listei curente de descoperiri ({historical.length})</summary><ul>{historical.map(d=>{const href=safeEvidenceUrl(d.url);return <li key={d.url}><span>{date(d.publishedAt)}</span>{href?<a href={href} target="_blank" rel="noopener noreferrer">{d.title} <ArrowUpRight size={14}/></a>:d.title}</li>;})}</ul></details>}
   </article>;
  })}</div>
  {!!unmatched.length&&<section className="dossier-unmatched"><h2>Documente fără asociere</h2><p>Pot privi companii noi sau nume ambigue. Nu creăm automat dosare. Afișăm primele 50; lista completă se găsește în Descoperiri.</p>{unmatched.slice(0,50).map(({item,match})=>{const href=safeEvidenceUrl(item.url);return <article key={item.url}><span className="discovery-unverified">Identitate de verificat</span><h3>{href?<a href={href} target="_blank" rel="noopener noreferrer">{item.title} <ArrowUpRight size={14}/></a>:item.title}</h3><p>{match.reason}. {item.source_name} · {date(item.published_at||item.document_evidence?.publication_date||null)}</p></article>;})}</section>}
  {!groups.length&&!unmatched.length&&<div className="discovery-empty"><h2>Niciun rezultat pentru aceste filtre.</h2><button className="discovery-button" onClick={()=>{setQuery('');setReviewOnly(false);}}>Resetează filtrele</button></div>}
  </>}
  <footer className="discovery-footnote">Fără AI și fără recomandări de investiții. Comparația este recalculată la încărcarea paginii; nu este un istoric al tuturor modificărilor și nu trimite notificări.</footer>
 </Root>;
}
