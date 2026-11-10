import test from 'node:test';import assert from 'node:assert/strict';
import {parseNews,parseIpoTable,broadSources} from '../scripts/broad-sources.mjs';
import {parseYcDirectory} from '../scripts/startup-directory.mjs';
import {sourceCategory,isPossibleSpac,isSpeculative} from '../src/lib/provenance.mjs';
test('news search keeps publisher in title, date and speculation without promoting to fact',()=>{
 const r=parseNews('<rss><channel><title>News</title><item><title>Acme could plan IPO - Reuters</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Tue, 10 Nov 2026 12:00:00 GMT</pubDate></item></channel></rss>','https://news.google.com');
 assert.equal(r.length,1);assert.match(r[0].title,/Reuters/);assert.equal(isSpeculative(r[0].title),true);assert.equal(r[0].publishedAt,'2026-11-10T12:00:00.000Z');
});
test('news parser rejects broken XML and external destination injection',()=>{
 assert.throws(()=>parseNews('<html>denied</html>','https://news.google.com'));
 assert.equal(parseNews('<rss><channel><title>News</title><item><title>IPO</title><link>https://evil.example/a</link></item></channel></rss>','https://news.google.com').length,0);
});
test('filing dates are not interpreted as publication or confirmed IPO dates',()=>{
 const r=parseIpoTable('<table><thead><tr><th>Company Name</th></tr></thead><tbody><tr><td>Nov 9, 2026</td><td><a href="/stocks/abc/">ABC</a></td><td>Example Company</td></tr></tbody></table>','filings');
 assert.equal(r.length,1);assert.equal(r[0].publishedAt,null);assert.match(r[0].title,/depunere raportată/);assert.match(r[0].reason,/neoficial/);
 assert.throws(()=>parseIpoTable('<html>Paywall</html>','filings'));
});
test('YC directory preserves public or acquired status and never assigns IPO intention',()=>{
 const profiles=parseYcDirectory(JSON.stringify([{id:1,name:'Example',url:'https://www.ycombinator.com/companies/example',status:'Public',one_liner:'x '.repeat(30)}]));
 assert.equal(profiles[0].status,'Public');assert.equal(profiles[0].description.split(' ').length,20);assert.equal(profiles[0].ipo,undefined);
 assert.throws(()=>parseYcDirectory(JSON.stringify([{name:'Bad',url:'https://evil.example/companies/bad'}])));
});
test('source categories distinguish official statements, media, aggregators and distributed releases',()=>{
 assert.match(sourceCategory('Bursă'),/^Oficială/);assert.match(sourceCategory('Emitent'),/emitent/);assert.match(sourceCategory('Presă neoficială'),/^Neoficială/);assert.match(sourceCategory('Agregator neoficial'),/agregator/);assert.match(sourceCategory('Comunicate distribuite'),/de verificat/);assert.equal(isPossibleSpac('Acme Acquisition Corp IPO'),true);
});
test('all expanded sources have distinct ids and fixed HTTPS destinations',()=>{
 assert.equal(new Set(broadSources.map(s=>s.id)).size,broadSources.length);assert.ok(broadSources.every(s=>s.url.startsWith('https://')));
});
