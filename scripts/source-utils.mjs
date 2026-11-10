const normalized = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
export function safeUrl(value, base) {
  try { const u = new URL(value,base); return u.protocol === 'https:' && u.hostname === new URL(base).hostname && !u.username && !u.password ? (u.hash='',u.href) : null; } catch {return null;}
}
export function candidateReason(title) {
  const text = normalized(title).toLowerCase();
  if (/obligatiuni|titluri de stat|fidelis|anleihe|zertifikat|\betps?\b|\betfs?\b|\bbonds?\b|\bnotes\b|secondary offering|follow-on/.test(text)) return null;
  if (/\bipos?\b|borsengang|boersengang|borsendebut|boersendebuet|handelsstart|erstnotiz|neuemission|intends to list|intention to float|initial public offering|ofert[ae] public[ae] initial|s-1|f-1|roadshow|intentia.*list|debut|devine companie publica|incepe.*tranzaction|se listeaza|listare la bursa|introduction en bourse|borsenplane|plans to go public|confidential filing/.test(text)) {
    return /clos(es|ed|ing)|handelsstart|erstnotiz|debut|devine companie publica|incepe.*tranzaction/.test(text) ? 'Posibil eveniment încheiat — verifică stadiul' : 'Posibil semnal IPO — necesită verificare';
  }
  return null;
}
