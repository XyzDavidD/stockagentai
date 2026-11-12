import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {load} from 'cheerio';
import {safeUrl} from './source-utils.mjs';
import {earlySignal,earlyGroups} from '../src/lib/early-signals.mjs';
export const languages=[
 ['en','Engleză','en-US','US','US:en','unicorn OR soonicorn OR "Series C" OR "pre-IPO funding" OR "secondary share sale"','"billion dollar project" OR "joint venture" OR "gigafactory investment"'],
 ['ro','Română','ro','RO','RO:ro','unicorn OR "rundă de finanțare" OR "evaluare miliard" OR "acțiuni private"','"proiect miliard" OR "investiție miliard" OR "societate mixtă" OR "parteneriat strategic"'],
 ['de','Germană','de','DE','DE:de','Einhorn OR Unicorn OR Finanzierungsrunde OR Milliardenbewertung','Milliardenprojekt OR Milliardeninvestition OR Gemeinschaftsunternehmen'],
 ['fr','Franceză','fr','FR','FR:fr','licorne OR "levée de fonds" OR "valorisation milliard"','"projet milliard" OR coentreprise OR "investissement industriel"'],
 ['es','Spaniolă','es','ES','ES:es','unicornio OR "ronda de financiación" OR "valoración mil millones"','"proyecto mil millones" OR "empresa conjunta" OR "inversión industrial"'],
 ['it','Italiană','it','IT','IT:it','unicorno OR "round di finanziamento" OR "valutazione miliardo"','"progetto miliardo" OR "joint venture" OR "investimento industriale"'],
 ['pt','Portugheză','pt-BR','BR','BR:pt-419','unicórnio OR "rodada de investimento" OR "avaliação bilhão"','"projeto bilhão" OR "investimento industrial" OR "joint venture"'],
 ['nl','Neerlandeză','nl','NL','NL:nl','eenhoorn OR unicorn OR financieringsronde','miljardenproject OR miljardeninvestering OR "joint venture"'],
 ['pl','Poloneză','pl','PL','PL:pl','jednorożec OR "runda finansowania" OR "wycena miliard"','"projekt miliard" OR "inwestycja miliard" OR "joint venture"'],
 ['sv','Suedeză','sv','SE','SE:sv','enhörning OR unicorn OR finansieringsrunda','miljardprojekt OR miljardinvestering OR samriskföretag'],
 ['ja','Japoneză','ja','JP','JP:ja','ユニコーン OR 資金調達 OR 上場準備','大型投資 OR 合弁会社 OR データセンター'],
 ['ko','Coreeană','ko','KR','KR:ko','유니콘 OR 투자유치 OR 상장준비','대규모투자 OR 합작법인 OR 데이터센터'],
 ['zh','Chineză','zh-TW','TW','TW:zh-Hant','獨角獸 OR 融資 OR 上市計畫 OR 独角兽','大型投資 OR 合資公司 OR 資料中心'],
 ['ar','Arabă','ar','SA','SA:ar','يونيكورن OR "جولة تمويل" OR "شركة ناشئة"','"مشروع مليار" OR "مشروع مشترك" OR "مركز بيانات"'],
];
export function parseEarlyNews(xml){
 if(XMLValidator.validate(xml)!==true)throw new Error('INVALID_EARLY_XML');
 const channel=new XMLParser({processEntities:false}).parse(xml).rss?.channel;
 if(!channel?.title)throw new Error('EARLY_FEED_SHAPE_CHANGED');
 const items=channel.item?(Array.isArray(channel.item)?channel.item:[channel.item]):[];
 const result=new Map();
 for(const item of items){
  const title=load(String(item.title||'' )).text().replace(/\s+/g,' ').trim().slice(0,500);
  const snippet=load(String(item.description||'')).text();
  const url=safeUrl(String(item.link||''),'https://news.google.com');
  if(!title||!url||/filefish|desfile do unicornio|pijany kierowca|coffeeshop|オフィシャルHP|ツアー|financing scam|funding scam/i.test(title.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))continue;
  const ts=Date.parse(item.pubDate),kind=earlySignal(title+' '+snippet);
  result.set(url,{url,title,text:title+' '+snippet.slice(0,1000),publishedAt:Number.isFinite(ts)?new Date(ts).toISOString():null,reason:`Radar timpuriu · ${earlyGroups[kind]}. Indiciu automat, fără confirmare de listare sau evaluare financiară.`});
 }
 return [...result.values()].sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0)).slice(0,20);
}
const context={en:'startup OR company OR valuation OR funding OR investment OR energy OR infrastructure',ro:'startup OR companie OR finanțare OR investiție OR energie OR infrastructură',de:'Startup OR Unternehmen OR Finanzierung OR Investition OR Energie',fr:'startup OR entreprise OR financement OR investissement OR énergie',es:'startup OR empresa OR financiación OR inversión OR energía',it:'startup OR azienda OR finanziamento OR investimento OR energia',pt:'startup OR empresa OR financiamento OR investimento OR energia',nl:'startup OR bedrijf OR financiering OR investering OR energie',pl:'startup OR firma OR finansowanie OR inwestycja OR energia',sv:'startup OR företag OR finansiering OR investering OR energi',ja:'スタートアップ OR 企業 OR 資金調達 OR 投資 OR エネルギー',ko:'스타트업 OR 기업 OR 투자 OR 에너지',zh:'新創 OR 企業 OR 投資 OR 能源 OR 公司',ar:'شركة OR استثمار OR تمويل OR طاقة'};
export const earlySources=languages.flatMap(([code,name,hl,gl,ceid,growth,project])=>[growth,project].map((q,i)=>({id:`early-${code}-${i}`,name:`Radar timpuriu · ${name} · ${i?'proiecte':'companii'}`,area:name,kind:'Agregator neoficial',url:`https://news.google.com/rss/search?${new URLSearchParams({q:`(${q}) (${context[code]}) when:90d`,hl,gl,ceid})}`,parse:parseEarlyNews})));
// Register only new public source metadata. Existing operational status is preserved.
export async function registerEarlySources({url,key,fetcher=fetch}){
 if(!key||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url||''))throw new Error('INVALID_SOURCE_CONFIGURATION');
 let r;try{r=await fetcher(`${url}/rest/v1/research_sources?on_conflict=id`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates'},body:JSON.stringify(earlySources.map(({parse,...s})=>({...s,status:'Pregătit',detail:'Radar timpuriu multilingv. Indicii neconfirmate; fără publicare automată în dosarele IPO.'})))});}catch{throw new Error('SOURCE_REGISTRATION_NETWORK_ERROR');}
 if(!r.ok)throw new Error('SOURCE_REGISTRATION_HTTP_'+r.status);
}
