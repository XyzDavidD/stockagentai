import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeDossiers,relatedSources} from '../src/lib/dossiers.mjs';
import fs from 'node:fs';
const base={id:'anthropic',name:'Anthropic',checkedAt:'2026-11-10',publishedAt:'2026-11-10',stage:'Roadshow lansat',sourceUrl:'https://example.com/announcement',documents:[]};
test('reviewed aliases merge into one identity and preserve saved company ids',()=>{
 const result=mergeDossiers([base],[{...base,id:'anthropic-pbc',name:'Anthropic, PBC',aliases:['Anthropic'],checkedAt:'2026-11-11',documents:[{url:'https://example.com/doc?utm_source=x'},{url:'https://example.com/doc'}]}]);
 assert.equal(result.length,1);assert.equal(result[0].id,'anthropic');assert.equal(result[0].documents.length,1);
});
test('ambiguous mentions and substring matches cannot pollute another company dossier',()=>{
 const other={...base,id:'openai',name:'OpenAI',sourceUrl:'https://example.com/openai'};
 const items=[{url:'https://example.com/a',title:'Anthropic and OpenAI IPO'},{url:'https://example.com/b',title:'Anthropically unrelated IPO'},{url:'https://example.com/c',title:'Anthropic IPO'},{url:'https://example.com/c?utm_campaign=x',title:'Anthropic IPO'},{url:base.sourceUrl,title:'Anthropic IPO'}];
 const related=relatedSources(items,[base,other]);assert.equal(related.anthropic.length,1);assert.equal(related.openai.length,0);
});
test('each published supplement has Romanian analysis, dated review and external sources; no duplicate identities',()=>{
 const rows=JSON.parse(fs.readFileSync(new URL('../src/data/researched-companies.json',import.meta.url)));
 assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 for(const r of rows){for(const field of ['summary','signal','opportunity','risk'])assert.ok(r[field].length>60,`${r.id}: ${field}`);assert.match(r.sourceUrl,/^https:\/\//);assert.equal(r.date,null);assert.ok(r.documents.length);assert.equal(r.checkedAt,'2026-11-11');}
 assert.equal(rows.find(r=>r.id==='oura').stage,'Amânată');assert.equal(rows.find(r=>r.id==='nscale').stage,'Posibilă amânare');
});
