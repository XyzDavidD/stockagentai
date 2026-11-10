import test from 'node:test';
import assert from 'node:assert/strict';
import {companyUniverse,estimatedCalendar,discoveryKey} from '../src/lib/universe.mjs';
const filing={url:'https://stockanalysis.com/stocks/example/',source_name:'Stock Analysis · depuneri IPO',title:'Example (EX) · IPO: depunere raportată · Nov 9, 2026',published_at:null};
test('source identities and saved verified ids survive without merging IPO evidence with YC context',()=>{
 const rows=companyUniverse([{id:'example',name:'Example',country:'SUA',stage:'Intenție anunțată'}],[filing],[{profile:{id:'example',name:'Example',status:'Active'}},{profile:{id:'listed',status:'Public'}}]);
 assert.equal(rows.length,3);assert.equal(new Set(rows.map(r=>r.id)).size,3);assert.equal(rows[0].id,'example');assert.equal(rows[2].date,null);assert.match(rows[2].stage,/neconfirmată/);
});
test('calendar excludes filing dates and unknown dates; includes only explicit reported calendar dates',()=>{
 const calendar={...filing,source_name:'Stock Analysis · calendar IPO'};
 assert.equal(estimatedCalendar([filing]).length,0);
 assert.equal(estimatedCalendar([calendar])[0].eventDate,'2026-11-09');
 assert.equal(estimatedCalendar([{...calendar,title:'No date'}]).length,0);
});
test('notification identity ignores polling but changes with new title or publication',()=>{
 assert.equal(discoveryKey(filing),discoveryKey({...filing,last_seen_at:'2026-11-11'}));
 assert.notEqual(discoveryKey(filing),discoveryKey({...filing,title:'Updated'}));
});
