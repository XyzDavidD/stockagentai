import {focusEvidence,focusedSourceName} from './research-focus.mjs';
import {safeEvidenceUrl} from './signals.mjs';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const companyKey=s=>norm(s).replace(/\b(inc|incorporated|ltd|limited|gmbh|sas|sa)\b/g,'').replace(/[^a-z0-9]/g,'');
// Reviewed descriptions and dated evidence, not estimates of current value or IPO status.
export const earlyProfiles=[
 {name:'UFORCE',aliases:[],country:'Regatul Unit · fondată în Ucraina',industry:'Apărare / sisteme autonome',summary:'Dezvoltă platforme fără echipaj pentru aer, uscat și mare. Compania are sediul la Londra și urmărește extinderea producției de sisteme de apărare pentru Ucraina și țările aliate.',thesis:'Finanțarea majoră susține extinderea capacității de producție. Este un semnal concret pentru urmărirea afacerii, fără a confirma o listare.',valuation:'6 mld. USD · evaluare anunțată la 12 noiembrie 2026',funding:'700 mil. USD · Series A',evidence:'Comunicatul UFORCE din 12 noiembrie 2026 anunță runda Series A și evaluarea. Nu anunță o dată de IPO.',date:'2026-11-12',url:'https://www.uforce.com/news/uforce-raises-700m-at-6-billion-valuation-from-leading-tech-and-sovereign-wealth-funds-to-scale-combat-proven-defence-systems-for-ukraine-and-allied-nations',source:'UFORCE · comunicat oficial',risks:'Extindere industrială, reglementări și dependență de achizițiile din apărare.'},
 {name:'SE3 Labs',aliases:['SE3'],country:'Germania',industry:'Apărare / inteligență artificială',summary:'Startup din München care dezvoltă software AI pentru percepție tridimensională, destinat dronelor și altor sisteme militare fără echipaj.',thesis:'Runda de capital relatată susține cercetarea și dezvoltarea într-un domeniu relevant pentru apărare. Nu demonstrează că firma va deveni unicorn.',valuation:null,funding:'30 mil. USD · Series A relatată în noiembrie 2026',evidence:'Dealroom relatează la 12 noiembrie 2026 o rundă Series A condusă de Accel. Nu avem o evaluare comunicată în această sursă.',date:'2026-11-12',url:'https://dealroom.co/news/172095-se3-raises-30m-series-a-to-give-military-drones-spatial-smarts/',source:'Dealroom · publicație neoficială',official:false,risks:'Maturitatea tehnologiei, contractele și veniturile trebuie verificate. Nu este un anunț IPO.'},
 {name:'Shield AI',aliases:['Shield'],country:'SUA',industry:'Apărare / sisteme autonome',summary:'Dezvoltă software de autonomie Hivemind și sisteme aeriene V-BAT și X-BAT. Clienții vizați sunt organizațiile de apărare; extinderea în radare urmărește integrarea senzorilor cu sistemele autonome.',thesis:'Finanțarea și extinderea tehnologică justifică urmărirea companiei. Sunt indicii de dezvoltare, nu o prognoză de randament.',valuation:'28,8 mld. USD · evaluare post-money anunțată pentru Series H',funding:'2,5 mld. USD anunțate: 1 mld. Series H, 1 mld. capital structurat, 500 mil. datorie',evidence:'Anunțul din 5 noiembrie 2026 descrie finanțarea și acordul pentru achiziția Echodyne. Cei 5,3 mld. USD reprezintă valoarea tranzacției Echodyne, nu evaluarea Shield.',date:'2026-11-05',url:'https://shield.ai/shield-to-acquire-echodyne-in-a-transaction-valued-at-5-3-billion-and-raise-2-5-billion-at-a-28-8-billion-valuation/',source:'Shield · comunicat oficial',risks:'Integrarea achiziției, aprobările și execuția industrială. Finanțarea anunțată nu înseamnă automat închidere.'},
 {name:'Mistral AI',aliases:['Mistral'],country:'Franța',industry:'Inteligență artificială',summary:'Dezvoltă modele de inteligență artificială și soluții adaptate companiilor și instituțiilor. Cercetarea și infrastructura de calcul susțin utilizarea modelelor în aplicații industriale.',thesis:'Runda majoră și participarea ASML indică interes strategic pentru tehnologia sa. Concurența și costurile de calcul rămân importante.',valuation:'11,7 mld. EUR · post-money, anunț din septembrie 2025',funding:'1,7 mld. EUR · Series C, septembrie 2025',evidence:'Comunicatul din 9 septembrie 2025 anunță Series C condusă de ASML. Sunt valori istorice din această sursă, nu evaluarea curentă.',date:'2025-09-09',url:'https://mistral.ai/news/mistral-ai-raises-1-7-b-to-accelerate-technological-progress-with-ai/',source:'Mistral AI · comunicat oficial',risks:'Concurență, monetizare și necesar ridicat de capital. Informația istorică necesită actualizare înaintea unei discuții de investiție.'},
 {name:'Helsing',aliases:[],country:'Germania',industry:'Apărare / inteligență artificială',summary:'Companie europeană de tehnologie pentru apărare, concentrată pe inteligență artificială și dezvoltarea de capabilități militare în mai multe domenii.',thesis:'Runda Series D și sprijinul investitorilor oferă un semnal concret de finanțare pentru extindere în apărare.',valuation:null,funding:'600 mil. EUR · Series D anunțată în iunie 2025',evidence:'Comunicatul din 17 iunie 2025 anunță runda condusă de Prima Materia. Nu comunică o evaluare a companiei; finanțarea este supusă unor aprobări.',date:'2025-06-17',url:'https://helsing.ai/newsroom/helsing-raises-eur600m-to-invest-in-european-technological-sovereignty',source:'Helsing · comunicat oficial',risks:'Aprobări, cicluri de achiziții militare și execuție. Suma rundei nu este evaluarea companiei.'},
];
const verbs='raises|raised|secures|secured|lands|closes|bags|attracts|announces|obtains|is valued|valued|reaches|becomes|atrage|strânge|ridică|obține|anunță|este evaluat[ăa]?|devine|lève|leve|obtient|annonce|sammelt|erhält|erhalt|erreicht|haalt|ontvangt|pozyskuje|tar in';
const prefix=/^(?:(?:the|a|an|le|la|un|une|startup(?:-ul)?|start-up(?:-ul)?|scale-up|company|compania|firma|AI|KI|IA|tech|technology|defen[cs]e|defence-tech|cybersecurity|software|drone|robotics|British|American|German|French|Romanian|Austrian|Swiss|Dutch|Polish|Swedish|European|Ukrainian|US|UK|London-based|Paris-based|Berlin-based|deutsches?|französische|startupul|românesc|românească)\s+)+/i;
/** Reject anonymous headlines and public-policy/project stories; never use the whole title as a name. */
export function identifyEarlyCompany(raw){
 const title=String(raw||'').replace(/\s+[-–|]\s+[^–|]+$/,'').trim();
 const focus=focusEvidence(title);
 if(focus.excluded)return null;
 if(/\b(government|minister|parliament|politician|guvern|ministr|dan nica|romania poate|buget|budget|infrastructure project|tarnita|lapustesti|top \d+|startups to watch)\b/.test(norm(title)))return null;
 const signal=norm(title).match(/\b(series [a-h]|serie [a-h]|unicorn\w*|soonicorn|decacorn|einhorn|licorne|valuation|valued|evaluar\w*|valoris\w*|bewertung|finanzierungsrunde|levee de fonds|funding round|runda de finantare)\b/);
 const money=title.match(/(?:[$€£]\s?\d[\d.,]*\s?(?:billion|million|bn|mln|[mb])?\b|\b\d[\d.,]*\s?(?:billion|million|miliard\w*|milioan\w*|milliard\w*|millionen|mld\.?|mil\.?|bn)\s*(?:USD|EUR|GBP|euros?|dollars?|dolari|lire)?)/i)?.[0]||null;
 const financing=/\b(rais\w*|secur\w*|fund\w*|finan\w*|investment|investit\w*|atrage|strange|leve|sammelt|erhalt)\b/.test(norm(title));
 if(!signal&&!(money&&financing))return null;
 let rawName=title.match(new RegExp(`^(.{2,100}?)\\s+(?:${verbs})\\b`,'iu'))?.[1];
 // Explicit appositive company subjects (e.g. “Quanta, a British AI startup, raises…”).
 if(rawName)rawName=rawName.split(',')[0].replace(prefix,'').trim();
 const profile=earlyProfiles.find(p=>[p.name,...p.aliases].some(n=>rawName&&companyKey(rawName)===companyKey(n)));
 const name=profile?.name||rawName;
 // Announcements by individuals are not company funding events. Unknown entities need an explicit corporate cue or a direct capital-raising verb.
 if(!profile&&!/\b(start-?up|company|compania|firma|scale-up)\b/i.test(title)&&!new RegExp(`^.{2,100}?\\s+(?:raises|raised|secures|secured|closes|lève|sammelt|erhält|atrage|strânge)\\b`,'iu').test(title))return null;
 if(!name||name.length>55||name.split(/\s+/).length>4||!/^\p{Lu}[\p{L}\p{N}&.'’ -]+$/u.test(name)||/\b(startups?|companies|firms|fund|funds|capital|venture|government|minister|europe|romania|germany|france|industry|market|sector|university|nvidia|microsoft|google|amazon|meta|apple|hidroelectrica)\b/.test(norm(name)))return null;
 if(!focus.industry&&!profile)return null;
 const kind=/unicorn|soonicorn|decacorn|einhorn|licorne|valu|evalu|valoris|bewertung/.test(signal?.[0]||'')?'valuation':'funding';
 return {key:companyKey(name),name,profile,industry:profile?.industry||focus.industry,kind,money,keywords:[...focus.keywords,...(signal?[signal[0]]:[]),...(money?[money]:[])],title};
}
/** Company-first projection shared by the radar and collection gate. */
export function earlyCompanyRows(items,{includeProfiles=true}={}){
 const grouped=new Map();
 if(includeProfiles)for(const p of earlyProfiles)grouped.set(companyKey(p.name),{key:companyKey(p.name),name:p.name,profile:p,industry:p.industry,country:p.country,kind:p.valuation?'valuation':'funding',firstSeen:'2026-11-13',sources:[{url:p.url,title:p.evidence,source:p.source,publishedAt:p.date,discoveredAt:'2026-11-13',official:p.official!==false,reviewed:true,keywords:[],money:null}]});
 for(const item of items){
  if(!focusedSourceName(item.source_name)||!safeEvidenceUrl(item.url))continue;
  const entity=identifyEarlyCompany(item.title);if(!entity)continue;
  const row=grouped.get(entity.key)||{...entity,country:entity.profile?.country||'Țară neconfirmată',firstSeen:item.discovered_at,sources:[]};
  if(!row.sources.some(s=>s.url===item.url))row.sources.push({url:item.url,title:item.title,source:item.source_name,publishedAt:item.published_at,discoveredAt:item.discovered_at,official:false,reviewed:false,keywords:entity.keywords,money:entity.money});
  if(item.discovered_at&&item.discovered_at<row.firstSeen)row.firstSeen=item.discovered_at;
  grouped.set(entity.key,row);
 }
 return [...grouped.values()].sort((a,b)=>(Date.parse(b.firstSeen)||0)-(Date.parse(a.firstSeen)||0)||a.name.localeCompare(b.name));
}
