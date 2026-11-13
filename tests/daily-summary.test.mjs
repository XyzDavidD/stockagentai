import test from 'node:test';
import assert from 'node:assert/strict';
import {summaryWindow,dailyEmail,runDailySummary} from '../scripts/daily-summary.mjs';
test('21:00 Bucharest follows winter and summer offsets and DST day length',()=>{
 assert.deepEqual(summaryWindow('2026-11-13T19:05:00Z'),{date:'2026-11-13',start:'2026-11-12T22:00:00.000Z',end:'2026-11-13T19:00:00.000Z'});
 assert.equal(summaryWindow('2026-07-13T18:01:00Z').end,'2026-07-13T18:00:00.000Z');
 const spring=summaryWindow('2026-03-29T18:01:00Z');assert.equal(spring.start,'2026-03-28T22:00:00.000Z');assert.equal(spring.end,'2026-03-29T18:00:00.000Z');
 const autumn=summaryWindow('2026-10-25T19:01:00Z');assert.equal(autumn.start,'2026-10-24T21:00:00.000Z');
});
test('late retry after midnight retains the previous report day',()=>{
 assert.equal(summaryWindow('2026-11-13T22:10:00Z').date,'2026-11-13');
 assert.equal(summaryWindow('2026-11-13T10:00:00Z',true).date,'2026-11-13');
});
test('empty-day mail still reports health and makes missing collection explicit',()=>{
 const email=dailyEmail({events:[],runs:[],newDocuments:0},summaryWindow('2026-11-13T19:00:00Z'),{to:'test@example.com',from:'test@example.com'});
 assert.match(email.text,/nu au fost înregistrate companii noi/);assert.match(email.text,/Nu există rulări/);assert.match(email.text,/21:00/);
});
test('daily delivery persists before send and repeated runs never resend',async()=>{
 let saved,sends=0;const store=async(path,method,body)=>{if(method==='POST'){saved=body;return [body];}if(path.startsWith('email_deliveries?'))return saved?[{...saved,status:'accepted'}]:[];return [];};
 const options={store,to:'test@example.com',from:'test@example.com',resendKey:'secret',now:'2026-11-13T19:01:00Z',sender:async d=>{assert.equal(d,saved);sends++;return 'accepted';}};
 assert.equal((await runDailySummary(options)).status,'accepted');assert.equal((await runDailySummary({...options,now:'2026-11-13T19:15:00Z'})).status,'already-sent');assert.equal(sends,1);assert.match(saved.id,/^daily-2026-11-13-/);
});
test('pending retries reuse original email even if source data changes',async()=>{
 const original={id:'daily',status:'pending',payload:{text:'immutable'}};
 const result=await runDailySummary({store:async path=>{assert.match(path,/^email_deliveries/);return [original];},to:'a',from:'b',resendKey:'key',now:'2026-11-13T19:15:00Z',sender:async d=>{assert.equal(d,original);return 'accepted';}});assert.equal(result.status,'accepted');
});
test('preview reads all three sources without writing or sending',async()=>{
 const paths=[];const r=await runDailySummary({dryRun:true,now:'2026-11-13T15:00:00Z',store:async(path,method)=>{assert.equal(method,undefined);paths.push(path);return [];},sender:()=>assert.fail('must not send')});assert.equal(r.status,'preview');assert.equal(paths.length,3);assert.ok(paths.every(p=>p.includes('lt.2026-11-13T15')));
});
test('partial data failure prevents incomplete report delivery',async()=>{
 await assert.rejects(runDailySummary({store:async path=>{if(path.startsWith('email_deliveries'))return [];throw new Error('ALERT_STORE_HTTP_500');},to:'a',from:'b',resendKey:'key',now:'2026-11-13T19:00:00Z',sender:()=>assert.fail('must not send')}),/ALERT_STORE_HTTP_500/);
});
