import {getResearchEvent} from '@/lib/supabase';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {safeEvidenceUrl} from '@/lib/signals.mjs';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,event=await getResearchEvent(id);if(!event)notFound();
 const date=(s:string|null)=>s?new Intl.DateTimeFormat('ro-RO',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bucharest'}).format(new Date(s)):'Neprecizată';
 return <main className="signal-dossier"><Link href="/cercetare">← Jurnalul cercetării</Link><span className="eyebrow">STOCKAGENTAI · SEMNAL AUTOMAT</span><h1>{event.company_name}</h1><p className="access-caution">Companie identificată prin reguli. Analiza nu este revizuită editorial și nu confirmă o ofertă disponibilă sau un randament.</p><h2>Ce face compania</h2><p>{event.summary}</p><dl className="business-facts"><dt>Industrie sugerată</dt><dd>{event.industry}</dd><dt>Țară / indiciu geografic</dt><dd>{event.region} · indiciul din sursă trebuie verificat pentru entitatea juridică</dd></dl><h2>De ce a fost detectată</h2><p>{event.listing_evidence}</p><h2>Dovada și cuvintele-cheie</h2><p>{event.title}</p><p>Cuvinte detectate în titlu: {event.keywords.join(', ')}.</p><dl className="business-facts"><dt>Canalul de descoperire</dt><dd>{event.source_name}</dd><dt>Publicarea sursei</dt><dd>{date(event.published_at)}</dd><dt>Prima detectare de modulul de alerte</dt><dd>{date(event.discovered_at)}</dd></dl>{safeEvidenceUrl(event.url)&&<a href={event.url} target="_blank" rel="noopener noreferrer">Deschide sursa originală ↗</a>}<h2>Ce rămâne de verificat</h2><p>Identitatea firmei, produsele, clienții, suma și tipul finanțării, declarația emitentului și existența unui plan explicit de listare. O finanțare sau o evaluare mare nu reprezintă singură o intenție de IPO.</p><Link href="/radar-timpuriu">Explorează radarul timpuriu →</Link></main>;
}
