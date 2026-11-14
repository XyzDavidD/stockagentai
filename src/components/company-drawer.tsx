"use client";
import * as Dialog from '@radix-ui/react-dialog';
import {X,Check,Plus,Info,FileText,ExternalLink} from 'lucide-react';
import type {Company,Discovery} from '@/lib/data';
import CompanyAccess from './company-access';
import {listingDates} from '@/lib/dossiers.mjs';
import {sourceCategory} from '@/lib/provenance.mjs';
function Logo({
  company,
  small = false,
}: {
  company: Company;
  small?: boolean;
}) {
  return (
    <span className={`company-logo ${company.color} ${small ? "small" : ""}`}>
      {company.monogram}
    </span>
  );
}
function Badge({ stage }: { stage: string }) {
  return (
    <span
      className={`badge ${stage === "Documente depuse" ? "green" : stage === "Ofertă programată" ? "blue-badge" : stage === "Semnal preliminar" ? "gray" : "amber"}`}
    >
      <span />
      {stage}
    </span>
  );
}
export default function CompanyDrawer({selected,onClose,watch,toggle,associated={},evaluatedAt}:{selected:Company|null;onClose:()=>void;watch:string[];toggle:(id:string)=>void;associated?:Record<string,Discovery[]>;evaluatedAt:string}){
 const formatDate=(value:string)=>!value||!Number.isFinite(Date.parse(value))?'Dată neprecizată':new Intl.DateTimeFormat('ro-RO',{dateStyle:'medium',timeZone:'Europe/Bucharest'}).format(new Date(value));
 const stale=(c:Company)=>Date.parse(evaluatedAt)-Date.parse(c.publishedAt)>90*86400000;
 return (
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="detail-panel"
            aria-describedby="company-description"
          >
            {selected && (
              <>
                <div className="detail-top">
                  <span className="eyebrow">DOSAR DE CERCETARE</span>
                  <Dialog.Close
                    className="icon-button"
                    aria-label="Închide profilul"
                  >
                    <X size={20} />
                  </Dialog.Close>
                </div>
                <div className="detail-title">
                  <Logo company={selected} />
                  <div>
                    <Dialog.Title>{selected.name}</Dialog.Title>
                    <span>
                      {selected.flag} {selected.country} <span>·</span>{" "}
                      {selected.sector}
                    </span>
                  </div>
                </div>
                <Dialog.Description
                  id="company-description"
                  className="detail-description"
                >
                  {selected.summary}
                </Dialog.Description>
                <div className="detail-actions">
                  <Badge stage={selected.stage} />
                  <button
                    className={
                      watch.includes(selected.id) ? "secondary" : "primary"
                    }
                    onClick={() => toggle(selected.id)}
                  >
                    {watch.includes(selected.id) ? (
                      <Check size={15} />
                    ) : (
                      <Plus size={15} />
                    )}
                    {watch.includes(selected.id) ? "În lista mea" : "Urmărește"}
                  </button>
                </div>
                <button className="access-jump" onClick={()=>document.getElementById("company-access")?.scrollIntoView({behavior:"smooth",block:"start"})}>Acces la acțiuni și contacte ↓</button>
                <div className="demo-warning">
                  <Info size={17} />
                  <p>
                    {stale(selected) ? "Sursă mai veche de 90 de zile: stadiul necesită reconfirmare. " : ""}Stadiul reflectă documentul citat, nu garantează că oferta se va realiza.
                  </p>
                </div>
                {selected.context&&<section className="detail-section business-section"><h3>Ce face concret compania</h3><p>{selected.context.business.description}</p><dl className="business-facts"><dt>Produse și servicii</dt><dd>{selected.context.business.products}</dd><dt>Cui se adresează</dt><dd>{selected.context.business.customers}</dd><dt>Cum funcționează afacerea</dt><dd>{selected.context.business.model}</dd></dl><a href={selected.context.business.sourceUrl} target="_blank" rel="noopener noreferrer">Sursa descrierii afacerii ↗</a></section>}
                <div className="detail-stats">
                  <div>
                    <small>VERIFICAREA DOSARULUI</small>
                    <strong>
                      {formatDate(selected.checkedAt)}
                    </strong>
                  </div>
                  <div>
                    <small>ÎNCREDERE ÎN DOVEZI</small>
                    <strong className="confidence">
                      {selected.confidence}
                    </strong>
                  </div>
                </div>
                <p className="score-explainer">
                  {selected.checkedAt?`Dosar verificat la ${formatDate(selected.checkedAt)}.`:'Semnal automat, fără verificare editorială a dosarului.'} Tipul sursei: {selected.sourceLabel||(selected.official?"Oficială":"Presă")}. Stadiul se poate schimba după această verificare.
                </p>
                <section className="detail-section">
                  <h3>{selected.stage==='Semnal preliminar'?'Semnalul de creștere și situația listării':'Unde a fost anunțată listarea'}</h3>
                  <p>{selected.signal}</p>
                  {selected.context?.listingEvidence.map((e,i)=><article className="listing-evidence" key={e.url}><div><span className="badge gray">{e.kind==='official'?'Sursă oficială':e.kind==='aggregator'?'Agregator · neconfirmat':'Relatare de presă'}</span><small>{e.publishedDate?formatDate(e.publishedDate):'Fără zi exactă de publicare'}</small></div><h4>{e.sourceName}</h4><p>{e.statement}</p><p className="date-explanation">{e.dateExplanation}</p><a href={e.url} target="_blank" rel="noopener noreferrer">Deschide dovada {i+1} ↗</a></article>)}
                  <div className="detail-fact">
                    <span>Bursa vizată</span>
                    <strong>{selected.exchange}</strong>
                  </div>
                  <div className="detail-fact">
                    <span>
                      {selected.date
                        ? "Începutul subscrierii"
                        : "Orizont de listare"}
                    </span>
                    <strong>{selected.dateLabel}</strong>
                  </div>
                  <div className="detail-fact">
                    <span>Prima zi de tranzacționare</span>
                    <strong>{listingDates(selected).confirmed?formatDate(listingDates(selected).confirmed!):"Nicio dată confirmată în dosar"}</strong>
                  </div>
                </section>
                {selected.context&&<section className="detail-section access-section"><h3>Ce urmărești pentru o intrare timpurie</h3><p>{selected.context.nextCheckpoint}</p><div className="detail-fact"><span>Debut estimat de agregator</span><strong>{listingDates(selected).estimated?`${formatDate(listingDates(selected).estimated!)} · neconfirmat`:'Nicio zi estimată publicată în dosar'}</strong></div><p>Data unui articol, depunerea unui prospect și lansarea roadshow-ului nu sunt date de cumpărare. Accesul la subscriere și alocarea printr-un broker nu sunt confirmate de această platformă.</p></section>}
                <section className="detail-section">
                  <h3>Ce merită analizat</h3>
                  <p>{selected.opportunity}</p>
                </section>
                <section className="detail-section risk-section">
                  <h3>Riscuri & întrebări deschise</h3>
                  <p>{selected.risk}</p>
                  <p>
                    Analiza financiară și scorul de potențial nu sunt încă implementate.
                  </p>
                </section>
                <section className="detail-section">
                  <h3>Documente originale</h3>
                  <p>Rezumatul de mai sus este în română. Documentele originale se deschid separat, în limba sursei.</p>
                  {(selected.documents || [{url:selected.sourceUrl,title:selected.sourceName,publishedAt:selected.publishedAt,checkedAt:selected.checkedAt}]).map(document => (
                    <div className="evidence" key={document.url}><FileText size={18} /><div>
                      <a href={document.url} target="_blank" rel="noreferrer">{document.title} <ExternalLink size={14} /></a>
                      <p>Publicat: {formatDate(document.publishedAt)}</p>
                      <p>Verificat pentru dosar: {formatDate(document.checkedAt)}</p>
                    </div></div>
                  ))}
                </section>
                {!!associated[selected.id]?.length&&<section className="detail-section"><details><summary>Alte surse colectate ({associated[selected.id].length})</summary><p>Asociere după numele companiei; aceste linkuri nu au fost folosite automat pentru a modifica analiza. Articolele care menționează mai multe companii sunt excluse.</p>{associated[selected.id].slice(0,20).map((d:Discovery,i:number)=><div className="evidence" key={d.url}><a href={d.url} target="_blank" rel="noopener noreferrer">Sursă externă {i+1} · {d.source_name} ↗</a><small>{sourceCategory(d.source_kind)} · {formatDate(d.published_at||'')}</small></div>)}{associated[selected.id].length>20&&<p>Afișăm primele 20 de linkuri. Dosarul rezumă separat sursele verificate.</p>}</details></section>}
                <CompanyAccess research={selected.accessResearch} name={selected.name} evaluatedAt={evaluatedAt}/>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
 );
}
