import {registerEarlySources} from './early-sources.mjs';
import {syncStartupDirectory} from './startup-directory.mjs';
import { documentStore, enrichDocuments } from './documents.mjs';
import { runCollection, createPersistence } from './runner.mjs';
import { writeFile, appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { toPayload, sqlLiteral } from './collectors.mjs';
const dryRun=process.argv.includes('--dry-run');
const runKey=process.env.GITHUB_RUN_ID ? `github-${process.env.GITHUB_RUN_ID}` : `local-${randomUUID()}`;
const trigger=process.env.GITHUB_EVENT_NAME==='schedule'?'schedule':'manual';
const persist=dryRun?undefined:createPersistence({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
if(!dryRun)await registerEarlySources({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
const results=await runCollection({persist,runKey,trigger});
const lines=results.map(r=>`${r.id}: ${r.error || 'success'} · ${r.candidates.length} candidați`);
console.log(lines.join('\n'));
if(dryRun){
  await writeFile('/tmp/stockagentai-discovery.json',JSON.stringify(results,null,2),{mode:0o600});
  await writeFile('/tmp/stockagentai-discovery.sql','begin;\n'+results.map(r=>'select public.record_ingestion('+sqlLiteral(JSON.stringify(toPayload(r,runKey,trigger)))+'::jsonb);').join('\n')+'\ncommit;',{mode:0o600});
}
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Colectare ${dryRun?'de verificare':'Supabase'}\n\n${lines.map(l=>'- '+l).join('\n')}\n\nSEC este suspendat după HTTP 403. Candidații nu sunt publicați automat.\n`);
if(!dryRun){
 const directory=await syncStartupDirectory(documentStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY}));
 console.log(`YC: ${directory.count} profiluri de context · ${directory.skipped?'deja sincronizate azi':'sincronizate'}`);
 const docs=await enrichDocuments({store:documentStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY})});
 const summary=`Articole: ${docs.filter(d=>!d.error).length} citite, ${docs.filter(d=>d.error).length} indisponibile, ${docs.length} încercate (maximum 4/rulare).`;
 console.log(summary);
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'\n'+summary+'\n');
 // A document error is visible in the UI and makes the run non-successful.
 if(docs.some(d=>d.error))process.exitCode=1;
}
if(results.some(r=>r.error))process.exitCode=1;
