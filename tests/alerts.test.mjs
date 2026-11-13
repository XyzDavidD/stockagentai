import test from 'node:test';
import assert from 'node:assert/strict';
import {eventFromCandidate,makeEmail,sendDelivery,runAlerts} from '../scripts/alerts.mjs';
import {eligibleFocused,focusEvidence} from '../src/lib/research-focus.mjs';
const now='2026-11-13T12:00:00Z';
const candidate={title:'British AI startup Nova raises Series A funding - Publisher',publishedAt:'2026-11-13T10:00:00Z',url:'https://example.com/nova'};
test('geography and industry filters remove retired feeds and outside regions',()=>{
 assert.equal(eligibleFocused({source_name:'Radar timpuriu · Japoneză · companii',title:'AI startup raises funding'}),false);
 assert.equal(eligibleFocused({source_name:'Radar focalizat · SUA · companii',title:'Chinese AI startup raises funding'}),false);
 assert.equal(focusEvidence('UK restaurant raises capital').industry,null);
 assert.equal(eligibleFocused({source_name:'Radar focalizat · Regatul Unit · companii',title:candidate.title}),true);
});
test('alert extraction requires recent evidence, a named firm, industry and geographic cue',()=>{
 const e=eventFromCandidate(candidate,{name:'Test'},now);assert.ok(e);assert.equal(e.region,'Regatul Unit');assert.match(e.summary,/necesită verificarea/);assert.match(e.listing_evidence,/nu potențial financiar demonstrat/);
 assert.equal(eventFromCandidate({...candidate,title:'Chinese AI startup Nova raises funding'},{},now),null);
 assert.equal(eventFromCandidate({...candidate,title:'Nova raises AI funding'},{},now),null);
 assert.equal(eventFromCandidate({...candidate,publishedAt:null},{},now),null);
 assert.equal(eventFromCandidate({...candidate,publishedAt:'2026-01-01'},{},now),null);
});
test('email includes sources, dates, detected keywords and persistent dossier link',()=>{
 const e=eventFromCandidate(candidate,{name:'Test'},now),email=makeEmail([e],{from:'a@example.com',to:'b@example.com'});
 assert.deepEqual(email.to,['b@example.com']);assert.match(email.text,/https:\/\/www.stockagentai.ro\/semnale\/[a-f0-9]{64}/);assert.ok(email.text.includes(candidate.url));assert.ok(email.text.includes('Cuvinte detectate'));
});
test('provider accepts once with stable idempotency key, without claiming inbox delivery',async()=>{
 const calls=[];const status=await sendDelivery({id:'stable',payload:{text:'test'}},{now,resendKey:'secret',store:async(...args)=>calls.push(args),fetcher:async(url,options)=>{assert.equal(options.headers['Idempotency-Key'],'stable');return {ok:true,json:async()=>({id:'provider'})};}});
 assert.equal(status,'accepted');assert.equal(calls.at(-1)[2].status,'accepted');
});
test('ambiguous expired attempts are stopped instead of duplicated after provider window',async()=>{
 let requests=0;const calls=[];
 assert.equal(await sendDelivery({id:'old',attempted_at:'2026-11-10T00:00:00Z'},{now,store:async(...a)=>calls.push(a),resendKey:'secret',fetcher:async()=>requests++}),'uncertain');assert.equal(requests,0);
});
test('timeout stays pending with no leaked token and can retry with same payload',async()=>{
 assert.equal(await sendDelivery({id:'same',payload:{text:'immutable'}},{now,store:async()=>null,resendKey:'secret',fetcher:async()=>{throw new Error('secret');}}),'pending');
});
test('disabled email still records events but never sends',async()=>{
 const result=await runAlerts({results:[{id:'test',candidates:[candidate]}],sources:[{id:'test',name:'Test'}],now,enabled:false,store:async(path)=>{assert.ok(path.startsWith('research_events'));return [{}];}});assert.deepEqual(result,{created:1,email:'disabled'});
});

test('UK cannot match Ukrainian and expansion does not override explicit nationality',()=>{
 assert.equal(eventFromCandidate({...candidate,title:'Ukrainian Defence Tech UFORCE Raises AI Series A funding'},{},now),null);
 const e=eventFromCandidate({...candidate,title:'German defence AI startup SE3 Labs raises $30M as it plots UK expansion'},{},now);
 assert.equal(e.company_name,'SE3 Labs');assert.equal(e.region,'Germania');
});
