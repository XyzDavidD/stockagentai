import { load } from 'cheerio';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { createHash } from 'node:crypto';
export const feeds = [
  {id:'bvb', url:'https://www.bvb.ro/tradingandstatistics/trading/publicoffers', parse:parseBvb},
  {id:'sec', url:'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=S-1&count=40&output=atom', parse:parseSec},
];
const normalized = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
export function safeUrl(value, base) {
  try { const u = new URL(value,base); return u.protocol === 'https:' && u.hostname === new URL(base).hostname ? u.href : null; } catch {return null;}
}
export function parseBvb(html) {
  const $ = load(html);
  if (!normalized($('body').text()).includes('Oferte publice in derulare') && !normalized($('body').text()).includes('Oferte Publice in derulare')) throw new Error('UNEXPECTED_BVB_PAGE');
  if (!$('table').length) throw new Error('BVB_TABLE_MISSING');
  const candidates = [];
  $('tr').each((_,row) => {
    const cells=$(row).find('td');
    if(cells.length < 10) return;
    const text = normalized($(row).text());
    // Current public offers also include sovereign/corporate bonds and buybacks.
    if(/ministerul finantelor|fidelis|obligatiuni|rascumparare|cumparare/i.test(text)) return;
    if(!/oferta publica de vanzare/i.test(text)) return;
    const url = safeUrl(cells.first().find('a').attr('href') || '', feeds[0].url);
    if (!url || url === feeds[0].url) return;
    candidates.push({url,title:normalized(cells.eq(1).text()),text});
  });
  // These are candidates only, never automatic IPO claims.
  return [...new Map(candidates.map(c=>[c.url,c])).values()];
}
export function parseSec(xml) {
  if(XMLValidator.validate(xml) !== true) throw new Error('INVALID_SEC_XML');
  const feed=new XMLParser({ignoreAttributes:false,processEntities:false}).parse(xml).feed;
  if(!feed) throw new Error('UNEXPECTED_SEC_PAGE');
  const entries=feed.entry ? (Array.isArray(feed.entry) ? feed.entry : [feed.entry]) : [];
  return entries.flatMap(e => {
    const title=String(e.title || '');
    if(!/^(S-1|F-1)(\/A)?\s*-/.test(title)) return [];
    const links=Array.isArray(e.link) ? e.link : [e.link];
    const link=links.find(l=>l?.['@_href']);
    const url=safeUrl(link?.['@_href'] || '', 'https://www.sec.gov');
    return url ? [{url,title,text:String(e.summary?.['#text'] || e.summary || title)}] : [];
  });
}
export const sqlLiteral = value => value == null ? 'null' : "'"+String(value).replaceAll("'","''")+"'";
export function resultSql(result) {
  const q=sqlLiteral, {id,started,finished,candidates,error}=result;
  const lines=[`insert into public.ingestion_runs(source_id,started_at,finished_at,status,candidate_count,error_code) values (${q(id)},${q(started)},${q(finished)},${q(error?'error':'success')},${candidates.length},${q(error)});`];
  if(error) lines.push(`update public.research_sources set status='Eroare colectare',detail=${q(error+' · Ultima verificare reușită rămâne neschimbată.')} where id=${q(id)};`);
  else {
    lines.push(`update public.research_sources set status='Colectare reușită',checked_at=${q(finished)},detail=${q(candidates.length+' candidați pentru revizuire. Rulare la cerere; programarea periodică nu este activată.')} where id=${q(id)};`);
    for(const c of candidates) {
      const hash=createHash('sha256').update(c.text).digest('hex');
      lines.push(`insert into public.ingestion_candidates(url,source_id,title,content_hash,last_seen_at) values (${q(c.url)},${q(id)},${q(c.title)},${q(hash)},${q(finished)}) on conflict(url) do update set last_seen_at=excluded.last_seen_at, review_status=case when ingestion_candidates.content_hash <> excluded.content_hash then 'pending' else ingestion_candidates.review_status end, title=excluded.title,content_hash=excluded.content_hash;`);
    }
  }
  return lines.join('\n');
}
