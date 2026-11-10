import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBvb,parseSec,safeUrl,resultSql} from '../scripts/collectors.mjs';
const row=(name,type='Oferta Publica de Vanzare')=>`<tr><td><a href='/offer/1'>ABC</a></td><td>${name}</td>${'<td></td>'.repeat(7)}<td>${type}</td></tr>`;
test('BVB excludes government bonds and buybacks; deduplicates candidates',()=>{
 const html='<body>Oferte publice in derulare<table>'+row('MINISTERUL FINANTELOR')+row('Obligațiuni Firma')+row('ABC','Oferta Publica de Cumparare')+row('Issuer')+row('Issuer')+'</table></body>';
 assert.equal(parseBvb(html).length,1);
});
test('unrecognized pages fail rather than report empty success',()=>{
 assert.throws(()=>parseBvb('<html>Access denied</html>'));
 assert.throws(()=>parseSec('<html>denied</html>'));
});
test('SEC only accepts relevant registration candidates and safe links',()=>{
 const entries=['S-1 - Example','S-1/A - Amendment','8-K - Other'].map(t=>`<entry><title>${t}</title><link href="https://www.sec.gov/Archives/test"/></entry>`).join('');
 assert.equal(parseSec(`<feed>${entries}</feed>`).length,2);
 assert.equal(safeUrl('javascript:alert(1)','https://www.sec.gov'),null);
 assert.equal(safeUrl('https://evil.example/file','https://www.sec.gov'),null);
});
test('failed run preserves last successful date and never writes companies',()=>{
 const sql=resultSql({id:'sec',started:'2026-11-10',finished:'2026-11-10',candidates:[],error:'HTTP_403'});
 assert.ok(!sql.includes('set checked_at'));
 assert.ok(!sql.includes('public.companies'));
});
test('dedup updates last seen; content changes return candidate to review',()=>{
 const sql=resultSql({id:'bvb',started:'2026-11-10',finished:'2026-11-10',error:null,candidates:[{url:'https://www.bvb.ro/one',title:"O'Brien",text:'changed'}]});
 assert.ok(sql.includes("O''Brien")); assert.ok(sql.includes('on conflict(url)')); assert.ok(sql.includes("then 'pending'"));
});
