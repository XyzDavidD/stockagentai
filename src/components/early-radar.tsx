'use client';
import {useMemo,useState,useEffect} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type {Discovery,Source} from '@/lib/data';
import {markets,eligibleFocused,focusEvidence} from '@/lib/research-focus.mjs';
import {earlySignal,earlyGroups,uniqueEarly} from '@/lib/early-signals.mjs';
import {safeEvidenceUrl} from '@/lib/signals.mjs';


const date=(s:string|null)=>s&&Number.isFinite(Date.parse(s))?new Intl.DateTimeFormat('ro-RO',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(s)):'Neprecizată';
export default function EarlyRadar({items,sources,error,evaluatedAt}:{items:Discovery[];sources:Source[];error:string|null;evaluatedAt:string}){
 const [query,setQuery]=useState(''),[group,setGroup]=useState('all'),[language,setLanguage]=useState('all'),[limit,setLimit]=useState(24),[selected,setSelected]=useState<Discovery|null>(null);
 const rows=useMemo(()=>uniqueEarly(items.filter(eligibleFocused)).sort((a:Discovery,b:Discovery)=>(Date.parse(b.published_at||'')||0)-(Date.parse(a.published_at||'')||0)||a.title.localeCompare(b.title,'ro')),[items]);
 const filtered=rows.filter((i:Discovery)=>(group==='all'||earlySignal(i.title)===group)&&(language==='all'||i.area===language)&&`${i.title} ${i.area}`.toLowerCase().includes(query.toLowerCase()));
 const channels=sources.filter(s=>s.id.startsWith('early-v2-'));
 const ok=channels.filter(s=>s.checked_at&&!s.last_error).length;
 const latest=channels.map(s=>s.checked_at).filter((s):s is string=>!!s).sort().at(-1);
 useEffect(()=>{const url=new URL(window.location.href).searchParams.get('semnal');if(url){const found=rows.find((i:Discovery)=>i.url===url);if(found)setSelected(found);}},[rows]);
 return <section className="early-radar">
  <div className="early-status"><strong>{rows.length} semnale automate disponibile</strong><span>{ok}/{markets.length*2} canale fără eroare la ultima verificare</span><span>Ultima colectare reușită: {latest?date(latest):'Încă neconfirmată'}</span></div>
  {error&&<p role="alert">{error}</p>}
  <details className="access-sources"><summary>Ce căutăm și în ce limbi</summary><p>{markets.map(m=>m[1]).join(', ')}. {markets.length*2} căutări tematice pentru AI, apărare și cybersecurity, programate orar, cu o fereastră de 30 de zile și maximum 20 rezultate per canal și rulare. Acoperirea nu este exhaustivă.</p><p>Finanțări, evaluări și planuri de listare, combinate cu AI, apărare, drone, cybersecurity și intelligence. Canalele pentru Asia și celelalte regiuni au fost oprite; rezultatele vechi nu mai apar aici. Sursele pot conține speculații sau știri istorice.</p><p>Etichetele automate folosesc reguli, fără AI. Titlurile rămân în limba originală până la cercetarea editorială. Rezultatele sunt documente, nu un număr de companii distincte; știrile diferite despre aceeași firmă pot rămâne separate. Sunt afișate din cele mai recente maximum 1.000 de documente disponibile în platformă.</p></details>
  <div className="early-filters"><input aria-label="Caută în radarul timpuriu" placeholder="Caută o companie, un proiect sau un domeniu…" value={query} onChange={e=>{setQuery(e.target.value);setLimit(24);}}/><select aria-label="Tip de semnal" value={group} onChange={e=>{setGroup(e.target.value);setLimit(24);}}><option value="all">Toate semnalele</option>{Object.entries(earlyGroups).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><select aria-label="Piața căutată" value={language} onChange={e=>{setLanguage(e.target.value);setLimit(24);}}><option value="all">Toate piețele</option>{[...new Set(rows.map((r:Discovery)=>r.area))].map(l=><option key={String(l)} value={String(l)}>{String(l)}</option>)}</select></div>
  <p>{filtered.length} rezultate · clasificare automată, de verificat</p>
  {!filtered.length&&<div className="early-empty">{rows.length?'Niciun rezultat pentru filtrele alese.':'Nu sunt încă semnale automate disponibile în acest radar. Starea colectării este afișată mai sus.'}</div>}
  <div className="early-grid">{filtered.slice(0,limit).map((item:Discovery)=><button className="early-card" key={item.url} onClick={()=>setSelected(item)}><span className="access-contact-kind">{earlyGroups[earlySignal(item.title)]} · indiciu</span><h3>{item.title}</h3><p>Piața căutată: {item.area} · Publicat: {date(item.published_at)}</p><small>Agregator neoficial · Deschide detaliile ↗</small></button>)}</div>
  {filtered.length>limit&&<button className="secondary" onClick={()=>setLimit(n=>n+24)}>Arată încă 24</button>}
  <Dialog.Root open={!!selected} onOpenChange={open=>{if(!open)setSelected(null);}}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="detail-panel early-detail"><Dialog.Close className="icon-button" aria-label="Închide semnalul">✕</Dialog.Close><span className="eyebrow">RADAR TIMPURIU · FĂRĂ IPO CONFIRMAT</span><Dialog.Title>{selected?.title}</Dialog.Title><Dialog.Description>Semnal colectat automat. Identitatea companiei, contextul și afirmațiile nu au fost revizuite editorial.</Dialog.Description>
  <><h3>De ce apare aici</h3><p>Industrie sugerată: {selected&&focusEvidence(selected.title).industry}. Cuvinte detectate: {selected&&focusEvidence(selected.title).keywords.join(', ')}.</p><p>A fost găsit într-o căutare multilingvă pentru finanțări, evaluări sau proiecte mari. Eticheta „{selected&&earlyGroups[earlySignal(selected.title)]}” este un indiciu extras prin reguli din titlu.</p><h3>Ce verifici în articol</h3><p>Compania sau proiectul exact; cine face afirmația; dacă suma este finanțare, evaluare, buget de construcție ori valoarea unui contract. Caută apoi anunțul emitentului și data evenimentului.</p><h3>Starea cercetării</h3><p>Fără analiză editorială, traducere automată sau intenție de listare confirmată. Piața căutată nu stabilește țara companiei.</p></>
  <dl className="business-facts"><dt>Sursă</dt><dd>{selected?.source_name}</dd><dt>Publicarea articolului</dt><dd>{date(selected?.published_at||null)}</dd><dt>Prima detectare</dt><dd>{date(selected?.discovered_at||null)}</dd></dl>
  {selected&&Date.parse(evaluatedAt)-Date.parse(selected.published_at||'')>90*86400000&&<p className="access-caution">Articol mai vechi de 90 de zile. Stadiul curent trebuie reverificat.</p>}
  {selected&&safeEvidenceUrl(selected.url)&&<a className="access-channel" href={selected.url} target="_blank" rel="noopener noreferrer">Deschide articolul în limba originală ↗</a>}
  </Dialog.Content></Dialog.Portal></Dialog.Root>
 </section>;
}
