import type {Company,CompanyAccessResearch} from './data';
import {earlyProfiles,companyKey} from './early-companies.mjs';
import access from '@/data/early-company-access.json';
export type EarlyRow={key:string;name:string;country:string;industry:string;firstSeen:string;sources:{url:string;title:string;source:string;publishedAt:string|null;official:boolean}[]};
export function enrichCompany(company:Company):Company{
 const profile=earlyProfiles.find(p=>[p.name,...p.aliases].some(n=>companyKey(n)===companyKey(company.name)));
 const research=(access as Record<string,CompanyAccessResearch>)[companyKey(company.name)];
 if(!profile)return {...company,accessResearch:company.accessResearch||research};
 // Existing editorial listing evidence is never replaced by a funding profile.
 if(company.context)return {...company,accessResearch:company.accessResearch||research};
 return {...company,summary:profile.summary,country:profile.country,sector:profile.industry,
 sourceLabel:'Profil de creștere documentat · IPO neconfirmat',opportunity:profile.thesis,risk:profile.risks,
 signal:profile.evidence+' Acest anunț nu confirmă o intenție sau o dată de IPO.',
 accessResearch:company.accessResearch||research,
 context:{theme:'Creștere',focus:true,business:{description:profile.summary,products:'Vezi descrierea documentată a activității.',customers:'Detaliile comerciale necesită verificare directă.',model:'Modelul economic și veniturile nu sunt verificate în acest profil.',sourceUrl:profile.url},listingEvidence:[{sourceName:profile.source,url:profile.url,publishedDate:profile.date,dateExplanation:'Data anunțului de finanțare, nu data listării.',statement:profile.evidence,kind:profile.official===false?'press':'official'}],nextCheckpoint:`Evaluare: ${profile.valuation||'Necomunicată în sursa analizată'}. Finanțare: ${profile.funding}. Confirmă cu reprezentantul companiei existența unei runde deschise sau a unui transfer autorizat.`,listingDate:null,estimatedListingDate:null}};
}
export function earlyRowCompany(row:EarlyRow):Company{
 const source=row.sources[0];
 return enrichCompany({id:`early-${row.key}`,name:row.name,monogram:row.name.slice(0,2),color:'mint',country:row.country,flag:'',sector:row.industry,discoveredAt:row.firstSeen,exchange:'Bursă neconfirmată',stage:'Semnal preliminar',confidence:'Scăzută',priority:0,publishedAt:source?.publishedAt||'',checkedAt:'',official:source?.official||false,sourceLabel:'Radar timpuriu',sourceUrl:source?.url||'',sourceName:source?.source||'',summary:`Companie din ${row.industry}. Activitatea exactă necesită cercetare suplimentară.`,signal:'Semnal de finanțare sau evaluare, fără plan IPO confirmat. '+(source?.title||''),date:null,dateLabel:'Fără calendar confirmat',evidence:row.sources.length,opportunity:'De cercetat pe baza surselor de mai jos.',risk:'O rundă de capital nu garantează creșterea sau listarea.',documents:row.sources.map(s=>({url:s.url,title:s.title,publishedAt:s.publishedAt||'',checkedAt:''}))});
}
