import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../src/data/${name}.json`,import.meta.url)));
const access=read('company-access');
test('every researched company including the archive has attributed access research',()=>{
 assert.deepEqual(Object.keys(access).sort(),Object.keys(read('company-context')).sort());
 for(const [id,r] of Object.entries(access)){
  const ids=r.sources.map(s=>s.id);assert.equal(new Set(ids).size,ids.length,id);
  assert.ok(r.nextSteps.length>=2,id);assert.ok(r.romaniaAccess.length>50,id);
  assert.match(r.reviewedAt,/^\d{4}-\d{2}-\d{2}$/);
  for(const s of r.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(['official','press','platform'].includes(s.kind));}
  for(const entry of [...r.parties,...r.contacts])assert.ok(ids.includes(entry.evidence),`${id}: missing evidence for ${entry.name}`);
  for(const c of r.contacts){assert.ok(!/support@|contacteu@|info@/i.test(c.value),id);assert.ok(c.purpose.length>40);if(c.url)assert.equal(new URL(c.url).protocol,'https:');}
 }
});
test('unconfirmed access never becomes an issuer mandate or purchase contact',()=>{
 assert.ok(access.openai.parties.every(p=>p.kind==='press'));
 assert.match(access.anthropic.romaniaAccess,/România nu este/);
 assert.ok(access.openai.contacts.every(c=>c.kind==='verification'));
 assert.ok(access.zilch.contacts.some(c=>c.kind==='routing'&&c.value==='comms@zilch.com'));
 assert.ok(access.zilch.contacts.some(c=>c.kind==='profile'));
 assert.ok(access.bitpanda.parties.every(p=>p.kind==='press'));
 assert.match(access.knds.romaniaAccess,/instituțional/);
 assert.match(access['electro-alfa'].status,/încheiat/);
 for(const id of ['oura','bitpanda'])assert.ok(access[id].contacts.some(c=>c.kind==='marketplace'&&/nu confirmă|nu dovedește/i.test(c.purpose)));
});
test('prospectus departments and issuer verification are distinguished from allocation',()=>{
 assert.ok(access.anthropic.contacts.some(c=>c.kind==='verification'));
 for(const r of Object.values(access))for(const c of r.contacts.filter(c=>c.kind==='prospectus'))assert.match(c.purpose,/nu confirmă|nu rezervă|stadiul actual/i);
 assert.match(access['sb-energy'].privateAccess,/NVIDIA/);
 assert.match(access['windward-bio'].conclusion,/Sanofi/);
});
test('new-company contacts have evidence and distinguish introductions from share sales',()=>{
 const early=read('early-company-access');
 for(const key of ['se3labs','uforce']){
  const r=early[key];assert.ok(r.contacts.some(c=>c.value.includes('@')));
  for(const c of r.contacts){assert.ok(r.sources.some(s=>s.id===c.evidence));assert.ok(['routing','profile'].includes(c.kind));assert.ok(!/support@|info@/i.test(c.value));}
  assert.match(r.conclusion,/Nu am identificat un distribuitor/);
 }
 assert.deepEqual(early.se3,early.se3labs);
 assert.match(early.uforce.contacts[0].purpose,/presă, nu intermediar/);
});
