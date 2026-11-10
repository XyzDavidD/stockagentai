import { runCollection, createPersistence } from './runner.mjs';
import { writeFile, appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { toPayload, sqlLiteral } from './collectors.mjs';
const dryRun=process.argv.includes('--dry-run');
const runKey=process.env.GITHUB_RUN_ID ? `github-${process.env.GITHUB_RUN_ID}` : `local-${randomUUID()}`;
const trigger=process.env.GITHUB_EVENT_NAME==='schedule'?'schedule':'manual';
const persist=dryRun?undefined:createPersistence({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
const results=await runCollection({persist,runKey,trigger});
const lines=results.map(r=>`${r.id}: ${r.error || 'success'} · ${r.candidates.length} candidați`);
console.log(lines.join('\n'));
if(dryRun){
  await writeFile('/tmp/stockagentai-discovery.json',JSON.stringify(results,null,2),{mode:0o600});
  await writeFile('/tmp/stockagentai-discovery.sql','begin;\n'+results.map(r=>'select public.record_ingestion('+sqlLiteral(JSON.stringify(toPayload(r,runKey,trigger)))+'::jsonb);').join('\n')+'\ncommit;',{mode:0o600});
}
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Colectare ${dryRun?'de verificare':'Supabase'}\n\n${lines.map(l=>'- '+l).join('\n')}\n\nSEC este suspendat după HTTP 403. Candidații nu sunt publicați automat.\n`);
if(results.some(r=>r.error))process.exitCode=1;
