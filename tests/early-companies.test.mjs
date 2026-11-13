import test from 'node:test';
import assert from 'node:assert/strict';
import {identifyEarlyCompany,earlyCompanyRows} from '../src/lib/early-companies.mjs';
import {parseEarlyNews} from '../scripts/early-sources.mjs';
import {eventFromCandidate} from '../scripts/alerts.mjs';
const political='Dan Nica: România poate atrage finanțări importante pentru energie, industrie și apărare - Viata Libera';
const item=(title,url='https://example.com/news')=>({title,url,source_name:'Radar focalizat · SUA · companii',area:'SUA',discovered_at:'2026-11-12',published_at:'2026-11-11'});
test('policy news, projects, unnamed companies and public giants are not companies in radar',()=>{
 for(const t of [political,'Trump announces private-sector $500 billion investment in AI infrastructure - Reuters','Romanian AI infrastructure project raises $1 billion','AI startup raises $20 million','Microsoft raises $20 billion for AI','Top 10 AI startups to watch at unicorn valuations','China AI startup Nova raises $40 million'])assert.equal(identifyEarlyCompany(t),null,t);
 assert.equal(earlyCompanyRows([item(political)],{includeProfiles:false}).length,0);
 assert.equal(eventFromCandidate({title:political,publishedAt:'2026-11-13',url:'https://example.com'},{},'2026-11-13T12:00:00Z'),null);
});
test('new companies are identified by their own subject name and strong growth evidence',()=>{
 for(const [t,n] of [['British AI startup Nova raises Series A funding','Nova'],['Romanian AI startup Vectora atrage 20 milioane euro','Vectora'],['French AI startup Lucide lève 40 millions euros','Lucide'],['German defence AI startup SE3 Labs raises $30M','SE3 Labs']])assert.equal(identifyEarlyCompany(t)?.name,n);
 assert.equal(identifyEarlyCompany('Nova invests in AI innovation'),null);
 assert.equal(identifyEarlyCompany('British AI startup Nova raises funding'),null);
});
test('sources merge by company, aliases merge with documented profiles, date is first detection',()=>{
 const rows=earlyCompanyRows([item('Mistral raises €1 billion AI funding'),item('Mistral AI raises €2 billion AI funding','https://example.com/second'),{...item('Mistral AI raises €2 billion AI funding','https://example.com/second'),discovered_at:'2026-11-13'}]);
 const m=rows.find(r=>r.name==='Mistral AI');assert.equal(rows.filter(r=>r.name==='Mistral AI').length,1);assert.equal(m.sources.length,3);assert.equal(m.firstSeen,'2026-11-12');
 assert.match(m.profile.valuation,/2025/);
 const unknown=earlyCompanyRows([item('British AI startup Nova raises $20 million')],{includeProfiles:false})[0];assert.equal(unknown.country,'Țară neconfirmată');assert.equal(unknown.profile,undefined);assert.equal(unknown.sources[0].money,'$20 million');
});
test('collector drops general news before persistence, not just in UI',()=>{
 const xml=`<rss><channel><title>News</title><item><title>${political}</title><link>https://news.google.com/rss/articles/no</link></item><item><title>British AI startup Nova raises $40 million</title><link>https://news.google.com/rss/articles/yes</link></item></channel></rss>`;
 const result=parseEarlyNews(xml);assert.equal(result.length,1);assert.equal(result[0].url,'https://news.google.com/rss/articles/yes');
});
test('early alerts use company gate without disabling separate IPO alerts',()=>{
 const now='2026-11-13T12:00:00Z';
 const candidate={title:'Trump announces private-sector $500 billion investment in AI infrastructure - Reuters',url:'https://example.com/x',publishedAt:now};
 assert.equal(eventFromCandidate(candidate,{name:'Radar focalizat · SUA · companii'},now),null);
 const ipo=eventFromCandidate({...candidate,title:'American AI startup Nova files IPO registration statement'},{name:'IPO news'},now);
 assert.ok(ipo);
});
