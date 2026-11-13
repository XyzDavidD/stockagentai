import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {load} from 'cheerio';
import {safeUrl} from './source-utils.mjs';
import {earlySignal,earlyGroups} from '../src/lib/early-signals.mjs';
import {markets,focusEvidence} from '../src/lib/research-focus.mjs';
export const languages=markets;
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
  const focus=focusEvidence(title);if(focus.excluded||!focus.industry)continue;
  const ts=Date.parse(item.pubDate),kind=earlySignal(title+' '+snippet);
  result.set(url,{url,title,text:title+' '+snippet.slice(0,1000),publishedAt:Number.isFinite(ts)?new Date(ts).toISOString():null,reason:`Radar timpuriu · ${earlyGroups[kind]}. Indiciu automat, fără confirmare de listare sau evaluare financiară.`});
 }
 return [...result.values()].sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0)).slice(0,20);
}
export const earlySources=markets.flatMap(([code,name,hl,gl,ceid,geo,growth,sectors])=>[growth,'"joint venture" OR "strategic investment" OR "parteneriat" OR "infrastructure investment"'].map((q,i)=>({id:`early-v2-${code}-${i}`,name:`Radar focalizat · ${name} · ${i?'proiecte':'companii'}`,area:name,kind:'Agregator neoficial',url:`https://news.google.com/rss/search?${new URLSearchParams({q:`(${q}) (${sectors}) (${geo}) -China -Japan -Taiwan -India when:30d`,hl,gl,ceid})}`,parse:parseEarlyNews})));
// Register only new public source metadata. Existing operational status is preserved.
export async function registerEarlySources({url,key,fetcher=fetch}){
 if(!key||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url||''))throw new Error('INVALID_SOURCE_CONFIGURATION');
 let r;try{r=await fetcher(`${url}/rest/v1/research_sources?on_conflict=id`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates'},body:JSON.stringify(earlySources.map(({parse,...s})=>({...s,status:'Pregătit',detail:'Radar timpuriu multilingv. Indicii neconfirmate; fără publicare automată în dosarele IPO.'})))});}catch{throw new Error('SOURCE_REGISTRATION_NETWORK_ERROR');}
 if(!r.ok)throw new Error('SOURCE_REGISTRATION_HTTP_'+r.status);
 const retired=await fetcher(`${url}/rest/v1/research_sources?id=like.early-*&id=not.like.early-v2-*`,{method:'PATCH',redirect:'error',signal:AbortSignal.timeout(15000),headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json'},body:JSON.stringify({status:'Suspendat · domeniu restrâns',detail:'Canal vechi oprit: înlocuit de radarul SUA / Europa, concentrat pe AI, apărare și cybersecurity.'})}).catch(()=>{throw new Error('SOURCE_REGISTRATION_NETWORK_ERROR');});
 if(!retired.ok)throw new Error('SOURCE_RETIRE_HTTP_'+retired.status);
}
