export const markets=[
 ['us','SUA','en-US','US','US:en','USA OR "United States" OR American','funding OR unicorn OR "Series A" OR "Series B" OR "Series C" OR "pre-IPO"','"artificial intelligence" OR "defense tech" OR cybersecurity OR "intelligence software" OR "military drones"'],
 ['uk','Regatul Unit','en-GB','GB','GB:en','UK OR British OR Britain OR London','funding OR unicorn OR "Series A" OR "Series B" OR "pre-IPO"','"artificial intelligence" OR defence OR cybersecurity OR "intelligence software"'],
 ['ro','România','ro','RO','RO:ro','România OR românesc OR București','finanțare OR investiție OR unicorn OR listare','"inteligență artificială" OR apărare OR cybersecurity OR drone OR securitate'],
 ['de','Germania','de','DE','DE:de','Deutschland OR deutsche OR Berlin OR München','Finanzierung OR Finanzierungsrunde OR Einhorn OR Börsengang','"künstliche Intelligenz" OR Rüstung OR Verteidigung OR Cybersicherheit OR Drohnen'],
 ['at','Austria','de','AT','AT:de','Österreich OR österreichisch OR Wien','Finanzierung OR Finanzierungsrunde OR Einhorn OR Börsengang','"künstliche Intelligenz" OR Verteidigung OR Cybersicherheit OR Drohnen'],
 ['fr','Franța','fr','FR','FR:fr','France OR français OR Paris','financement OR "levée de fonds" OR licorne OR "entrée en bourse"','"intelligence artificielle" OR défense OR cybersécurité OR drones'],
 ['ch','Elveția','de','CH','CH:de','Schweiz OR Schweizer OR Zürich','Finanzierung OR Finanzierungsrunde OR Börsengang','"künstliche Intelligenz" OR Verteidigung OR Cybersicherheit OR Drohnen'],
 ['nl','Țările de Jos','nl','NL','NL:nl','Nederland OR Nederlandse OR Amsterdam','financiering OR financieringsronde OR unicorn OR beursgang','"kunstmatige intelligentie" OR defensie OR cybersecurity OR drones'],
 ['pl','Polonia','pl','PL','PL:pl','Polska OR polski OR Warszawa','finansowanie OR inwestycja OR jednorożec','"sztuczna inteligencja" OR obronność OR cyberbezpieczeństwo OR drony'],
 ['sv','Suedia','sv','SE','SE:sv','Sverige OR svensk OR Stockholm','finansiering OR investering OR unicorn OR börsnotering','"artificiell intelligens" OR försvar OR cybersäkerhet OR drönare'],
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
/** @type {Array<[string, RegExp]>} */
const industries=[
 ['Apărare / sisteme autonome',/\b(defen[cs]e|military|militar|aparare|defence|defense|defensa|verteidigung|rustung|defensie|forsvar|obronnosc|dron\w*|drone\w*|autonomous|autonom\w*)\b/g],
 ['Cybersecurity / intelligence',/\b(cyber\w*|cybersecurity|cybersicherheit|cybersecurite|intelligence software|threat intelligence|securitate cibernetica|cybersakerhet)\b/g],
 ['Inteligență artificială / infrastructură AI',/\b(ai|ki|ia|artificial intelligence|inteligenta artificiala|intelligence artificielle|kunstliche intelligenz|sztuczna inteligencja|artificiell intelligens|kunstmatige intelligentie|machine learning|foundation model\w*|gpu\w*|semiconductor\w*)\b/g],
];
export function focusEvidence(title){
 const t=norm(title);
 const excluded=/\b(china|chinese|chinez\w*|chinois\w*|chinesisch\w*|japan\w*|japon\w*|japonez\w*|korea\w*|coree\w*|taiwan\w*|india|indian\w*|brazil\w*|brasil\w*|saudi\w*|dubai|singapore|singapur|israel\w*)\b/.test(t);
 const matches=industries.flatMap(([industry,re])=>{const words=[...new Set(t.match(re)||[])];return words.length?[{industry,keywords:words}]:[];});
 return {excluded,industry:matches[0]?.industry||null,keywords:matches.flatMap(m=>m.keywords)};
}
export const focusedSourceName=name=>String(name||'').startsWith('Radar focalizat ·');
export function eligibleFocused(item){return focusedSourceName(item.source_name)&&!focusEvidence(item.title).excluded&&!!focusEvidence(item.title).industry;}
