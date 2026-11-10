import {load} from 'cheerio';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {candidateReason,safeUrl} from './source-utils.mjs';
const text=v=>String(v||'').replace(/\s+/g,' ').trim();
export function parseNews(xml,base){
 if(XMLValidator.validate(xml)!==true)throw new Error('INVALID_NEWS_XML');
 const channel=new XMLParser({processEntities:false}).parse(xml).rss?.channel;
 if(!channel?.title)throw new Error('NEWS_FEED_SHAPE_CHANGED');
 const entries=channel.item?(Array.isArray(channel.item)?channel.item:[channel.item]):[];
 return [...new Map(entries.flatMap(item=>{const title=text(item.title),reason=candidateReason(title),url=safeUrl(String(item.link||''),base),ts=Date.parse(item.pubDate);return title&&reason&&url?[[url,{url,title,text:title,reason,publishedAt:Number.isFinite(ts)?new Date(ts).toISOString():null}]]:[];})).values()].slice(0,100);
}
export function parseIpoTable(html,kind){
 const $=load(html),table=$('table').filter((_,e)=>$(e).find('th').text().includes('Company Name')).first();
 if(!table.length)throw new Error('IPO_TABLE_MISSING');
 const items=[];
 // Filing date and expected trading date are NOT article publication dates.
 $('table').filter((_,e)=>$(e).find('th').text().includes('Company Name')).find('tbody tr').each((_,row)=>{
  const cells=$(row).find('td');if(cells.length<3)return;
  const name=text(cells.eq(2).text()),symbol=text(cells.eq(1).text());
  const url=safeUrl(cells.eq(1).find('a').attr('href')||'','https://stockanalysis.com');
  if(!url||!new URL(url).pathname.startsWith('/stocks/')||!name)return;
  const eventDate=text(cells.eq(0).text());
  const title=`${name} (${symbol}) · ${kind==='filings'?'IPO: depunere raportată':'IPO: calendar estimativ'} · ${eventDate}`;
  items.push({url,title,text:title,reason:'Agregator neoficial. Verifică documentele emitentului și dacă oferta este încă activă; data din titlu nu este data publicării.',publishedAt:null});
 });
 return [...new Map(items.map(i=>[i.url,i])).values()].slice(0,500);
}
export function parseRenaissance(html){
 const $=load(html);if(!$('table').length||!$('title').text().includes('IPO Calendar'))throw new Error('RENAISSANCE_SHAPE_CHANGED');
 return [...new Map($('table a[href*="/IPO-Center/News/"],table a[href*="/Profile/"]').map((_,e)=>{
  const url=safeUrl($(e).attr('href')||'','https://www.renaissancecapital.com'),name=text($(e).text());return url&&name?{url,title:`${name} · IPO în calendarul Renaissance Capital`,text:name,reason:'Calendar neoficial; nu implică o dată confirmată.',publishedAt:null}:null;
 }).get().filter(Boolean).map(i=>[i.url,i])).values()];
}
const rss=(id,name,url,area,kind='Presă neoficială')=>({id,name,url,area,kind,parse:xml=>parseNews(xml,url)});
const search=(id,area,q,hl,gl,ceid)=>rss(id,`Google News · ${area}`,`https://news.google.com/rss/search?${new URLSearchParams({q:q+' when:90d',hl,gl,ceid})}`,area,'Agregator neoficial');
export const broadSources=[
 {id:'stockanalysis-filings',name:'Stock Analysis · depuneri IPO',url:'https://stockanalysis.com/ipos/filings/',area:'SUA / internațional',kind:'Agregator neoficial',parse:h=>parseIpoTable(h,'filings')},
 {id:'stockanalysis-calendar',name:'Stock Analysis · calendar IPO',url:'https://stockanalysis.com/ipos/calendar/',area:'SUA / internațional',kind:'Agregator neoficial',parse:h=>parseIpoTable(h,'calendar')},
 rss('techcrunch','TechCrunch','https://techcrunch.com/feed/','SUA / internațional'),
 rss('eu-startups','EU-Startups','https://www.eu-startups.com/feed/','Europa'),
 rss('sifted','Sifted','https://sifted.eu/feed','Europa'),
 rss('profit','Profit.ro','https://www.profit.ro/rss','România'),
 search('news-us','SUA','IPO OR "plans to go public" OR "confidential filing"','en-US','US','US:en'),
 search('news-uk','Regatul Unit','IPO OR "intention to float" OR "London listing"','en-GB','GB','GB:en'),
 search('news-de','Germania','Börsengang OR IPO OR Börsenpläne','de','DE','DE:de'),
 search('news-at','Austria','Börsengang OR IPO OR Börsenpläne','de','AT','AT:de'),
 search('news-fr','Franța','"introduction en bourse" OR IPO','fr','FR','FR:fr'),
 search('news-ro','România','"listare la bursă" OR "ofertă publică inițială" OR IPO','ro','RO','RO:ro'),
];
