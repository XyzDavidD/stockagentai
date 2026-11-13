import {alertStore} from './alerts.mjs';
import {runDailySummary} from './daily-summary.mjs';
try{
 const result=await runDailySummary({store:alertStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY}),to:process.env.ALERT_EMAIL_TO,from:process.env.ALERT_EMAIL_FROM,resendKey:process.env.RESEND_API_KEY,dryRun:process.argv.includes('--dry-run')});
 console.log(JSON.stringify(result));
 if(['pending','failed','uncertain'].includes(result.status))process.exitCode=1;
}catch(error){console.error(/^DAILY_|^ALERT_STORE_|^RESEND_/.test(error.message)?error.message:'DAILY_SUMMARY_FAILED');process.exitCode=1;}
