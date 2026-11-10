import test from 'node:test';import assert from 'node:assert/strict';
import {parseBvbNews,parseAnthropicNews,parsePrNewswire,toPayload} from '../scripts/collectors.mjs';
import {collectFeed,runCollection,fetchBounded,createPersistence} from '../scripts/runner.mjs';
const feed={id:'test',url:'https://example.com/feed',parse:()=>[]};const wait=async()=>{};
test('news excludes bonds, keeps completed events as review candidates and deduplicates',()=>{
 const a=t=>`<a href='/AboutUs/MediaCenter/PressItem/${t}/1'>${t}</a>`;
 const result=parseBvbNews(a('IPO Test')+a('IPO Test')+a('Oferta obligatiuni')+a('Compania devine companie publica'));
 assert.equal(result.length,2);assert.match(result[1].reason,/încheiat/);
});
test('issuer news discovery ignores unrelated announcements and rejects changed markup',()=>{
 assert.equal(parseAnthropicNews('<main><a href="/news/ipo">Company launches IPO</a><a href="/news/model">New model</a></main>').length,1);
 assert.throws(()=>parseAnthropicNews('<main>maintenance</main>'));
});
test('RSS retains publication date, does not interpret secondary offerings as IPO',()=>{
 const xml='<rss><channel><title>Finance</title><item><title>Company launches initial public offering</title><link>https://www.prnewswire.com/news-releases/test</link><pubDate>Tue, 10 Nov 2026 10:00:00 GMT</pubDate></item><item><title>Company secondary offering</title><link>https://www.prnewswire.com/news-releases/other</link></item></channel></rss>';
 const r=parsePrNewswire(xml);assert.equal(r.length,1);assert.equal(r[0].publishedAt,'2026-11-10T10:00:00.000Z');
});
test('HTTP 403 and 429 do not retry',async()=>{
 for(const status of [403,429]){let n=0;const r=await collectFeed(feed,{wait,fetcher:async()=>{n++;return new Response('',{status});}});assert.equal(n,1);assert.equal(r.error,'HTTP_'+status);}
});
test('temporary server failure retries once; parser failure does not',async()=>{
 let n=0;const r=await collectFeed(feed,{wait,fetcher:async()=>new Response('',{status:++n===1?503:200})});assert.equal(n,2);assert.equal(r.error,null);
 n=0;const bad=await collectFeed({...feed,parse:()=>{throw new Error('SHAPE_CHANGED');}},{wait,fetcher:async()=>{n++;return new Response('html');}});assert.equal(n,1);assert.equal(bad.error,'SHAPE_CHANGED');
});
test('body cap is enforced while reading',async()=>{
 await assert.rejects(fetchBounded(feed.url,async()=>new Response('x'.repeat(2_000_001))),/RESPONSE_TOO_LARGE/);
});
test('paused sources are skipped and persistence errors fail run',async()=>{
 let n=0;assert.equal((await runCollection({runKey:'t',wait,selected:[{...feed,paused:true}],fetcher:async()=>{n++;}})).length,0);assert.equal(n,0);
 await assert.rejects(runCollection({runKey:'t',wait,selected:[feed],fetcher:async()=>new Response('ok'),persist:async()=>{throw new Error('PERSIST_HTTP_401');}}),/PERSIST_HTTP_401/);
});
test('persist failure never exposes response or secret; validates destination',async()=>{
 assert.throws(()=>createPersistence({url:'https://evil.example',key:'secret'}));
 const persist=createPersistence({url:'https://abc.supabase.co',key:'never-log-this',fetcher:async()=>new Response('sensitive server body',{status:401})});
 await assert.rejects(persist({}),{message:'PERSIST_HTTP_401'});
});
test('payload hash stable and dates remain unknown when source has no date',()=>{
 const r={id:'a',started:'s',finished:'f',error:null,candidates:[{url:'https://example.com',title:'IPO',text:'IPO'}]};
 const p=toPayload(r,'one');assert.equal(p.candidates[0].published_at,null);assert.equal(p.candidates[0].content_hash,toPayload(r,'two').candidates[0].content_hash);
});
