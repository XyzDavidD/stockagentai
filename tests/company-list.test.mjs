import test from 'node:test';
import assert from 'node:assert/strict';
import {companyList,newestCompanyFirst} from '../src/lib/company-list.mjs';
const old={id:'anthropic',name:'Anthropic',aliases:['Anthropic PBC'],checkedAt:'2026-11-10',publishedAt:'2026-11-13',priority:100};
const event={id:'a'.repeat(64),company_name:'SE3 Labs',region:'Germania',discovered_at:'2026-11-13T10:00:00Z',published_at:'2026-11-01',industry:'Apărare',title:'Finanțare',summary:'De cercetat',listing_evidence:'Neconfirmat',source_name:'Presă',url:'https://example.com'};
test('new discoveries precede old priority dossiers regardless of article date',()=>{
 const rows=companyList([old],[event]).sort(newestCompanyFirst);
 assert.equal(rows[0].name,'SE3 Labs');assert.equal(rows[0].signalId,event.id);assert.equal(rows[0].stage,'Semnal preliminar');
});
test('new articles about an existing identity never duplicate or promote its dossier',()=>{
 const rows=companyList([old],[event,{...event,id:'b'.repeat(64),company_name:'Anthropic PBC',discovered_at:'2026-11-14'}]).sort(newestCompanyFirst);
 assert.equal(rows.length,2);assert.equal(rows[1].id,'anthropic');assert.equal(rows[1].discoveredAt,undefined);
});
test('repeat firm discoveries keep the earliest timestamp and Romania stays officially gated',()=>{
 const rows=companyList([],[{...event,id:'b'.repeat(64),discovered_at:'2026-11-14'},event,{...event,company_name:'Romanian startup',region:'România'}]);
 assert.equal(rows.length,1);assert.equal(rows[0].discoveredAt,event.discovered_at);
});
