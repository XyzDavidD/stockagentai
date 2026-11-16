import {runAlerts,alertStore} from './alerts.mjs';
import {feeds} from './collectors.mjs';
import {registerEarlySources} from './early-sources.mjs';
import {syncStartupDirectory} from './startup-directory.mjs';
import { documentStore, enrichDocuments } from './documents.mjs';
import { runCollection, createPersistence } from './runner.mjs';
import { collectionHealth } from './collection-health.mjs';
import { writeFile, appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { toPayload, sqlLiteral } from './collectors.mjs';
const dryRun=process.argv.includes('--dry-run');
const runKey=process.env.GITHUB_RUN_ID ? `github-${process.env.GITHUB_RUN_ID}` : `local-${randomUUID()}`;
const trigger=process.env.GITHUB_EVENT_NAME==='schedule'?'schedule':'manual';
const persist=dryRun?undefined:createPersistence({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
if(!dryRun)await registerEarlySources({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY});
const results=await runCollection({persist,runKey,trigger});
const health=collectionHealth(results);
console.log(health.summary);
if(health.status==='partial')console.log(`::warning title=Colectare parțială::${health.summary}`);
if(health.status==='failed'){console.log(`::error title=Colectare eșuată::${health.summary}`);process.exitCode=1;}
const lines=results.map(r=>`${r.id}: ${r.error || 'success'} · ${r.candidates.length} candidați`);
console.log(lines.join('\n'));
if(dryRun){
  await writeFile('/tmp/stockagentai-discovery.json',JSON.stringify(results,null,2),{mode:0o600});
  await writeFile('/tmp/stockagentai-discovery.sql','begin;\n'+results.map(r=>'select public.record_ingestion('+sqlLiteral(JSON.stringify(toPayload(r,runKey,trigger)))+'::jsonb);').join('\n')+'\ncommit;',{mode:0o600});
}
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Colectare ${dryRun?'de verificare':'Supabase'}\n\n${health.summary}\n\nHTTP_429 = furnizorul limitează cererile. RATE_LIMIT_COOLDOWN = cerere neefectuată după limitarea aceluiași furnizor; va fi reîncercată într-o rulare ulterioară. Sursele reușite sunt procesate normal.\n\n${lines.map(l=>'- '+l).join('\n')}\n\nSEC este suspendat după HTTP 403. Candidații nu sunt publicați automat.\n`);
if(!dryRun){
 if(process.env.RESEARCH_EVENTS_ENABLED==='true'){
 const alerts=await runAlerts({results,sources:feeds,store:alertStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY}),to:process.env.ALERT_EMAIL_TO,from:process.env.ALERT_EMAIL_FROM,resendKey:process.env.RESEND_API_KEY,enabled:process.env.ALERTS_ENABLED==='true'});
 console.log(`Alerte: ${alerts.created} companii noi · ${alerts.email}`);
 if(['failed','pending','uncertain'].includes(alerts.email))process.exitCode=1;
 } else console.log('Jurnal companii / alerte: neactivat, migrarea Supabase este necesară.');
 const directory=await syncStartupDirectory(documentStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY}));
 console.log(`YC: ${directory.count} profiluri de context · ${directory.skipped?'deja sincronizate azi':'sincronizate'}`);
 const docs=await enrichDocuments({store:documentStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY})});
 const summary=`Articole: ${docs.filter(d=>!d.error).length} citite, ${docs.filter(d=>d.error).length} indisponibile, ${docs.length} încercate (maximum 4/rulare).`;
 console.log(summary);
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,'\n'+summary+'\n');
 // Unavailable external articles are partial coverage, not a persistence failure.
 if(docs.some(d=>d.error))console.log(`::warning title=Articole indisponibile::${summary}`);
}
