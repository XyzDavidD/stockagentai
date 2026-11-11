import type {CompanyAccessResearch} from '@/lib/data';

const kinds:Record<string,string>={official:'Document oficial',press:'Relatare de presă',platform:'Declarația platformei'};
const contactKinds:Record<string,string>={prospectus:'Documentele ofertei',ir:'Relații cu investitorii',verification:'Verificare · nu vânzare',profile:'Persoană identificată · fără contact direct',marketplace:'Piață privată · disponibilitate neconfirmată',broker:'Brokeraj · piață secundară'};
const date=(value:string)=>new Intl.DateTimeFormat('ro-RO',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value));

export default function CompanyAccess({research,name,evaluatedAt}:{research?:CompanyAccessResearch;name:string;evaluatedAt:string}){
 if(!research)return <section className="detail-section company-access" id="company-access"><h3>Acces la acțiuni și contacte</h3><p>Cercetarea intermediarilor pentru {name} nu este încă publicată. Nu avem un canal de cumpărare verificat.</p></section>;
 const stale=Date.parse(evaluatedAt)-Date.parse(research.reviewedAt)>30*86400000;
 function evidence(id:string){const source=research!.sources.find(s=>s.id===id);return source?<a className="access-evidence" href={source.url} target="_blank" rel="noopener noreferrer">Dovadă: {source.title} ↗</a>:null;}
 return <section className="detail-section company-access" id="company-access" aria-labelledby="company-access-title">
  <div className="access-heading"><span className="eyebrow">CERCETARE PENTRU ACCES TIMPURIU</span><h3 id="company-access-title">Acces la acțiuni și contacte</h3><span className="badge gray">{research.status}</span><small>Cercetat la {date(research.reviewedAt)} · confirmarea disponibilității se cere separat</small></div>
  {stale&&<p className="access-caution">Cercetare mai veche de 30 de zile. Reconfirmă mandatele și contactele înainte de utilizare.</p>}
  <p>{research.conclusion}</p>
  <div className="access-definitions"><p><strong>Înainte de IPO:</strong> cumperi acțiuni private de la un deținător sau într-o rundă autorizată.</p><p><strong>În IPO:</strong> soliciți o alocare în oferta coordonată de bănci, înainte de debutul la bursă.</p><p><strong>După listare:</strong> cumperi pe bursă. Nu este acces pre-IPO.</p></div>
  <h4>Cine gestionează oferta</h4>
  {research.parties.length?research.parties.map(p=><article className="access-party" key={p.name}><span className="badge gray">{kinds[p.kind]}</span><h5>{p.name}</h5><p>{p.role}</p>{evidence(p.evidence)}</article>):<p>Niciun distribuitor de acțiuni confirmat public în cercetarea acestui dosar.</p>}
  <h4>Pe cine poți contacta și pentru ce</h4>
  {research.contacts.map((c,i)=><article className="access-contact" key={`${c.name}-${i}`}><span className="access-contact-kind">{contactKinds[c.kind]}</span><h5>{c.name}</h5><p className="access-role">{c.role}</p><div className="access-contact-value">{c.value}</div><p>{c.purpose}</p>{c.url&&<a className="access-channel" href={c.url} target="_blank" rel="noopener noreferrer">{c.kind==='marketplace'?'Vezi canalul pentru piața privată':'Vezi profilul oficial'} ↗</a>}{evidence(c.evidence)}</article>)}
  <h4>Acces înainte de IPO</h4><p>{research.privateAccess}</p>
  <dl className="business-facts access-conditions"><dt>Pentru un investitor din România</dt><dd>{research.romaniaAccess}</dd><dt>Sumă minimă</dt><dd>{research.minimum}</dd></dl>
  <h4>Următorii pași pentru {name}</h4><ol className="access-steps">{research.nextSteps.map(step=><li key={step}>{step}</li>)}</ol>
  <details className="access-sources"><summary>Sursele cercetării ({research.sources.length})</summary>{research.sources.map(s=><div className="access-source" key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a><small>{kinds[s.kind]} · {s.publishedAt?`Publicat: ${date(s.publishedAt)}`:'Data publicării neprecizată'} · Consultat: {date(research.reviewedAt)}</small></div>)}</details>
  <p className="access-footnote">Contactele de prospect și IR nu sunt ghișee de cumpărare. Cercetarea identifică roluri și canale publice; nu confirmă o alocare, acceptarea clientului sau autorizarea unei tranzacții private. Nu am contactat aceste organizații în numele tău.</p>
 </section>;
}
