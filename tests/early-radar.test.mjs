import test from 'node:test';
import assert from 'node:assert/strict';
import {earlySignal,uniqueEarly} from '../src/lib/early-signals.mjs';
import {earlySources,languages,parseEarlyNews,registerEarlySources} from '../scripts/early-sources.mjs';
test('project budget is not promoted to unicorn company valuation',()=>{
 assert.equal(earlySignal('Proiectul Tarnița evaluat la un miliard euro'),'project');
 assert.equal(earlySignal('Unicorn startup secures Series C'),'unicorn');
 assert.equal(earlySignal('Finanzierungsrunde für Softwarefirma'),'funding');
 assert.equal(earlySignal('Joint venture with unicorn investor'),'project');
});
test('early multilingual channels are distinct, bounded and separate from IPO discovery',()=>{
 assert.equal(languages.length,10);assert.equal(earlySources.length,20);
 assert.equal(new Set(earlySources.map(s=>s.id)).size,20);
 for(const s of earlySources){assert.ok(s.id.startsWith('early-'));assert.equal(new URL(s.url).hostname,'news.google.com');assert.match(new URL(s.url).searchParams.get('q'),/when:30d/);}
 const xml='<rss><channel><title>News</title>'+Array.from({length:25},(_,i)=>`<item><title>American AI startup ${i} raises Series A</title><link>https://news.google.com/rss/articles/${i}</link><pubDate>invalid</pubDate></item>`).join('')+'</channel></rss>';
 const items=parseEarlyNews(xml);assert.equal(items.length,20);assert.equal(items[0].publishedAt,null);assert.match(items[0].reason,/fără confirmare/);
 assert.throws(()=>parseEarlyNews('<html>Blocked</html>'));
});
test('early source registration preserves operational status and hides errors',async()=>{
 await registerEarlySources({url:'https://example.supabase.co',key:'sb_secret_test',fetcher:async(url,options)=>{if(options.method==='POST'){assert.equal(options.headers.Prefer,'resolution=ignore-duplicates');assert.equal(JSON.parse(options.body).length,20);}return {ok:true};}});
 await assert.rejects(registerEarlySources({url:'https://example.supabase.co',key:'sb_secret_test',fetcher:async()=>{throw new Error('sb_secret_test');}}),/^Error: SOURCE_REGISTRATION_NETWORK_ERROR$/);
 assert.equal(uniqueEarly([{url:'https://example.com/a?utm_source=x'},{url:'https://example.com/a'}]).length,1);
});
