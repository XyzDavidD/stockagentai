// Discovery clues only. Never establishes an IPO, company valuation or eligibility.
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const earlyGroups={project:'Proiect / parteneriat',unicorn:'Unicorn / evaluare relatată',funding:'Finanțare / creștere',liquidity:'Acțiuni private',lead:'Semnal de cercetat'};
export function earlySignal(value){
 const t=norm(value);
 if(/joint venture|gigafactor|data cent|datacenter|proiect|project|projet|projekt|proyecto|progetto|projeto|centrala|hydro|hidro|infrastruct|infrastruktur|infrastrutt|infrastructuur|项目|項目|計画|프로젝트|مشروع/.test(t))return 'project';
 if(/unicorn|soonicorn|decacorn|einhorn|licorne|licorn|eenhoorn|jednoroz|enhorn|ユニコーン|独角兽|獨角獸|유니콘|يونيكورن/.test(t))return 'unicorn';
 if(/tender offer|secondary share|private share|liquidity|actiuni private/.test(t))return 'liquidity';
 if(/series [a-f]|funding|financ|finanz|finant|levee|capital|investment|investit|investic|investim|fundrais|融资|融資|資金調達|투자|تمويل/.test(t))return 'funding';
 return 'lead';
}
export function earlyIdentity(item){
 try{const u=new URL(item.url);u.hash='';for(const k of [...u.searchParams.keys()])if(k.startsWith('utm_'))u.searchParams.delete(k);return u.href;}catch{return null;}
}
export function uniqueEarly(items){
 const seen=new Set();return items.filter(item=>{const key=earlyIdentity(item);if(!key||seen.has(key))return false;seen.add(key);return true;});
}
