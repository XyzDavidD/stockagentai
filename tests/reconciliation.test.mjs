import test from 'node:test';import assert from 'node:assert/strict';
import {matchCompany,compareSignal,reconcile,canonicalSource} from '../src/lib/reconciliation.mjs';
const company={id:'alpha',name:'Alpha Company',sourceUrl:'https://example.com/ipo',publishedAt:'2026-10-01',stage:'Documente depuse',documents:[]};
const item={url:company.sourceUrl,title:'Alpha Company launches roadshow',published_at:'2026-10-02',last_seen_at:'2026-11-10'};
const now=Date.parse('2026-11-10');
test('exact source takes priority and shared URLs remain ambiguous',()=>{
 assert.equal(matchCompany(item,[company]).kind,'source');assert.equal(matchCompany(item,[company,{...company,id:'beta'}]).kind,'ambiguous');
});
test('full-name boundaries avoid substrings and multiple names remain uncertain',()=>{
 assert.equal(matchCompany({...item,url:'https://example.com/new'},[company]).kind,'name');
 assert.equal(matchCompany({...item,url:'https://example.com/new',title:'Alpha Companywide IPO'},[company]).kind,'unmatched');
 assert.equal(matchCompany({...item,url:'https://example.com/new',title:'Alpha Company and Beta Company IPO'},[company,{...company,id:'beta',name:'Beta Company'}]).kind,'ambiguous');
});
test('newer stage discrepancy is proposed, never written to the company',()=>{
 const result=compareSignal(item,company,matchCompany(item,[company]),now);assert.equal(result.kind,'possible-change');assert.equal(result.suggested,'Roadshow lansat');assert.equal(company.stage,'Documente depuse');
});
test('recent discovery of old source cannot roll stage backward',()=>{
 assert.equal(compareSignal({...item,published_at:'2026-01-01'},company,{kind:'source'},now).kind,'history');
 assert.equal(compareSignal({...item,published_at:null},company,{kind:'source'},now).kind,'undated');
});
test('date conflicts, future dates and changed content require review',()=>{
 assert.equal(compareSignal({...item,document_evidence:{publication_date:'2026-09-01'}},company,{kind:'source'},now).kind,'date-conflict');
 assert.equal(compareSignal({...item,published_at:'2027-01-01'},company,{kind:'source'},now).kind,'future');
 assert.equal(compareSignal({...item,document_stale:true},company,{kind:'source'},now).kind,'changed');
});
test('same-day sources do not imply precise ordering; name matches require identity review',()=>{
 assert.equal(compareSignal({...item,published_at:'2026-10-01T23:59:00Z'},company,{kind:'source'},now).kind,'same-day');
 assert.equal(compareSignal(item,company,{kind:'name'},now).kind,'identity');
});
test('dedup strips only tracking and fragments, preserving meaningful query distinctions',()=>{
 assert.equal(canonicalSource('https://example.com/ipo?utm_source=a#part'),company.sourceUrl);
 assert.notEqual(canonicalSource('https://example.com/ipo?id=1'),canonicalSource('https://example.com/ipo?id=2'));
 const grouped=reconcile([item,{...item,url:item.url+'?utm_source=b'}],[company],now);assert.equal(grouped.groups[0].documents.length,1);assert.equal(grouped.reviewCount,1);
});
test('unmatched companies remain separate and are counted for review',()=>{
 const grouped=reconcile([{...item,url:'https://example.com/other',title:'Unknown business IPO'}],[company],now);assert.equal(grouped.unmatched.length,1);assert.equal(grouped.groups[0].documents.length,0);
});
