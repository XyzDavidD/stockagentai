import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSignal,isOldPublication,safeEvidenceUrl} from '../src/lib/signals.mjs';
test('suspension overrides positive IPO language in three languages',()=>{
 for(const title of ['Company delays IPO roadshow','Compania amână listarea','Börsengang verschoben'])assert.equal(analyzeSignal(title).id,'paused');
});
test('negation and questions do not become confirmed intentions',()=>{
 for(const title of ['Company denies IPO plans','IPO roadshow?','Company has no plans to list'])assert.equal(analyzeSignal(title).id,'uncertain');
});
test('conflicting stages require review',()=>assert.equal(analyzeSignal('S-1 filed ahead of roadshow').id,'uncertain'));
test('bonds and secondary offerings are not IPO signals',()=>{
 for(const title of ['IPO ETF launches','Bond offering prospectus','Company secondary offering'])assert.equal(analyzeSignal(title).id,'other');
});
test('never infers IPO date or confirms stage from title',()=>{
 const a=analyzeSignal('Company launches roadshow November 10, 2026');assert.equal(a.id,'roadshow');assert.equal(a.date,null);assert.equal(a.needsReview,true);
 assert.equal(analyzeSignal('Handelsstart an der Börse').id,'completed');
});
test('old dates use publication rather than discovery, unknown is not old',()=>{
 const now=Date.parse('2026-11-10');assert.equal(isOldPublication('2026-01-01',now),true);assert.equal(isOldPublication(null,now),false);assert.equal(isOldPublication('2026-11-10',now),false);
});
test('evidence links reject script schemes and embedded credentials',()=>{
 for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','invalid'])assert.equal(safeEvidenceUrl(url),null);
 assert.equal(safeEvidenceUrl('https://example.com/news'),'https://example.com/news');
});
