import {load} from 'cheerio';
import {createHash} from 'node:crypto';
import {fetchBounded} from './runner.mjs';
import {analyzeSignal} from '../src/lib/signals.mjs';
const publishers={
 'www.anthropic.com':{path:'/news/',selector:'article'},
 'www.bvb.ro':{path:'/AboutUs/MediaCenter/PressItem/',selector:'.main-content'},
 'www.wienerborse.at':{path:'/news/wiener-boerse-news/',selector:'.news-single .article'},
 'www.boerse-frankfurt.de':{path:'/nachrichten/',selector:'article,main'},
 'live.deutsche-boerse.com':{path:'/nachrichten/',selector:'article,main'},
 'www.prnewswire.com':{path:'/news-releases/',selector:'article'},
};
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const norm=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function allowedDocumentUrl(value){
 try{const u=new URL(value),publisher=publishers[u.hostname];return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&!u.search&&publisher&&u.pathname.startsWith(publisher.path)?u.href:null;}catch{return null;}
}
export function extractDocument(html,url){
 if(!allowedDocumentUrl(url))throw new Error('DOCUMENT_URL_NOT_ALLOWED');
 const $=load(html),root=$(publishers[new URL(url).hostname].selector).first();
 if(!root.length)throw new Error('ARTICLE_NOT_FOUND');
 const title=clean(root.find('h1').first().text());
 if(!title)throw new Error('ARTICLE_TITLE_MISSING');
 root.find('script,style,nav,footer,aside,form,[hidden],[aria-hidden="true"],.related,.related-news').remove();
 const paragraphs=root.find('p').map((_,p)=>clean($(p).text())).get().filter(p=>p.length>=40);
 if(paragraphs.join(' ').length<120)throw new Error('ARTICLE_TEXT_MISSING');
 const relevant=paragraphs.filter(p=>/\bipo\b|initial public offering|roadshow|\bs-1\b|\bf-1\b|ofert\w* public\w*|listare|borsengang|handelsstart|erstnotiz|tranzaction/.test(norm(p)));
 if(!relevant.length)throw new Error('NO_IPO_PASSAGE');
 // Store one short quote (20 words maximum), not the article. Never infer dates from prose.
 const excerpt=relevant[0].split(/\s+/).slice(0,20).join(' ');
 const ids=new Map();
 for(const paragraph of relevant){const signal=analyzeSignal(paragraph);if(signal.id!=='uncertain'||signal.matches.length)ids.set(signal.id,signal.label);}
 const rawDate=$('meta[property="article:published_time"]').first().attr('content');
 const publication=rawDate&&/^\d{4}-\d{2}-\d{2}(T|$)/.test(rawDate)&&Number.isFinite(Date.parse(rawDate))?new Date(rawDate).toISOString():null;
 return {version:'article-rules-v1',excerpt,excerpt_truncated:relevant[0].split(/\s+/).length>20,
  publication_date:publication,indications:[...ids.values()].slice(0,6),
  paragraph_count:relevant.length,content_hash:createHash('sha256').update(paragraphs.join('\n')).digest('hex')};
}
export async function inspectDocument(item,{fetcher=fetch,now=()=>new Date().toISOString()}={}){
 let evidence=null,error=null;
 try{if(!allowedDocumentUrl(item.url))throw new Error('DOCUMENT_URL_NOT_ALLOWED');evidence=extractDocument(await fetchBounded(item.url,fetcher),item.url);}
 catch(e){error=/^[A-Z][A-Z_0-9]+$/.test(String(e.message))?e.message:'DOCUMENT_FETCH_FAILED';}
 return {url:item.url,candidate_hash:item.content_hash,attempted_at:now(),evidence,error};
}
export function documentStore({url,key,fetcher=fetch}){
 if(!url||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)||!key||/\s/.test(key))throw new Error('INVALID_DOCUMENT_STORE_CONFIG');
 const rpc=async(name,payload)=>{
  let response;try{response=await fetcher(`${url}/rest/v1/rpc/${name}`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}),'Content-Type':'application/json'},body:JSON.stringify(payload)});}catch{throw new Error('DOCUMENT_STORE_NETWORK_ERROR');}
  if(!response.ok)throw new Error(`DOCUMENT_STORE_HTTP_${response.status}`);
  return response.json();
 };
 return {queue:()=>rpc('documents_due',{}),save:payload=>rpc('record_document',{payload})};
}
export async function enrichDocuments({store,fetcher=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms))}){
 const queue=await store.queue(),results=[];
 for(const item of queue.slice(0,4)){
  const result=await inspectDocument(item,{fetcher});
  await store.save(result);results.push({error:result.error});await wait(750);
 }
 return results;
}
