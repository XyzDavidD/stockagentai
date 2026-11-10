// Deterministic title triage. No model, external API, company inference or publication.
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const rules = [
  {id:'paused', label:'Posibilă amânare / retragere', pattern:/\b(postpon\w*|delay\w*|withdraw\w*|cancel\w*|aman\w*|retrag\w*|verschob\w*|abgesagt\w*)\b/, explanation:'Titlul conține un indiciu de amânare sau retragere. Calendarul trebuie reconfirmat.'},
  {id:'roadshow', label:'Indiciu de roadshow', pattern:/\broadshow\b/, explanation:'Titlul menționează un roadshow. Acesta nu confirmă data debutului la bursă.'},
  {id:'filing', label:'Indiciu de documente', pattern:/\b(s-1|f-1|prospect\w*|registration statement)\b/, explanation:'Titlul menționează documente de ofertă. Tipul ofertei și aprobarea trebuie verificate.'},
  {id:'completed', label:'Posibil debut / eveniment încheiat', pattern:/\b(debut\w*|erstnotiz|handelsstart|begins trading|started trading|devine companie publica|incepe tranzactionarea|closes|closed)\b/, explanation:'Poate fi un debut sau un eveniment deja încheiat, nu neapărat o listare viitoare.'},
  {id:'intention', label:'Posibilă intenție de listare', pattern:/\b(intends to list|intention to float|plans?\b|plant\b|intent\w*|pregat\w*)/, explanation:'Titlul sugerează un plan. O intenție nu constituie un calendar confirmat.'},
];
export function analyzeSignal(title) {
  const text=normalize(title);
  const base={method:'Reguli pe titlu · fără AI', version:'rules-v1', date:null, needsReview:true};
  if(/\b(bonds?|notes|etfs?|etps?|anleihe\w*|zertifikat\w*|obligatiuni|fidelis|secondary offering|follow-on)\b/.test(text))
    return {...base,id:'other',label:'Posibil alt tip de instrument', explanation:'Indiciu de obligațiuni, fond sau ofertă secundară. Nu este confirmat un IPO de acțiuni.',matches:[]};
  const matches=rules.filter(r=>r.pattern.test(text));
  if(/\?|\b(rumou?rs?|speculat\w*|denies|denied|not planning|no plans|nu intentioneaza|kein\w*)\b/.test(text))
    return {...base,id:'uncertain',label:'Afirmație incertă / posibil negată',explanation:'Întrebările, zvonurile și negațiile necesită citirea sursei. Nu atribuim un stadiu companiei.',matches:matches.map(r=>r.label)};
  if(matches.length>1 && !matches.some(r=>r.id==='paused'))
    return {...base,id:'uncertain',label:'Mai multe indicii · de verificat',explanation:'Titlul conține indicii pentru stadii diferite. Contextul documentului este necesar.',matches:matches.map(r=>r.label)};
  const result=matches[0];
  return {...base,id:result?.id||'uncertain',label:result?.label||'Posibil semnal IPO',explanation:result?.explanation||'Detectat de colector prin termeni de ofertă sau listare. Titlul singur nu confirmă stadiul.',matches:matches.map(r=>r.label)};
}
export function isOldPublication(value, now=Date.now()) {
  const timestamp=Date.parse(value || '');
  return Number.isFinite(timestamp) && now-timestamp>90*24*60*60*1000;
}
export function safeEvidenceUrl(value) {
  try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
